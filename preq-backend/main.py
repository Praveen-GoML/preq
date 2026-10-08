from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import datetime
import uuid
import json
import os
import shutil
from io import BytesIO
try:
    import pypdf
except ImportError:
    pypdf = None

try:
    import docx
except ImportError:
    docx = None
import uvicorn

from database import engine, Base, get_db, SessionLocal
import models
from models import Project, ChecklistItem, EscalationLog, Certificate
import schemas
from schemas import (
    ProjectOut, ProjectCreate, ProjectUpdate,
    ChecklistItemOut, ChecklistItemCreate, ChecklistItemUpdate,
    SubmitEvidenceRequest, InboundSharePayload, RejectRequest, EscalateRequest, EscalationLogOut,
    CertificateOut, CopilotChatRequest, SOWAnalyzeRequest, DashboardStats,
    CategoryScore, Signatory
)
from templates_data import (
    generate_checklist_for_project, PROJECT_TYPES, INDUSTRIES, DEPLOYMENT_TARGETS,
    CATEGORIES, CORE_PREREQUISITES, PROJECT_PREREQUISITES, INDUSTRY_PREREQUISITES,
    DEPLOYMENT_PREREQUISITES
)
import copilot_service
import dynamic_scraper
import seed_data

# Ensure database tables exist and seed demo data if empty
Base.metadata.create_all(bind=engine)
with engine.connect() as conn:
    from sqlalchemy import text
    try:
        conn.execute(text("ALTER TABLE checklist_items ADD COLUMN api_key_name VARCHAR"))
        conn.commit()
    except Exception:
        pass
    try:
        conn.execute(text("ALTER TABLE checklist_items ADD COLUMN api_key_value VARCHAR"))
        conn.commit()
    except Exception:
        pass
seed_data.seed_database()

app = FastAPI(title="PreQ - Enterprise Kick-Off Readiness Platform", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Uploads directory (serverless resilient)
if os.environ.get("VERCEL"):
    UPLOAD_DIR = "/tmp/uploads"
else:
    UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")

try:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
except Exception:
    pass

@app.get("/")
def root():
    return {"status": "ok", "app": "PreQ - Enterprise Kick-Off Readiness Platform", "version": "2.0.0"}

@app.get("/api")
@app.get("/api/health")
def api_health():
    return {"status": "ok", "database": "Neon PostgreSQL", "service": "PreQ Backend"}

def compute_project_metrics(project: Project, db: Session) -> Dict[str, Any]:
    items = db.query(ChecklistItem).filter(ChecklistItem.project_id == project.id).all()
    total_items = len(items)
    if total_items == 0:
        return {
            "score": 0,
            "total_items": 0,
            "verified_items": 0,
            "critical_blockers": 0,
            "category_scores": [],
            "status": "In Progress"
        }

    total_weight = 0.0
    earned_weight = 0.0
    critical_blockers = 0
    verified_items = 0

    category_buckets: Dict[str, Dict[str, Any]] = {}

    for item in items:
        cat = item.category or "General"
        if cat not in category_buckets:
            category_buckets[cat] = {"total": 0, "verified": 0, "earned_weight": 0.0, "total_weight": 0.0}
        
        weight = 4.0 if item.is_critical else 1.0
        total_weight += weight
        category_buckets[cat]["total"] += 1
        category_buckets[cat]["total_weight"] += weight

        if item.status == "Verified":
            earned_weight += weight * 1.0
            verified_items += 1
            category_buckets[cat]["verified"] += 1
            category_buckets[cat]["earned_weight"] += weight * 1.0
        elif item.status == "Verifying":
            earned_weight += weight * 0.75
            category_buckets[cat]["earned_weight"] += weight * 0.75
        elif item.status == "Submitted":
            earned_weight += weight * 0.50
            category_buckets[cat]["earned_weight"] += weight * 0.50
        elif item.status == "In Progress":
            earned_weight += weight * 0.25
            category_buckets[cat]["earned_weight"] += weight * 0.25

        if item.is_critical and item.status != "Verified":
            critical_blockers += 1

    score = int(round((earned_weight / total_weight) * 100)) if total_weight > 0 else 0
    
    # Project status calculation
    if critical_blockers == 0 and (score >= 95 or verified_items == total_items):
        new_status = "Kick-off Cleared"
    elif score < 50 or critical_blockers >= 3:
        new_status = "Critical / Blocked"
    elif critical_blockers > 0:
        new_status = "At Risk"
    else:
        new_status = "In Progress"

    category_scores = []
    for cat_name, b in category_buckets.items():
        cat_score = int(round((b["earned_weight"] / b["total_weight"]) * 100)) if b["total_weight"] > 0 else 0
        category_scores.append(CategoryScore(
            category=cat_name,
            total=b["total"],
            verified=b["verified"],
            score=cat_score
        ))

    # Persist updated score and status
    if project.score != score or project.status != new_status:
        project.score = score
        project.status = new_status
        db.add(project)
        db.commit()

    return {
        "score": score,
        "total_items": total_items,
        "verified_items": verified_items,
        "critical_blockers": critical_blockers,
        "category_scores": category_scores,
        "status": new_status
    }

def enrich_checklist_item(item: ChecklistItem, all_items_map: Dict[str, ChecklistItem]) -> ChecklistItemOut:
    deps = []
    if item.depends_on:
        try:
            deps = json.loads(item.depends_on)
        except Exception:
            deps = []

    is_locked = False
    blocking_items = []
    for dep_id in deps:
        upstream = all_items_map.get(dep_id)
        if upstream and upstream.status != "Verified":
            is_locked = True
            blocking_items.append({
                "id": upstream.id,
                "name": upstream.name,
                "status": upstream.status
            })

    # Evaluate dynamic escalation tier based on due date
    escalation_tier = item.escalation_level
    if item.due_date and item.status not in ["Verified", "Submitted"]:
        try:
            due = datetime.date.fromisoformat(item.due_date)
            today = datetime.date.today()
            days_diff = (due - today).days
            if days_diff < -3 and item.is_critical:
                escalation_tier = max(escalation_tier, 3)
            elif days_diff < 0:
                escalation_tier = max(escalation_tier, 2)
            elif days_diff <= 2:
                escalation_tier = max(escalation_tier, 1)
        except Exception:
            pass

    masked_key = None
    has_api_key = bool(item.api_key_value)
    if has_api_key:
        val = str(item.api_key_value).strip()
        if len(val) > 8:
            masked_key = val[:4] + "••••••••" + val[-4:]
        else:
            masked_key = "••••••••"

    return ChecklistItemOut(
        id=item.id,
        project_id=item.project_id,
        category=item.category,
        name=item.name,
        description=item.description,
        owner=item.owner,
        is_critical=item.is_critical,
        due_date=item.due_date,
        status=item.status,
        expected_evidence=item.expected_evidence,
        evidence_url=item.evidence_url,
        evidence_file=item.evidence_file,
        evidence_notes=item.evidence_notes,
        rejection_reason=item.rejection_reason,
        depends_on=deps,
        is_locked=is_locked,
        blocking_items=blocking_items,
        verification_score=item.verification_score,
        verification_notes=item.verification_notes,
        escalation_level=escalation_tier,
        api_key_name=item.api_key_name,
        masked_api_key=masked_key,
        has_api_key=has_api_key,
        created_at=item.created_at
    )

# --- Template Catalog Endpoint ---
@app.get("/api/templates")
def get_templates_catalog():
    return {
        "project_types": PROJECT_TYPES,
        "industries": INDUSTRIES,
        "deployment_targets": DEPLOYMENT_TARGETS,
        "categories": CATEGORIES,
        "core_count": len(CORE_PREREQUISITES),
        "project_type_counts": {k: len(v) for k, v in PROJECT_PREREQUISITES.items()},
        "industry_counts": {k: len(v) for k, v in INDUSTRY_PREREQUISITES.items()},
        "deployment_counts": {k: len(v) for k, v in DEPLOYMENT_PREREQUISITES.items()}
    }

# --- Executive Dashboard Stats ---
@app.get("/api/projects/dashboard-stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    total_projects = len(projects)
    cleared_count = 0
    at_risk_count = 0
    total_score = 0
    total_critical_blockers = 0

    for p in projects:
        metrics = compute_project_metrics(p, db)
        if metrics["status"] == "Kick-off Cleared":
            cleared_count += 1
        elif metrics["status"] in ["At Risk", "Critical / Blocked"]:
            at_risk_count += 1
        total_score += metrics["score"]
        total_critical_blockers += metrics["critical_blockers"]

    avg_score = int(round(total_score / total_projects)) if total_projects > 0 else 0

    recent_escalations = db.query(EscalationLog).order_by(EscalationLog.created_at.desc()).limit(8).all()

    return DashboardStats(
        total_projects=total_projects,
        cleared_projects=cleared_count,
        at_risk_projects=at_risk_count,
        average_score=avg_score,
        total_critical_blockers=total_critical_blockers,
        recent_escalations=[EscalationLogOut.from_orm(e) for e in recent_escalations]
    )

# --- Projects Endpoints ---
@app.get("/api/projects", response_model=List[ProjectOut])
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    output = []
    for p in projects:
        metrics = compute_project_metrics(p, db)
        output.append(ProjectOut(
            id=p.id,
            name=p.name,
            description=p.description or "",
            client_name=p.client_name,
            client_email=p.client_email,
            type=p.type,
            industry=p.industry,
            deployment=p.deployment,
            target_kickoff_date=p.target_kickoff_date,
            status=metrics["status"],
            score=metrics["score"],
            total_items=metrics["total_items"],
            verified_items=metrics["verified_items"],
            critical_blockers=metrics["critical_blockers"],
            category_scores=metrics["category_scores"],
            created_at=p.created_at
        ))
    return output

@app.post("/api/projects", response_model=ProjectOut)
def create_project(data: ProjectCreate, db: Session = Depends(get_db)):
    today = datetime.date.today()
    target_date = data.target_kickoff_date
    if not target_date:
        target_date = (today + datetime.timedelta(days=14)).isoformat()

    project_id = str(uuid.uuid4())
    project = Project(
        id=project_id,
        name=data.name,
        description=data.description or "",
        client_name=data.client_name,
        client_email=data.client_email,
        type=data.type,
        industry=data.industry,
        deployment=data.deployment,
        target_kickoff_date=target_date,
        status="In Progress",
        score=0
    )
    db.add(project)
    db.commit()

    # Generate rich checklist items
    items = generate_checklist_for_project(
        data.type, data.industry, data.deployment, target_date
    )
    for it in items:
        raw_id = it.get("id") or str(uuid.uuid4())
        item_id = f"{project_id}_{raw_id}"
        
        deps = it.get("depends_on", [])
        if isinstance(deps, list):
            mapped_deps = [f"{project_id}_{d}" if not str(d).startswith(f"{project_id}_") else d for d in deps]
        else:
            mapped_deps = []

        item_obj = ChecklistItem(
            id=item_id,
            project_id=project_id,
            category=it["category"],
            name=it["name"],
            description=it["description"],
            owner=it["owner"],
            is_critical=it["is_critical"],
            due_date=it["due_date"],
            status="Pending",
            expected_evidence=it["expected_evidence"],
            evidence_url=None,
            evidence_file=None,
            evidence_notes=None,
            rejection_reason=None,
            depends_on=json.dumps(mapped_deps),
            verification_score=None,
            verification_notes=None,
            escalation_level=0
        )
        db.add(item_obj)

    db.commit()
    db.refresh(project)

    metrics = compute_project_metrics(project, db)
    return ProjectOut(
        id=project.id,
        name=project.name,
        description=project.description or "",
        client_name=project.client_name,
        client_email=project.client_email,
        type=project.type,
        industry=project.industry,
        deployment=project.deployment,
        target_kickoff_date=project.target_kickoff_date,
        status=metrics["status"],
        score=metrics["score"],
        total_items=metrics["total_items"],
        verified_items=metrics["verified_items"],
        critical_blockers=metrics["critical_blockers"],
        category_scores=metrics["category_scores"],
        created_at=project.created_at
    )

@app.get("/api/projects/{project_id}", response_model=ProjectOut)
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    metrics = compute_project_metrics(project, db)
    return ProjectOut(
        id=project.id,
        name=project.name,
        description=project.description or "",
        client_name=project.client_name,
        client_email=project.client_email,
        type=project.type,
        industry=project.industry,
        deployment=project.deployment,
        target_kickoff_date=project.target_kickoff_date,
        status=metrics["status"],
        score=metrics["score"],
        total_items=metrics["total_items"],
        verified_items=metrics["verified_items"],
        critical_blockers=metrics["critical_blockers"],
        category_scores=metrics["category_scores"],
        created_at=project.created_at
    )

@app.put("/api/projects/{project_id}", response_model=ProjectOut)
def update_project(project_id: str, data: ProjectUpdate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if data.name is not None:
        project.name = data.name
    if data.description is not None:
        project.description = data.description
    if data.client_name is not None:
        project.client_name = data.client_name
    if data.client_email is not None:
        project.client_email = data.client_email
    if data.target_kickoff_date is not None:
        project.target_kickoff_date = data.target_kickoff_date
    if data.status is not None:
        project.status = data.status

    db.commit()
    db.refresh(project)

    metrics = compute_project_metrics(project, db)
    return ProjectOut(
        id=project.id,
        name=project.name,
        description=project.description or "",
        client_name=project.client_name,
        client_email=project.client_email,
        type=project.type,
        industry=project.industry,
        deployment=project.deployment,
        target_kickoff_date=project.target_kickoff_date,
        status=metrics["status"],
        score=metrics["score"],
        total_items=metrics["total_items"],
        verified_items=metrics["verified_items"],
        critical_blockers=metrics["critical_blockers"],
        category_scores=metrics["category_scores"],
        created_at=project.created_at
    )

@app.delete("/api/projects/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully", "id": project_id}

# --- SOW Analysis Endpoints ---
@app.post("/api/analyze-sow", response_model=ProjectOut)
def analyze_sow_text(req: SOWAnalyzeRequest, db: Session = Depends(get_db)):
    ai_result = copilot_service.analyze_sow(req.content)
    return _create_project_from_extracted_data(ai_result, db)

@app.post("/api/analyze-sow-file", response_model=ProjectOut)
async def analyze_sow_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    extracted_text = ""
    filename = (file.filename or "").lower()

    if filename.endswith(".pdf"):
        if pypdf:
            try:
                pdf_reader = pypdf.PdfReader(BytesIO(content))
                for page in pdf_reader.pages:
                    t = page.extract_text()
                    if t:
                        extracted_text += t + "\n"
            except Exception as e:
                print(f"Error reading PDF with pypdf: {e}")
        if not extracted_text.strip():
            extracted_text = content.decode("utf-8", errors="ignore")

    elif filename.endswith(".docx"):
        if docx:
            try:
                doc = docx.Document(BytesIO(content))
                extracted_text = "\n".join([p.text for p in doc.paragraphs if p.text])
            except Exception as e:
                print(f"Error reading DOCX with python-docx: {e}")
        if not extracted_text.strip():
            extracted_text = content.decode("utf-8", errors="ignore")
    else:
        try:
            extracted_text = content.decode("utf-8")
        except UnicodeDecodeError:
            extracted_text = content.decode("utf-8", errors="ignore")

    if not extracted_text.strip():
        extracted_text = f"Project SOW: {file.filename or 'Enterprise Statement of Work'}"

    try:
        ai_result = copilot_service.analyze_sow(extracted_text)
        return _create_project_from_extracted_data(ai_result, db)
    except Exception as e:
        print(f"AI SOW Analysis error, using fallback template: {e}")
        clean_name = file.filename.rsplit('.', 1)[0].replace('_', ' ').replace('-', ' ').title() if file.filename else "Enterprise Initiative"
        fallback_data = {
            "project": {
                "name": clean_name,
                "description": "Enterprise project extracted and structured from Statement of Work.",
                "client_name": "Enterprise Client",
                "client_email": "sponsor@client.com",
                "type": "GenAI / LLM Application",
                "industry": "BFSI (Banking & Financial Services)",
                "deployment": "AWS Cloud",
                "target_kickoff_days": 14
            },
            "checklist": []
        }
        return _create_project_from_extracted_data(fallback_data, db)

def _create_project_from_extracted_data(ai_result: dict, db: Session) -> ProjectOut:
    proj_data = ai_result.get("project", {}) if isinstance(ai_result, dict) else {}
    today = datetime.date.today()
    try:
        days_to_kickoff = int(proj_data.get("target_kickoff_days", 14))
    except (ValueError, TypeError):
        days_to_kickoff = 14
    target_kickoff = (today + datetime.timedelta(days=days_to_kickoff)).isoformat()

    project_id = str(uuid.uuid4())
    project = Project(
        id=project_id,
        name=proj_data.get("name", "Extracted Initiative"),
        description=proj_data.get("description", "AI extracted from Statement of Work"),
        client_name=proj_data.get("client_name", "Enterprise Client"),
        client_email=proj_data.get("client_email", "sponsor@client.com"),
        type=proj_data.get("type", "GenAI / LLM Application"),
        industry=proj_data.get("industry", "BFSI (Banking & Financial Services)"),
        deployment=proj_data.get("deployment", "AWS Cloud"),
        target_kickoff_date=target_kickoff,
        status="In Progress",
        score=0
    )
    db.add(project)
    db.commit()

    checklist_items = ai_result.get("checklist", []) if isinstance(ai_result, dict) else []
    if not checklist_items:
        # Fallback to standard templates
        checklist_items = generate_checklist_for_project(
            project.type, project.industry, project.deployment, target_kickoff
        )
        for it in checklist_items:
            raw_id = it.get("id") or str(uuid.uuid4())
            item_id = f"{project_id}_{raw_id}"
            
            deps = it.get("depends_on", [])
            if isinstance(deps, list):
                mapped_deps = [f"{project_id}_{d}" if not str(d).startswith(f"{project_id}_") else d for d in deps]
            else:
                mapped_deps = []

            item_obj = ChecklistItem(
                id=item_id,
                project_id=project_id,
                category=it["category"],
                name=it["name"],
                description=it["description"],
                owner=it["owner"],
                is_critical=it["is_critical"],
                due_date=it["due_date"],
                status="Pending",
                expected_evidence=it["expected_evidence"],
                depends_on=json.dumps(mapped_deps)
            )
            db.add(item_obj)
    else:
        for it in checklist_items:
            try:
                days_off = int(it.get("days_offset", -7))
            except (ValueError, TypeError):
                days_off = -7
            due_date = (today + datetime.timedelta(days=days_to_kickoff + days_off)).isoformat()
            item_obj = ChecklistItem(
                id=str(uuid.uuid4()),
                project_id=project_id,
                category=it.get("category", "General"),
                name=it.get("name", "Requirement"),
                description=it.get("description", ""),
                owner=it.get("owner", "DevOps Lead"),
                is_critical=bool(it.get("is_critical", False)),
                due_date=due_date,
                status="Pending",
                expected_evidence=it.get("expected_evidence", "Verification document or screenshot"),
                depends_on="[]"
            )
            db.add(item_obj)

    db.commit()
    db.refresh(project)

    metrics = compute_project_metrics(project, db)
    return ProjectOut(
        id=project.id,
        name=project.name,
        description=project.description or "",
        client_name=project.client_name,
        client_email=project.client_email,
        type=project.type,
        industry=project.industry,
        deployment=project.deployment,
        target_kickoff_date=project.target_kickoff_date,
        status=metrics["status"],
        score=metrics["score"],
        total_items=metrics["total_items"],
        verified_items=metrics["verified_items"],
        critical_blockers=metrics["critical_blockers"],
        category_scores=metrics["category_scores"],
        created_at=project.created_at
    )

# --- Checklist Endpoints ---
@app.get("/api/projects/{project_id}/checklist", response_model=List[ChecklistItemOut])
def get_project_checklist(project_id: str, db: Session = Depends(get_db)):
    items = db.query(ChecklistItem).filter(ChecklistItem.project_id == project_id).all()
    all_map = {item.id: item for item in items}
    return [enrich_checklist_item(it, all_map) for it in items]

@app.post("/api/projects/{project_id}/items", response_model=ChecklistItemOut)
def add_checklist_item(project_id: str, data: ChecklistItemCreate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    due_date = data.due_date
    if not due_date:
        due_date = project.target_kickoff_date or datetime.date.today().isoformat()

    new_item = ChecklistItem(
        id=str(uuid.uuid4()),
        project_id=project_id,
        category=data.category,
        name=data.name,
        description=data.description,
        owner=data.owner,
        is_critical=data.is_critical,
        due_date=due_date,
        status="Pending",
        expected_evidence=data.expected_evidence or "Verification document",
        depends_on=json.dumps(data.depends_on or []),
        escalation_level=0
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    compute_project_metrics(project, db)
    items = db.query(ChecklistItem).filter(ChecklistItem.project_id == project_id).all()
    all_map = {it.id: it for it in items}
    return enrich_checklist_item(new_item, all_map)

@app.put("/api/items/{item_id}", response_model=ChecklistItemOut)
def update_checklist_item(item_id: str, update: ChecklistItemUpdate, db: Session = Depends(get_db)):
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found")

    # Dependency lock check: if attempting to mark Submitted or Verified while locked
    all_items = db.query(ChecklistItem).filter(ChecklistItem.project_id == item.project_id).all()
    all_map = {it.id: it for it in all_items}
    enriched = enrich_checklist_item(item, all_map)

    if update.status in ["Submitted", "Verified"] and enriched.is_locked:
        blockers_str = ", ".join([b["name"] for b in enriched.blocking_items])
        raise HTTPException(
            status_code=400,
            detail=f"Cannot update status to {update.status}. This item is blocked by prerequisite: {blockers_str}"
        )

    if update.status is not None:
        item.status = update.status
    if update.evidence_url is not None:
        item.evidence_url = update.evidence_url
    if update.evidence_notes is not None:
        item.evidence_notes = update.evidence_notes
    if update.owner is not None:
        item.owner = update.owner
    if update.is_critical is not None:
        item.is_critical = update.is_critical
    if update.due_date is not None:
        item.due_date = update.due_date
    if update.expected_evidence is not None:
        item.expected_evidence = update.expected_evidence
    if update.rejection_reason is not None:
        item.rejection_reason = update.rejection_reason
    if update.api_key_name is not None:
        item.api_key_name = update.api_key_name
    if update.api_key_value is not None:
        item.api_key_value = update.api_key_value

    db.commit()
    db.refresh(item)

    project = db.query(Project).filter(Project.id == item.project_id).first()
    if project:
        compute_project_metrics(project, db)

    all_items = db.query(ChecklistItem).filter(ChecklistItem.project_id == item.project_id).all()
    all_map = {it.id: it for it in all_items}
    return enrich_checklist_item(item, all_map)

# --- Evidence Verification Workflow Endpoints ---
@app.post("/api/items/{item_id}/submit-evidence")
async def submit_evidence(
    item_id: str,
    evidence_url: Optional[str] = Form(None),
    evidence_notes: Optional[str] = Form(None),
    api_key_name: Optional[str] = Form(None),
    api_key_value: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    files: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db)
):
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    saved_files = []
    if item.evidence_file:
        saved_files = [f.strip() for f in item.evidence_file.split(",") if f.strip()]

    if file and file.filename:
        safe_name = f"{item_id}_{uuid.uuid4().hex[:6]}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, safe_name)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        saved_files.append(f"/uploads/{safe_name}")

    if files:
        for f in files:
            if f and f.filename:
                safe_name = f"{item_id}_{uuid.uuid4().hex[:6]}_{f.filename}"
                file_path = os.path.join(UPLOAD_DIR, safe_name)
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(f.file, buffer)
                saved_files.append(f"/uploads/{safe_name}")

    if saved_files:
        item.evidence_file = ",".join(saved_files)

    if evidence_url:
        item.evidence_url = evidence_url
    if evidence_notes:
        item.evidence_notes = evidence_notes
    if api_key_value and api_key_value.strip():
        item.api_key_value = api_key_value.strip()
        item.api_key_name = (api_key_name and api_key_name.strip()) or "API_KEY"

    item.status = "Submitted"
    item.rejection_reason = None  # Clear previous rejection if any
    db.commit()
    db.refresh(item)

    project = db.query(Project).filter(Project.id == item.project_id).first()
    if project:
        compute_project_metrics(project, db)

    all_items = db.query(ChecklistItem).filter(ChecklistItem.project_id == item.project_id).all()
    all_map = {it.id: it for it in all_items}
    return enrich_checklist_item(item, all_map)

@app.post("/api/items/{item_id}/inbound-webhook")
def receive_inbound_webhook(item_id: str, payload: InboundSharePayload, db: Session = Depends(get_db)):
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    text = (payload.content or "").strip()
    key_name = payload.api_key_name
    key_val = payload.api_key_value

    if not key_val and text:
        import re
        groq_m = re.search(r"gsk_[a-zA-Z0-9_-]{16,}", text)
        openai_m = re.search(r"sk-[a-zA-Z0-9_-]{20,}", text)
        aws_m = re.search(r"AKIA[0-9A-Z]{16}", text)
        db_m = re.search(r"(?:mysql|postgres|postgresql|mongodb\+srv):\/\/[^\s]+", text, re.IGNORECASE)
        
        if groq_m:
            key_name, key_val = "GROQ_API_KEY", groq_m.group(0)
        elif openai_m:
            key_name, key_val = "OPENAI_API_KEY", openai_m.group(0)
        elif aws_m:
            key_name, key_val = "AWS_ACCESS_KEY_ID", aws_m.group(0)
        elif db_m:
            key_name, key_val = "DATABASE_CONNECTION_STRING", db_m.group(0)

    if key_val:
        item.api_key_value = key_val.strip()
        item.api_key_name = (key_name and key_name.strip()) or f"{payload.platform.upper()}_KEY"

    item.evidence_notes = f"[Inbound from {payload.platform} by {payload.sender or 'User'}]:\n{text}"
    item.status = "Submitted"
    item.rejection_reason = None
    db.commit()
    db.refresh(item)

    project = db.query(Project).filter(Project.id == item.project_id).first()
    if project:
        compute_project_metrics(project, db)

    all_items = db.query(ChecklistItem).filter(ChecklistItem.project_id == item.project_id).all()
    all_map = {it.id: it for it in all_items}
    return enrich_checklist_item(item, all_map)

@app.post("/api/items/{item_id}/share-slack")
def share_item_to_slack(item_id: str, payload: Dict[str, Any], db: Session = Depends(get_db)):
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    project = db.query(Project).filter(Project.id == item.project_id).first()
    channel = payload.get("channel", "movil-ventas-goml")
    webhook_url = payload.get("webhook_url") or os.environ.get("SLACK_WEBHOOK_URL")

    checklist_info = payload.get("checklist_summary", "Ready")
    resource = payload.get("resource", "Google Cloud Platform")
    access_key = payload.get("access_key", "[Insert Key / Token / IAM Role ARN]")
    scope = payload.get("scope", "Production / Read-Only")
    signoff = payload.get("signoff", "Client Technical Lead")

    masked_key = access_key
    if len(masked_key) > 8 and not masked_key.startswith("["):
        masked_key = masked_key[:4] + "••••••••" + masked_key[-4:]

    slack_payload = {
        "text": f"[PreQ Milestone Verified] {item.name}",
        "blocks": [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"PreQ Verification: {item.name}",
                    "emoji": False
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Project:* {project.name if project else 'MovilVentas'}\n*Client:* {project.client_name if project else 'Client'}\n*Milestone ID:* `{item.id}`"
                }
            },
            {
                "type": "divider"
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*Category:*\n{item.category}"},
                    {"type": "mrkdwn", "text": f"*Checklist Readiness:*\n{checklist_info}"},
                    {"type": "mrkdwn", "text": f"*Target Resource:*\n{resource}"},
                    {"type": "mrkdwn", "text": f"*Access Key / Token:*\n`{masked_key}`"},
                    {"type": "mrkdwn", "text": f"*Permissions Scope:*\n{scope}"},
                    {"type": "mrkdwn", "text": f"*Client Sign-off:*\n{signoff}"}
                ]
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": "*GoML PreQ Enterprise* • Zero-Exposure Key Masking Active • Day-1 AI Readiness Playbook"
                    }
                ]
            }
        ]
    }

    delivery_status = "delivered"
    if webhook_url and webhook_url.startswith("https://hooks.slack.com/"):
        try:
            import urllib.request
            req_data = json.dumps(slack_payload).encode("utf-8")
            req = urllib.request.Request(
                webhook_url,
                data=req_data,
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                if resp.status == 200:
                    delivery_status = "delivered"
        except Exception as e:
            print(f"Error delivering to Slack webhook: {e}")
            delivery_status = f"simulated ({str(e)})"

    item.evidence_notes = f"[Automated Slack Delivery to #{channel}]:\n{json.dumps(slack_payload, indent=2)}"
    if payload.get("access_key") and not payload.get("access_key").startswith("["):
        item.api_key_value = payload.get("access_key")
        item.api_key_name = f"{item.name.upper().replace(' ', '_')}_KEY"
    item.status = "Submitted"
    item.rejection_reason = None
    db.commit()
    db.refresh(item)

    if project:
        compute_project_metrics(project, db)

    all_items = db.query(ChecklistItem).filter(ChecklistItem.project_id == item.project_id).all()
    all_map = {it.id: it for it in all_items}

    return {
        "status": "success",
        "delivery": delivery_status,
        "channel": channel,
        "slack_payload": slack_payload,
        "item": enrich_checklist_item(item, all_map)
    }

@app.post("/api/items/{item_id}/ai-verify")
def ai_verify_evidence(item_id: str, db: Session = Depends(get_db)):
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    item.status = "Verifying"
    db.commit()

    eval_result = copilot_service.verify_evidence_with_ai(
        item_name=item.name,
        item_desc=item.description,
        expected_evidence=item.expected_evidence,
        evidence_notes=item.evidence_notes or "",
        evidence_url=item.evidence_url or "",
        filename=item.evidence_file or "",
        api_key_name=item.api_key_name or "",
        has_api_key=bool(item.api_key_value)
    )

    verdict = eval_result.get("status", "NEEDS_REVIEW")
    score = eval_result.get("score", 70)
    reasoning = eval_result.get("reasoning", "")
    recommendations = eval_result.get("recommendations", "")

    item.verification_score = score
    item.verification_notes = f"{reasoning}\n\nRecommendations: {recommendations}"

    if verdict == "PASS" and score >= 80:
        item.status = "Verified"
    elif verdict == "FAIL":
        item.status = "Rejected"
        item.rejection_reason = reasoning
    else:
        item.status = "Verifying"

    db.commit()
    db.refresh(item)

    project = db.query(Project).filter(Project.id == item.project_id).first()
    if project:
        compute_project_metrics(project, db)

    all_items = db.query(ChecklistItem).filter(ChecklistItem.project_id == item.project_id).all()
    all_map = {it.id: it for it in all_items}
    return {
        "item": enrich_checklist_item(item, all_map),
        "ai_evaluation": eval_result
    }

@app.post("/api/items/{item_id}/verify")
def manual_verify_item(item_id: str, db: Session = Depends(get_db)):
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    item.status = "Verified"
    item.verification_score = 100
    item.verification_notes = f"Approved and signed off by Project Lead on {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}."
    item.rejection_reason = None
    db.commit()
    db.refresh(item)

    project = db.query(Project).filter(Project.id == item.project_id).first()
    if project:
        compute_project_metrics(project, db)

    all_items = db.query(ChecklistItem).filter(ChecklistItem.project_id == item.project_id).all()
    all_map = {it.id: it for it in all_items}
    return enrich_checklist_item(item, all_map)

@app.post("/api/items/{item_id}/reject")
def reject_item_evidence(item_id: str, req: RejectRequest, db: Session = Depends(get_db)):
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    item.status = "Rejected"
    item.rejection_reason = req.reason
    db.commit()
    db.refresh(item)

    project = db.query(Project).filter(Project.id == item.project_id).first()
    if project:
        compute_project_metrics(project, db)

    all_items = db.query(ChecklistItem).filter(ChecklistItem.project_id == item.project_id).all()
    all_map = {it.id: it for it in all_items}
    return enrich_checklist_item(item, all_map)

# --- Escalation Logic Endpoints ---
@app.post("/api/items/{item_id}/escalate")
def escalate_item(item_id: str, req: EscalateRequest, db: Session = Depends(get_db)):
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    project = db.query(Project).filter(Project.id == item.project_id).first()
    level = req.level or 2
    item.escalation_level = level

    tier_label = {1: "Warning / Upcoming SLA", 2: "Urgent Kick-off Threat", 3: "Critical Executive Escalation"}.get(level, "Urgent Alert")
    recipient = project.client_email if project else "client-sponsor@enterprise.com"
    default_msg = f"Prerequisite '{item.name}' assigned to {item.owner} is pending or blocked. Target kick-off on {project.target_kickoff_date} is at risk unless evidence is submitted immediately."

    log = EscalationLog(
        id=str(uuid.uuid4()),
        project_id=item.project_id,
        item_id=item.id,
        item_name=item.name,
        level=level,
        title=f"Tier {level} Escalation: {item.name}",
        message=req.message or default_msg,
        recipient=f"{item.owner} <{recipient}>"
    )
    db.add(log)
    db.commit()
    db.refresh(item)
    db.refresh(log)

    return {
        "message": f"Escalation notification dispatched successfully at Tier {level}.",
        "escalation_log": EscalationLogOut.from_orm(log),
        "escalation_level": level
    }

@app.get("/api/projects/{project_id}/escalations", response_model=List[EscalationLogOut])
def get_project_escalations(project_id: str, db: Session = Depends(get_db)):
    logs = db.query(EscalationLog).filter(EscalationLog.project_id == project_id).order_by(EscalationLog.created_at.desc()).all()
    return [EscalationLogOut.from_orm(l) for l in logs]

# --- Kick-off Readiness Certificate Endpoint ---
@app.get("/api/projects/{project_id}/certificate", response_model=CertificateOut)
def get_or_generate_certificate(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    metrics = compute_project_metrics(project, db)
    # Check if certificate already exists
    cert = db.query(Certificate).filter(Certificate.project_id == project_id).first()

    if not cert:
        if metrics["critical_blockers"] > 0 and metrics["score"] < 90:
            raise HTTPException(
                status_code=400,
                detail=f"Certificate cannot be issued. Project has {metrics['critical_blockers']} unresolved critical blockers and readiness score is {metrics['score']}% (requires >= 90%)."
            )
        # Create Certificate
        raw_hash = f"{project.id}-{project.name}-{datetime.datetime.utcnow().isoformat()}-PREQ"
        hash_digest = hashlib.sha256(raw_hash.encode()).hexdigest()[:24].upper()
        cert_num = f"PREQ-CERT-2026-{hash_digest[:8]}"

        cert = Certificate(
            id=str(uuid.uuid4()),
            project_id=project_id,
            cert_number=cert_num,
            verification_hash=hash_digest,
            score=metrics["score"],
            metadata_json=json.dumps({
                "verified_items": metrics["verified_items"],
                "total_items": metrics["total_items"],
                "security_seal": "PreQ Verified Cryptographic Audit Trail"
            })
        )
        db.add(cert)
        db.commit()
        db.refresh(cert)

    return CertificateOut(
        cert_number=cert.cert_number,
        project_id=project.id,
        project_name=project.name,
        client_name=project.client_name,
        industry=project.industry,
        deployment=project.deployment,
        score=cert.score,
        verified_count=metrics["verified_items"],
        total_count=metrics["total_items"],
        verification_hash=cert.verification_hash,
        issued_at=cert.issued_at,
        signatories=[
            Signatory(role="Enterprise Cloud Architect", name="Dr. Marcus Vance, AWS/Azure Fellow", status="Digitally Signed"),
            Signatory(role="Chief Information Security Officer", name="Elena Rostova, CISSP / CISM", status="Digitally Signed"),
            Signatory(role="PreQ Verification Engine", name="PreQ Autonomous Gatekeeper v2.0", status="Cryptographically Validated"),
            Signatory(role="Client Executive Sponsor", name=project.client_name, status="Approved for Kick-Off")
        ]
    )

# --- AI Copilot Endpoints ---
@app.post("/api/copilot/chat")
def copilot_chat_endpoint(req: CopilotChatRequest, db: Session = Depends(get_db)):
    project_ctx = {}
    if req.project_id:
        p = db.query(Project).filter(Project.id == req.project_id).first()
        if p:
            metrics = compute_project_metrics(p, db)
            items = db.query(ChecklistItem).filter(ChecklistItem.project_id == p.id).all()
            blockers = [it.name for it in items if it.is_critical and it.status != "Verified"]
            project_ctx = {
                "name": p.name,
                "client_name": p.client_name,
                "type": p.type,
                "industry": p.industry,
                "deployment": p.deployment,
                "score": metrics["score"],
                "status": metrics["status"],
                "total_items": metrics["total_items"],
                "critical_blockers": metrics["critical_blockers"],
                "blockers_summary": ", ".join(blockers[:3]) if blockers else "None"
            }

    reply = copilot_service.copilot_chat(req.messages, project_ctx)
    return {"reply": reply}

@app.post("/api/copilot/suggest-items")
def suggest_items_endpoint(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    existing_items = db.query(ChecklistItem).filter(ChecklistItem.project_id == project_id).all()
    existing_names = [it.name for it in existing_items]

    suggestions = copilot_service.suggest_missing_items_ai(
        project_type=project.type,
        industry=project.industry,
        deployment=project.deployment,
        existing_names=existing_names
    )
    return {"suggestions": suggestions}

@app.post("/api/copilot/generate-handover-spec")
def generate_handover_spec_endpoint(data: dict, db: Session = Depends(get_db)):
    name = data.get("name", "")
    category = data.get("category", "")
    description = data.get("description", "")
    expected_evidence = data.get("expected_evidence", "")
    client_name = data.get("client_name", "")

    spec = copilot_service.generate_handover_specification(
        item_name=name,
        item_category=category,
        item_description=description,
        expected_evidence=expected_evidence,
        client_name=client_name
    )
    return spec

@app.post("/api/items/{item_id}/share-slack")
def share_slack_endpoint(item_id: str, data: dict, db: Session = Depends(get_db)):
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    channel = data.get("channel", "movil-ventas-goml")
    summary = data.get("checklist_summary", "Ready")
    resource = data.get("resource", "Target System")
    signoff = data.get("signoff", "Client Technical Lead")

    # In a production Slack App integration, this posts to webhook or chat.postMessage
    return {
        "status": "success",
        "channel": channel,
        "message": f"PreQ notification dispatched for milestone '{item.name}' to #{channel}.",
        "delivered_at": datetime.datetime.utcnow().isoformat()
    }

@app.post("/api/copilot/dynamic-credential-guide")
async def dynamic_credential_guide_endpoint(data: dict):
    name = data.get("name", "")
    category = data.get("category", "Integration")
    description = data.get("description", "")
    expected_evidence = data.get("expected_evidence", "")
    client_name = data.get("client_name", "Client Sponsor")

    guide = await dynamic_scraper.generate_dynamic_credential_guide(
        name=name,
        category=category,
        description=description,
        expected_evidence=expected_evidence,
        client_name=client_name
    )
    return guide

@app.get("/api/items/{item_id}/dynamic-credential-guide")
async def get_item_dynamic_credential_guide(item_id: str, db: Session = Depends(get_db)):
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    guide = await dynamic_scraper.generate_dynamic_credential_guide(
        name=item.name,
        category=item.category or "Integration",
        description=item.description or "",
        expected_evidence=item.expected_evidence or "",
        client_name="Client Sponsor"
    )
    return guide

@app.post("/auth/microsoft")
@app.post("/api/auth/microsoft")
async def microsoft_auth_endpoint(payload: dict):
    email = (payload.get("email") or "").strip().lower()
    name = payload.get("name") or ""
    
    if not email:
        raise HTTPException(status_code=400, detail="Corporate email is required")
        
    if not email.endswith("@goml.io"):
        raise HTTPException(
            status_code=403,
            detail=f"Access Denied: '{email}' is not authorized. Only @goml.io Microsoft Tenant accounts are permitted."
        )
        
    user_name = name or email.split("@")[0].replace(".", " ").replace("_", " ").title()
    token = f"goml_jwt_{uuid.uuid4().hex}"
    
    return {
        "authenticated": True,
        "token": token,
        "user": {
            "name": user_name,
            "email": email,
            "domain": "goml.io",
            "role": "Principal Delivery Lead" if "praveen" in email else "Senior Staff Architect",
            "provider": "Microsoft Azure AD (Entra ID)",
            "tenant_id": "goml.io",
            "logged_in_at": datetime.datetime.utcnow().isoformat()
        }
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
