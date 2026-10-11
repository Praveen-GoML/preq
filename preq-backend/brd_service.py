"""
BRD (Business Requirements Document) & Minimal Pre-Req Tracker Service
Strictly implements the 27-Section Enterprise BRD Template and Minimal Excel Tracker generation.
"""

import io
import os
import json
import datetime
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

from copilot_service import call_groq_chat, clean_json_response

def ensure_goml_logo(filepath: str):
    """Generates the goML PreQ logo PNG image if it doesn't already exist."""
    if os.path.exists(filepath):
        return
    try:
        from PIL import Image, ImageDraw, ImageFont
        img = Image.new('RGBA', (400, 100), (255, 255, 255, 0))
        draw = ImageDraw.Draw(img)

        try:
            font_bold = ImageFont.truetype('arialbd.ttf', 38)
            font_sm = ImageFont.truetype('arialbd.ttf', 20)
        except Exception:
            font_bold = ImageFont.load_default()
            font_sm = ImageFont.load_default()

        # 1. Emblem Circle (Orange #ED7D31)
        draw.ellipse([10, 10, 80, 80], fill=(237, 125, 49, 255))
        draw.ellipse([22, 22, 68, 68], fill=(255, 255, 255, 255))
        draw.ellipse([30, 30, 60, 60], fill=(237, 125, 49, 255))
        draw.polygon([(45, 20), (70, 45), (45, 70)], fill=(237, 125, 49, 255))

        # 2. 'go' (Orange #ED7D31) and 'ML' (Black #000000)
        draw.text((95, 22), 'go', fill=(237, 125, 49, 255), font=font_bold)
        draw.text((142, 22), 'ML', fill=(0, 0, 0, 255), font=font_bold)

        # 3. 'PreQ' Badge
        draw.rounded_rectangle([205, 28, 275, 62], radius=12, fill=(255, 247, 237, 255), outline=(237, 125, 49, 255), width=2)
        draw.text((216, 33), 'PreQ', fill=(237, 125, 49, 255), font=font_sm)

        img.save(filepath)
    except Exception as e:
        print(f"Logo generation notice: {e}")


def ensure_goml_logo_white(filepath: str):
    """Generates the white goML PreQ logo PNG image for Dark Mode if it doesn't already exist."""
    if os.path.exists(filepath):
        return
    try:
        from PIL import Image, ImageDraw, ImageFont
        img = Image.new('RGBA', (400, 100), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        try:
            font_bold = ImageFont.truetype('arialbd.ttf', 38)
            font_sm = ImageFont.truetype('arialbd.ttf', 20)
        except Exception:
            font_bold = ImageFont.load_default()
            font_sm = ImageFont.load_default()

        # 1. Emblem Circle (Orange #ED7D31)
        draw.ellipse([10, 10, 80, 80], fill=(237, 125, 49, 255))
        draw.ellipse([22, 22, 68, 68], fill=(24, 24, 27, 255))
        draw.ellipse([30, 30, 60, 60], fill=(237, 125, 49, 255))
        draw.polygon([(45, 20), (70, 45), (45, 70)], fill=(237, 125, 49, 255))

        # 2. 'go' (Orange #ED7D31) and 'ML' (WHITE #FFFFFF)
        draw.text((95, 22), 'go', fill=(237, 125, 49, 255), font=font_bold)
        draw.text((142, 22), 'ML', fill=(255, 255, 255, 255), font=font_bold)

        # 3. 'PreQ' Badge
        draw.rounded_rectangle([205, 28, 275, 62], radius=12, fill=(39, 39, 42, 255), outline=(237, 125, 49, 255), width=2)
        draw.text((216, 33), 'PreQ', fill=(237, 125, 49, 255), font=font_sm)

        img.save(filepath)
    except Exception as e:
        print(f"White logo generation notice: {e}")


BRD_SYSTEM_PROMPT = """You are a Principal Business Systems Analyst & Enterprise Solutions Architect.
Your task is to generate a comprehensive, structured, proposal-specific Business Requirements Document (BRD) strictly adhering to the 27-section enterprise BRD template.

CRITICAL INSTRUCTIONS:
1. Base the BRD STRICTLY on the provided proposal/SOW document.
2. MAKE THE BRD COMPREHENSIVE, CRYSTAL CLEAR, AND FULLY UNDERSTANDABLE TO ALL STAKEHOLDERS (both non-technical business sponsors/executives and technical engineering teams).
3. EXPLAIN TECHNICAL CONCEPTS IN ACCESSIBLE, PLAIN LANGUAGE alongside technical specifications. Provide clear real-world business context, plain-English overviews, concrete process steps, and user stories with explicit acceptance criteria (Given/When/Then). Avoid jargon-heavy hand-waving or overly abstract summaries.
4. DYNAMIC PROJECT-SPECIFIC ROLES: Do NOT use static generic role titles across every document. Dynamically derive project-specific roles tailored strictly to the technical domain of the proposal (e.g. for an AI/LLM project: 'LLM Pipeline Architect', 'AI Governance & Safety Officer', 'Vector DB Admin'; for Cloud/DevOps: 'Cloud Infrastructure Lead', 'SRE Specialist'; for Data Engineering: 'Lead Data Pipeline Engineer', 'Data Privacy Auditor', etc.). Reflect these dynamic roles in section_1_doc_control (reviewers), section_6_stakeholders (raci, user_roles), section_7_current_future_state (to_be_flow), and section_27_signoff.
5. MISSING & INADEQUATE REQUIREMENT RISKS: Carefully analyze the proposal text for missing, vague, inadequate, or unstated technical specifications (such as missing throughput SLAs, unstated DB schemas, absent IAM permission controls, or unverified environment endpoints). In section_20_risks, explicitly output dedicated risk entries (e.g., ID 'R-MISS-01') identifying each inadequate or missing requirement, its impact, and a concrete mitigation strategy.
6. Generate all 27 numbered sections in valid JSON format matching the schema below.

JSON SCHEMA:
{
  "project_name": "Project Name",
  "version": "1.0",
  "date": "YYYY-MM-DD",
  "status": "In review",
  "prepared_by": "Akshay & Thasleema, Principal Solutions Analysts",
  "section_1_doc_control": {
    "project_name": "...",
    "ticket_id": "PRJ-2026-...",
    "owner": "Akshay (Solutions Lead)",
    "business_sponsor": "Client Sponsor Name",
    "tech_lead": "Thasleema (Lead Architect)",
    "version": "1.0",
    "status": "In review",
    "last_updated": "YYYY-MM-DD",
    "related_docs": "SOW, Architecture Specs, Interface Contracts",
    "revision_history": [
      {"version": "0.1", "date": "YYYY-MM-DD", "author": "Akshay", "summary": "Initial proposal extraction"},
      {"version": "1.0", "date": "YYYY-MM-DD", "author": "Thasleema", "summary": "Structured BRD baseline for development"}
    ],
    "reviewers": [
      {"name": "Client Sponsor", "role": "Business Sponsor", "responsibility": "Approver", "approval_date": "Pending"},
      {"name": "Akshay", "role": "Product & Solutions Lead", "responsibility": "Approver", "approval_date": "YYYY-MM-DD"},
      {"name": "Thasleema", "role": "Lead Architect", "responsibility": "Reviewer", "approval_date": "YYYY-MM-DD"},
      {"name": "QA Lead", "role": "QA Lead", "responsibility": "Reviewer", "approval_date": "Pending"}
    ]
  },
  "section_2_executive_summary": "3-5 concise sentences describing the problem, technical solution, business impact, and decision needed.",
  "section_3_background": {
    "problem": "...",
    "business_impact": "...",
    "root_cause": "...",
    "why_now": "..."
  },
  "section_4_objectives": [
    {"id": "OBJ-01", "objective": "...", "kpi": "...", "baseline": "...", "target": "...", "measured_by": "...", "date": "..."}
  ],
  "section_5_scope": {
    "in_scope": ["..."],
    "out_of_scope": ["..."],
    "platforms": "Web / Mobile / Cloud API",
    "browsers": "Chrome, Edge, Safari, Firefox",
    "languages": "English (Primary)",
    "environments": "DEV -> QA -> STAGING / UAT -> PROD"
  },
  "section_6_stakeholders": {
    "raci": [
      {"name": "Business Sponsor", "role": "Client Executive", "interest": "Budget & Outcome", "raci": "A"},
      {"name": "Akshay", "role": "Product Lead", "interest": "Requirements & Scope", "raci": "R"},
      {"name": "Thasleema", "role": "Tech Lead", "interest": "Solution Delivery", "raci": "R"},
      {"name": "Client Security Lead", "role": "Compliance", "interest": "Security Sign-off", "raci": "C"}
    ],
    "user_roles": [
      {"role": "End User / Operator", "description": "...", "access": "Web Portal / API", "approx_users": "..."}
    ],
    "permissions": [
      {"action": "Execute Operations", "role_1": "✓", "role_2": "—", "role_3": "✓"}
    ]
  },
  "section_7_current_future_state": {
    "as_is_steps": ["1. ...", "2. ..."],
    "pain_points": ["..."],
    "to_be_flow": [
      {"step": "1", "actor": "User", "action": "...", "system_behaviour": "...", "next_step": "2"}
    ],
    "gap_analysis": [
      {"area": "Process", "current": "...", "future": "...", "gap": "..."}
    ]
  },
  "section_8_business_requirements": [
    {"id": "BR-01", "requirement": "...", "priority": "Must", "objective": "OBJ-01", "owner": "..."}
  ],
  "section_9_functional_requirements": {
    "list": [
      {"id": "FR-01", "requirement": "The system shall...", "priority": "Must", "traces_to": "BR-01", "user_story": "US-01"}
    ],
    "user_stories": [
      {
        "id": "US-01",
        "title": "...",
        "story": "As a [role], I want [capability] so that [benefit].",
        "linked_fr": "FR-01",
        "priority": "Must / 5 pts",
        "acceptance_criteria": [
          "AC1 - Given ..., When ..., Then ...",
          "AC2 - Given ..., When ..., Then ..."
        ],
        "out_of_scope": "..."
      }
    ]
  },
  "section_10_business_rules": [
    {"id": "BRL-01", "rule": "...", "condition": "...", "outcome": "...", "configurable": "Yes", "error_code": "E-101"}
  ],
  "section_11_data_requirements": {
    "entities": [
      {"entity": "...", "description": "...", "relationships": "..."}
    ],
    "data_dictionary": [
      {"field": "...", "entity": "...", "type": "String", "format": "...", "required": "Yes", "validation": "...", "example": "..."}
    ],
    "retention_privacy": {
      "retention": "...",
      "sensitive_fields": "...",
      "data_migration": "..."
    }
  },
  "section_12_ui_requirements": {
    "screens": [
      {"id": "SCR-01", "name": "...", "role": "...", "key_fields": "...", "actions": "...", "wireframe": "TBD"}
    ],
    "states": "Loading, empty, success, validation error, system error, offline",
    "breakpoints": "360px, 768px, 1280px, 1920px"
  },
  "section_13_integration_api": {
    "integrations": [
      {"id": "INT-01", "system": "...", "direction": "Outbound", "protocol": "REST / JSON", "trigger": "...", "auth": "API Key / OAuth2", "timeout_retry": "30s / 2 retries"}
    ],
    "sample_contract": "POST /api/v1/...\\n{\\n  \\\"status\\\": \\\"OK\\\"\\n}",
    "failure_handling": "..."
  },
  "section_14_notifications": [
    {"id": "NTF-01", "trigger": "...", "channel": "Email / Webhook", "recipient": "...", "summary": "...", "template": "TPL-01"}
  ],
  "section_15_reporting": [
    {"report": "...", "audience": "...", "metrics": "...", "frequency": "Daily / Realtime", "format": "Dashboard / CSV"}
  ],
  "section_16_non_functional": [
    {"id": "NFR-01", "category": "Performance", "requirement": "API response time under 500ms (p95)", "target": "< 500ms"},
    {"id": "NFR-02", "category": "Capacity / Scalability", "requirement": "Handle peak concurrent operations", "target": "1,000 concurrent"},
    {"id": "NFR-03", "category": "Availability", "requirement": "High uptime SLA", "target": "99.9% monthly"},
    {"id": "NFR-04", "category": "Security", "requirement": "Encryption at rest (AES-256) and in transit (TLS 1.3)", "target": "TLS 1.3, AES-256"},
    {"id": "NFR-05", "category": "Compliance", "requirement": "Zero-exposure credential governance and data privacy", "target": "SOC2 / ISO 27001"},
    {"id": "NFR-06", "category": "Accessibility", "requirement": "WCAG standard compliance", "target": "WCAG 2.1 AA"},
    {"id": "NFR-07", "category": "Audit Logging", "requirement": "Immutable audit trail of all state changes", "target": "Retain 7 years"},
    {"id": "NFR-08", "category": "Backup / Recovery", "requirement": "Disaster recovery RPO & RTO", "target": "RPO 15m, RTO 4h"},
    {"id": "NFR-09", "category": "Monitoring", "requirement": "Automated telemetry and error rate alerting", "target": "Error rate > 1%"}
  ],
  "section_17_error_handling": {
    "errors": [
      {"code": "E-401", "scenario": "Authentication Failure", "message": "Invalid credentials. Please verify your token.", "behaviour": "Log event, reject request"}
    ],
    "edge_cases": ["..."]
  },
  "section_18_security_compliance": {
    "auth": "OAuth 2.0 / API Token / Role-based access control",
    "session": "15 min inactivity timeout",
    "data_masking": "Zero-exposure cryptographic masking for credentials and keys",
    "consent": "Explicit technical lead sign-off before environment access",
    "security_testing": "Pre-kickoff security audit and VAPT verification"
  },
  "section_19_assumptions_constraints": {
    "assumptions": ["..."],
    "constraints": [
      {"type": "Timeline", "constraint": "Target kick-off within SLA window"},
      {"type": "Technology", "constraint": "Must interface with client approved architecture"}
    ],
    "dependencies": [
      {"id": "DEP-01", "dependency": "...", "owner": "...", "needed_by": "Day-1"}
    ]
  },
  "section_20_risks": [
    {"id": "R-01", "risk": "...", "likelihood": "Medium", "impact": "High", "mitigation": "...", "owner": "Thasleema"}
  ],
  "section_21_testing_uat": {
    "tests": [
      {"id": "TC-01", "scenario": "...", "steps": "...", "expected": "...", "traces_to": "US-01"}
    ],
    "entry_criteria": "All Must-have functional requirements passed internal QA",
    "exit_criteria": "0 critical defects, test suite 100% executed, sign-off obtained"
  },
  "section_22_traceability": [
    {"obj": "OBJ-01", "br": "BR-01", "fr": "FR-01", "us": "US-01", "rule": "BRL-01", "test": "TC-01", "status": "In Progress"}
  ],
  "section_23_release_plan": [
    {"milestone": "BRD & Architecture Sign-off", "target_date": "Day -7", "exit_criteria": "Approved by Akshay & Thasleema"},
    {"milestone": "Pre-requisite Clearance", "target_date": "Day -2", "exit_criteria": "100% Day-1 blockers verified"},
    {"milestone": "Sprint 0 Kick-off", "target_date": "Day 0", "exit_criteria": "Joint sprint launch"}
  ],
  "section_24_open_questions": [
    {"id": "Q-01", "question": "...", "raised_by": "Akshay", "owner": "Client Lead", "due": "Pre-Kickoff", "status": "Open"}
  ],
  "section_25_glossary": [
    {"term": "BRD", "definition": "Business Requirements Document"},
    {"term": "PreQ", "definition": "Pre-requisite Readiness & Verification Protocol"},
    {"term": "SOW", "definition": "Statement of Work"}
  ],
  "section_26_appendices": [
    "Appendix A: Process Flow & Architectural Sequence Diagrams",
    "Appendix B: Interface & API Contract Specifications",
    "Appendix C: Pre-requisite Deliverables Matrix",
    "Appendix D: Notification & Alerting Specifications",
    "Appendix E: Security & Governance Compliance References"
  ],
  "section_27_signoff": [
    {"name": "Business Sponsor", "role": "Client Sponsor", "signature": "", "date": ""},
    {"name": "Akshay", "role": "Product & Solutions Lead", "signature": "Akshay", "date": "YYYY-MM-DD"},
    {"name": "Thasleema", "role": "Lead Architect", "signature": "Thasleema", "date": "YYYY-MM-DD"},
    {"name": "QA Lead", "role": "QA Lead", "signature": "", "date": ""}
  ]
}
"""

def generate_brd_from_proposal(proposal_text: str, project_name: str = "", client_name: str = "", project_type: str = "", industry: str = "") -> dict:
    """Generates the 27-section BRD from proposal text using Groq LLM with structured fallback."""
    user_prompt = f"""
Proposal Document Content:
{proposal_text[:8000]}

Metadata Hints:
- Project Name: {project_name or "Enterprise Initiative"}
- Client Organization: {client_name or "Client Sponsor"}
- Project Type: {project_type or "GenAI / Cloud Enterprise Solution"}
- Industry: {industry or "Enterprise Technology"}

Generate the complete, minimal, structured 27-section BRD in strict JSON format.
"""
    try:
        raw_res = call_groq_chat(BRD_SYSTEM_PROMPT, user_prompt, json_mode=True, max_tokens=1800)
        cleaned = clean_json_response(raw_res)
        brd_dict = json.loads(cleaned)
        
        # Ensure section_20_risks explicitly contains missing/inadequate requirement analysis
        req_risks = analyze_missing_requirement_risks(proposal_text, project_name, project_type)
        if "section_20_risks" not in brd_dict or not isinstance(brd_dict["section_20_risks"], list) or len(brd_dict["section_20_risks"]) == 0:
            brd_dict["section_20_risks"] = req_risks
        else:
            existing_ids = [str(r.get("id", "")) for r in brd_dict["section_20_risks"]]
            for rr in req_risks:
                if rr["id"] not in existing_ids:
                    brd_dict["section_20_risks"].append(rr)
        return brd_dict
    except Exception as e:
        print(f"BRD generation AI note (using structured fallback): {e}")
        return generate_fallback_brd(proposal_text, project_name, client_name, project_type, industry)

def normalize_excel_timeline(item: dict) -> str:
    """
    Preserve the requirement priority and kickoff timing
    used by the Excel prerequisite tracker.
    """

    raw_timeline = (
        item.get("requirement_timeline")
        or item.get("timeline")
        or item.get("due_date")
        or ""
    )

    raw = str(raw_timeline).strip()



    import re

    # Preserve P0/P1/P2 when the source explicitly provides it.
    priority_match = re.search(
        r"\b(P[0-3])\b",
        raw,
        flags=re.IGNORECASE,
    )

    priority = (
        priority_match.group(1).upper()
        if priority_match
        else None
    )

    low = raw.lower()

    # Normalize kickoff-related timelines.
    if (
        "immediately required before kick-off" in low
        or "immediately before kick-off" in low
        or "immediately before kickoff" in low
    ):
        timeline = "Immediately required before kick-off"

    elif (
        "required at kick-off" in low
        or "required at kickoff" in low
        or "at engagement start" in low
    ):
        timeline = "Required at kick-off"

    elif (
        "post kick-off" in low
        or "post kickoff" in low
        or "after kick-off" in low
        or "after kickoff" in low
        or "after project kickoff" in low
    ):
        timeline = "Post Kick-off"

    elif (
        "before kick-off" in low
        or "before kickoff" in low
    ):
        timeline = "Immediately required before kick-off"

    else:
        # Do not invent a lifecycle phase for unrecognized timing.
        timeline = raw

    # Return the priority and timing together only when priority
    # was explicitly present in the original source.
    if priority:
        return f"{priority} - {timeline}"

    return timeline
def analyze_missing_requirement_risks(proposal_text: str, project_name: str = "", project_type: str = "") -> list:
    """Analyzes proposal text to identify missing or inadequate requirements and generates explicit risk entries."""
    txt = (str(proposal_text) + " " + str(project_name) + " " + str(project_type)).lower()
    risks = []

    # 1. Check for missing/inadequate API SLAs & rate limits
    if not any(k in txt for k in ["rate limit", "throughput", "sla", "latency limit", "quota", "p95"]):
        risks.append({
            "id": "R-MISS-01",
            "risk": "Inadequate Requirement Specification: SOW lacks formal API rate-limit, throughput SLA, and timeout definitions for integrated endpoints.",
            "likelihood": "High",
            "impact": "High",
            "mitigation": "Establish mandatory SLA contracts during Sprint 0 kick-off and configure real-time telemetry alerts.",
            "owner": "Akshay"
        })

    # 2. Check for missing DB Schema / Field Specifications
    if not any(k in txt for k in ["schema", "erd", "data dictionary", "table structure", "data model"]):
        risks.append({
            "id": "R-MISS-02",
            "risk": "Missing Architectural Prerequisite: Target database schema & field-level entity relationships are unstated in initial proposal.",
            "likelihood": "High",
            "impact": "High",
            "mitigation": "Conduct architectural discovery workshop with client DBAs prior to staging environment access provisioning.",
            "owner": "Thasleema"
        })

    # 3. Check for missing Zero-Exposure Security Governance
    if not any(k in txt for k in ["zero-exposure", "secret vault", "key masking", "iam role", "token vault"]):
        risks.append({
            "id": "R-MISS-03",
            "risk": "Inadequate Security Governance: Absence of zero-exposure credential masking and secrets vault protocols in SOW requirements.",
            "likelihood": "Medium",
            "impact": "High",
            "mitigation": "Enforce mandatory PreQ cryptographic key masking and role-based access control before credential dispatch.",
            "owner": "Thasleema"
        })

    # 4. Check for unstated Disaster Recovery RPO/RTO
    if not any(k in txt for k in ["rpo", "rto", "disaster recovery", "backup policy", "failover"]):
        risks.append({
            "id": "R-MISS-04",
            "risk": "Missing Non-Functional Requirement: Unstated Disaster Recovery RPO/RTO parameters and environment failover strategy.",
            "likelihood": "Medium",
            "impact": "Medium",
            "mitigation": "Define automated database snapshotting (RPO 15m) and blue/green deployment strategy in Section 16 NFRs.",
            "owner": "Akshay"
        })

    # Baseline risk fallback
    if not risks:
        risks.append({
            "id": "R-REQ-01",
            "risk": "Risk of scope creep due to unvetted requirement ambiguities during active development.",
            "likelihood": "Medium",
            "impact": "Medium",
            "mitigation": "Enforce strict 27-section BRD requirement traceability and dual review sign-off by Akshay & Thasleema.",
            "owner": "Akshay"
        })

    return risks


def derive_dynamic_project_roles(proposal_text: str, project_name: str = "", client_name: str = "", project_type: str = "", industry: str = "") -> dict:
    """Dynamically derives proposal-specific roles for RACI, User Roles, Reviewers, and Sign-offs."""
    txt = (str(proposal_text) + " " + str(project_name) + " " + str(project_type) + " " + str(industry)).lower()
    c_name = client_name or "Client Organization"

    if any(k in txt for k in ["llm", "ai", "groq", "rag", "prompt", "embedding", "vector", "gpt", "genai", "model"]):
        return {
            "business_sponsor": f"{c_name} Executive AI Sponsor",
            "tech_lead": "Thasleema (Project Manager)",
            "product_lead": "Akshay (Team Lead)",
            "raci_roles": [
                {"name": f"{c_name} Executive AI Sponsor", "role": "Business Sponsor", "interest": "GenAI Strategy & Outcomes", "raci": "A"},
                {"name": "Akshay", "role": "Team Lead", "interest": "Technical Delivery & Requirement Scope", "raci": "R"},
                {"name": "Thasleema", "role": "Project Manager", "interest": "Project Schedule, Governance & Delivery", "raci": "R"},
                {"name": "AI Safety & Compliance Officer", "role": "AI Governance Auditor", "interest": "Model Safety & Zero Data Exposure", "raci": "C"}
            ],
            "user_roles": [
                {"role": "LLM & Prompt Engineer", "description": "Constructs and tunes retrieval workflows, system prompts, and vector embeddings", "access": "AI Workbench Console", "approx_users": "8"},
                {"role": "Model Evaluation Reviewer", "description": "Audits model output accuracy, latency metrics, and hallucination scores", "access": "Eval & Analytics Portal", "approx_users": "4"},
                {"role": "Enterprise Operator / End User", "description": "Interacts with automated AI assistants and multi-agent workflows", "access": "Web App / REST API", "approx_users": "250"}
            ],
            "reviewers": [
                {"name": f"{c_name} Sponsor", "role": "Executive AI Sponsor", "responsibility": "Approver", "approval_date": "Pending"},
                {"name": "Akshay", "role": "Team Lead", "responsibility": "Approver", "approval_date": datetime.date.today().strftime("%d-%m-%Y")},
                {"name": "Thasleema", "role": "Project Manager", "responsibility": "Reviewer", "approval_date": datetime.date.today().strftime("%d-%m-%Y")},
                {"name": "AI Governance Auditor", "role": "AI Safety Lead", "responsibility": "Reviewer", "approval_date": "Pending"}
            ]
        }
    elif any(k in txt for k in ["cloud", "aws", "azure", "gcp", "kubernetes", "terraform", "devops", "infrastructure"]):
        return {
            "business_sponsor": f"{c_name} VP of Infrastructure",
            "tech_lead": "Thasleema (Project Manager)",
            "product_lead": "Akshay (Team Lead)",
            "raci_roles": [
                {"name": f"{c_name} Infrastructure Sponsor", "role": "Cloud Executive", "interest": "Uptime & SLA Governance", "raci": "A"},
                {"name": "Akshay", "role": "Team Lead", "interest": "Deployment Timelines & Technical Scope", "raci": "R"},
                {"name": "Thasleema", "role": "Project Manager", "interest": "Infrastructure Project Schedule & Coordination", "raci": "R"},
                {"name": "Cloud Security Auditor", "role": "Infosec Lead", "interest": "IAM & Key Management", "raci": "C"}
            ],
            "user_roles": [
                {"role": "Cloud DevOps & SRE Engineer", "description": "Manages Terraform IaC pipelines, Kubernetes clusters, and deployment manifests", "access": "Cloud Console & CLI", "approx_users": "12"},
                {"role": "Security Compliance Inspector", "description": "Reviews IAM policies, VPC peering configs, and encryption keys", "access": "Security Hub", "approx_users": "3"},
                {"role": "Application Developer", "description": "Deploys microservices and consumes infrastructure APIs", "access": "CI/CD Pipeline", "approx_users": "45"}
            ],
            "reviewers": [
                {"name": f"{c_name} Cloud Sponsor", "role": "VP of Infrastructure", "responsibility": "Approver", "approval_date": "Pending"},
                {"name": "Akshay", "role": "Team Lead", "responsibility": "Approver", "approval_date": datetime.date.today().strftime("%d-%m-%Y")},
                {"name": "Thasleema", "role": "Project Manager", "responsibility": "Reviewer", "approval_date": datetime.date.today().strftime("%d-%m-%Y")},
                {"name": "Infosec Lead", "role": "Cloud Security Auditor", "responsibility": "Reviewer", "approval_date": "Pending"}
            ]
        }
    elif any(k in txt for k in ["data", "etl", "snowflake", "bigquery", "postgres", "sql", "analytics", "pipeline"]):
        return {
            "business_sponsor": f"{c_name} Chief Data Officer (CDO)",
            "tech_lead": "Thasleema (Project Manager)",
            "product_lead": "Akshay (Team Lead)",
            "raci_roles": [
                {"name": f"{c_name} Data Sponsor", "role": "Chief Data Officer", "interest": "Data Integrity & Governance", "raci": "A"},
                {"name": "Akshay", "role": "Team Lead", "interest": "Ingestion Scope & Requirements", "raci": "R"},
                {"name": "Thasleema", "role": "Project Manager", "interest": "ETL Project Management & Milestones", "raci": "R"},
                {"name": "Data Privacy Lead", "role": "Compliance Officer", "interest": "PII Masking & Audit Logging", "raci": "C"}
            ],
            "user_roles": [
                {"role": "Lead Data Pipeline Engineer", "description": "Maintains ETL ingestion streams, data transformations, and schemas", "access": "Data Lake Console", "approx_users": "10"},
                {"role": "BI Analytics Specialist", "description": "Builds executive dashboards and queries curated datasets", "access": "BI Dashboard", "approx_users": "30"},
                {"role": "Data Governance Inspector", "description": "Verifies zero-exposure PII masking and retention policies", "access": "Governance Portal", "approx_users": "5"}
            ],
            "reviewers": [
                {"name": f"{c_name} Data Sponsor", "role": "Chief Data Officer", "responsibility": "Approver", "approval_date": "Pending"},
                {"name": "Akshay", "role": "Team Lead", "responsibility": "Approver", "approval_date": datetime.date.today().strftime("%d-%m-%Y")},
                {"name": "Thasleema", "role": "Project Manager", "responsibility": "Reviewer", "approval_date": datetime.date.today().strftime("%d-%m-%Y")},
                {"name": "Data Privacy Lead", "role": "Compliance Officer", "responsibility": "Reviewer", "approval_date": "Pending"}
            ]
        }
    else:
        domain_title = project_type or "Enterprise Systems"
        return {
            "business_sponsor": f"{c_name} Executive Sponsor",
            "tech_lead": "Thasleema (Project Manager)",
            "product_lead": "Akshay (Team Lead)",
            "raci_roles": [
                {"name": f"{c_name} Executive Sponsor", "role": "Business Sponsor", "interest": "Budget & Project Outcome", "raci": "A"},
                {"name": "Akshay", "role": "Team Lead", "interest": "Scope & Requirement Traceability", "raci": "R"},
                {"name": "Thasleema", "role": "Project Manager", "interest": "Project Management & Delivery", "raci": "R"},
                {"name": "Enterprise Security Lead", "role": "Governance Lead", "interest": "Security & Credential Governance", "raci": "C"}
            ],
            "user_roles": [
                {"role": f"{domain_title} Integration Engineer", "description": "Oversees system connectors and validates environment prerequisites", "access": "Admin Console, SSO", "approx_users": "10"},
                {"role": "Technical Reviewer / Approver", "description": "Inspects prerequisite evidence artifacts and grants verification", "access": "Reviewer Console", "approx_users": "5"},
                {"role": "Operational End User", "description": "Executes daily business operations and monitors real-time telemetry", "access": "Web Dashboard", "approx_users": "100"}
            ],
            "reviewers": [
                {"name": f"{c_name} Executive Sponsor", "role": "Business Sponsor", "responsibility": "Approver", "approval_date": "Pending"},
                {"name": "Akshay", "role": "Team Lead", "responsibility": "Approver", "approval_date": datetime.date.today().strftime("%d-%m-%Y")},
                {"name": "Thasleema", "role": "Project Manager", "responsibility": "Reviewer", "approval_date": datetime.date.today().strftime("%d-%m-%Y")},
                {"name": "Enterprise Security Lead", "role": "QA & Security Auditor", "responsibility": "Reviewer", "approval_date": "Pending"}
            ]
        }


def generate_fallback_brd(proposal_text: str, project_name: str, client_name: str, project_type: str, industry: str) -> dict:
    """Deterministic, rich fallback BRD strictly populated with proposal details and dynamic project roles."""
    p_name = project_name or "Enterprise System Implementation"
    c_name = client_name or "Enterprise Client"
    today = datetime.date.today().strftime("%d-%m-%Y")

    dyn = derive_dynamic_project_roles(proposal_text, project_name, client_name, project_type, industry)

    return {
        "project_name": p_name,
        "version": "1.0",
        "date": today,
        "status": "In review",
        "prepared_by": "Akshay (Team Lead) & Thasleema (Project Manager)",
        "section_1_doc_control": {
            "project_name": p_name,
            "ticket_id": f"PRJ-{datetime.date.today().year}-{p_name[:3].upper()}",
            "owner": dyn["product_lead"],
            "business_sponsor": dyn["business_sponsor"],
            "tech_lead": dyn["tech_lead"],
            "version": "1.0",
            "status": "In review",
            "last_updated": today,
            "related_docs": "Statement of Work, Architecture Specification, Pre-Req Tracker",
            "revision_history": [
                {"version": "0.1", "date": today, "author": "Akshay (Team Lead)", "summary": "Initial proposal extraction"},
                {"version": "1.0", "date": today, "author": "Thasleema (Project Manager)", "summary": "Structured BRD baseline"}
            ],
            "reviewers": dyn["reviewers"]
        },
        "section_2_executive_summary": f"This project delivers an enterprise-grade {project_type or 'AI and cloud solution'} for {c_name}. The system addresses operational latency and data integration barriers by providing automated workflows, secure API handshakes, and Day-1 verified architecture. Target delivery enables seamless kick-off with zero unvetted prerequisites.",
        "section_3_background": {
            "problem": f"Existing manual and fragmented workflows at {c_name} lead to delivery bottlenecks and uncoordinated environment access.",
            "business_impact": "Operational delays, lack of visibility into technical gatekeepers, and risk of delayed sprint kick-offs.",
            "root_cause": "Absence of structured prerequisite governance and automated requirement traceability prior to development.",
            "why_now": "Immediate business need to launch production capabilities within the target schedule."
        },
        "section_4_objectives": [
            {"id": "OBJ-01", "objective": "Achieve 100% Day-1 prerequisite clearance", "kpi": "% Gatekeepers Verified", "baseline": "0%", "target": "100%", "measured_by": "PreQ Dashboard", "date": today},
            {"id": "OBJ-02", "objective": "Automate core integration workflows", "kpi": "Transaction latency", "baseline": "Manual", "target": "< 500ms", "measured_by": "Telemetry", "date": today}
        ],
        "section_5_scope": {
            "in_scope": [
                f"Core {project_type or 'architecture'} implementation",
                "API and database integration with staging environments",
                "Automated validation and verification telemetry",
                "Security compliance, IAM role provisioning, and key masking"
            ],
            "out_of_scope": [
                "Unrelated legacy system deprecation",
                "Production hardware provisioning outside cloud tenant"
            ],
            "platforms": "Cloud Infrastructure (AWS/GCP/Azure), Web Application",
            "browsers": "Latest versions of Chrome, Safari, Edge, Firefox",
            "languages": "English (Primary)",
            "environments": "DEV -> QA -> STAGING -> PROD"
        },
        "section_6_stakeholders": {
            "raci": dyn["raci_roles"],
            "user_roles": dyn["user_roles"],
            "permissions": [
                {"action": "Submit Prerequisites", "role_1": "✓", "role_2": "—", "role_3": "—"},
                {"action": "Approve / Verify Evidence", "role_1": "—", "role_2": "✓", "role_3": "✓"}
            ]
        },
        "section_7_current_future_state": {
            "as_is_steps": [
                "1. Stakeholders exchange credentials and requirements over unstructured email/chat threads.",
                "2. Engineers discover missing access permissions during active sprint cycles.",
                "3. Sprints stall pending third-party API quotas and database whitelisting."
            ],
            "pain_points": ["No single source of truth", "Missing security masking", "Unpredictable kick-off delays"],
            "to_be_flow": [
                {"step": "1", "actor": "Client Lead", "action": "Uploads proposal / SOW", "system_behaviour": "AI extracts 27-section BRD and minimal tracker", "next_step": "2"},
                {"step": "2", "actor": "Akshay / Thasleema", "action": "Review tracker internally", "system_behaviour": "Sets review status to Approved", "next_step": "3"},
                {"step": "3", "actor": "Client Sponsor", "action": "Submits proof / credentials", "system_behaviour": "Zero-exposure masking and instant verification", "next_step": "End"}
            ],
            "gap_analysis": [
                {"area": "Process", "current": "Manual email handovers", "future": "Automated PreQ portal", "gap": "Implement centralized tracker"},
                {"area": "Security", "current": "Plaintext secret sharing", "future": "Cryptographic masking", "gap": "Vault & zero-exposure integration"}
            ]
        },
        "section_8_business_requirements": [
            {"id": "BR-01", "requirement": "All prerequisite access credentials must be verified 48h before kick-off", "priority": "Must", "objective": "OBJ-01", "owner": "Akshay"},
            {"id": "BR-02", "requirement": "System must support real-time status and audit logging", "priority": "Must", "objective": "OBJ-02", "owner": "Thasleema"}
        ],
        "section_9_functional_requirements": {
            "list": [
                {"id": "FR-01", "requirement": "The system shall ingest proposal documents (DOCX, PPTX, PDF) and extract structured requirements.", "priority": "Must", "traces_to": "BR-01", "user_story": "US-01"},
                {"id": "FR-02", "requirement": "The system shall enforce internal review by Akshay & Thasleema prior to external client sharing.", "priority": "Must", "traces_to": "BR-01", "user_story": "US-02"}
            ],
            "user_stories": [
                {
                    "id": "US-01",
                    "title": "Automated Proposal Ingestion",
                    "story": "As an engineering lead, I want to upload a proposal so that requirements and prerequisites are automatically mapped.",
                    "linked_fr": "FR-01",
                    "priority": "Must / 5 pts",
                    "acceptance_criteria": [
                        "AC1 - Given a valid DOCX, PPTX or PDF file, when uploaded, then the system extracts text and generates the BRD within 10 seconds.",
                        "AC2 - Given unreadable or empty files, when uploaded, then clear validation feedback is returned."
                    ],
                    "out_of_scope": "Manual OCR of physical paper documents"
                }
            ]
        },
        "section_10_business_rules": [
            {"id": "BRL-01", "rule": "Internal Review Gate", "condition": "Tracker generated from proposal", "outcome": "Lock external sharing until Akshay & Thasleema approve", "configurable": "No", "error_code": "E-REV-01"},
            {"id": "BRL-02", "rule": "Zero Plaintext Secrets", "condition": "Secret key or token entered", "outcome": "Mask and store securely", "configurable": "No", "error_code": "E-SEC-02"}
        ],
        "section_11_data_requirements": {
            "entities": [
                {"entity": "Project", "description": "Core initiative entity", "relationships": "1 Project -> Many ChecklistItems"},
                {"entity": "ChecklistItem", "description": "Prerequisite milestone", "relationships": "Belongs to 1 Project"}
            ],
            "data_dictionary": [
                {"field": "name", "entity": "ChecklistItem", "type": "String", "format": "Text (1-255 chars)", "required": "Yes", "validation": "Non-empty string", "example": "MySQL Read-Only Credentials"},
                {"field": "status", "entity": "ChecklistItem", "type": "Enum", "format": "Pending | Submitted | Verified", "required": "Yes", "validation": "Valid status enum", "example": "Pending"}
            ],
            "retention_privacy": {
                "retention": "Active project artifacts retained throughout engagement lifecycle; logs retained 7 years.",
                "sensitive_fields": "API keys, database passwords, IAM role credentials (encrypted at rest).",
                "data_migration": "Direct ingestion from structured proposals."
            }
        },
        "section_12_ui_requirements": {
            "screens": [
                {"id": "SCR-01", "name": "Proposal Upload & Ingestion", "role": "Lead Architect", "key_fields": "Dropzone, file picker, parse status", "actions": "Upload, Analyze, Generate", "wireframe": "CreateProject.jsx"},
                {"id": "SCR-02", "name": "Minimal Pre-Req Tracker View", "role": "Solutions Team", "key_fields": "Milestone list, internal review badge, export button", "actions": "Review, Approve, Export Excel", "wireframe": "ProjectDashboard.jsx"}
            ],
            "states": "Loading, parsed, reviewing, approved, error",
            "breakpoints": "360px (mobile), 768px (tablet), 1280px (desktop), 1920px (ultrawide)"
        },
        "section_13_integration_api": {
            "integrations": [
                {"id": "INT-01", "system": "Groq LLM Engine", "direction": "Outbound", "protocol": "REST / JSON", "trigger": "Proposal upload", "auth": "API Key", "timeout_retry": "30s / 2 retries"},
                {"id": "INT-02", "system": "PostgreSQL Database", "direction": "Inbound/Outbound", "protocol": "SQL / TLS", "trigger": "On state change", "auth": "Database connection pool", "timeout_retry": "5s"}
            ],
            "sample_contract": "POST /api/analyze-sow-file\n{\n  \"status\": \"success\",\n  \"project_id\": \"uuid\"\n}",
            "failure_handling": "Fallback to deterministic senior architectural rule engine if LLM provider times out."
        },
        "section_14_notifications": [
            {"id": "NTF-01", "trigger": "Tracker generated", "channel": "In-app Alert", "recipient": "Akshay & Thasleema", "summary": "New proposal analyzed and ready for internal review", "template": "TPL-REV-01"},
            {"id": "NTF-02", "trigger": "Evidence submitted", "channel": "Dashboard & Webhook", "recipient": "Engineering Team", "summary": "Milestone evidence submitted for review", "template": "TPL-EVI-02"}
        ],
        "section_15_reporting": [
            {"report": "Pre-Req Executive Readiness Index", "audience": "Leadership & Sponsors", "metrics": "% Cleared, Blockers Remaining", "frequency": "Realtime", "format": "Interactive Dashboard"},
            {"report": "Minimal Pre-Req Tracker Spreadsheet", "audience": "Delivery Team", "metrics": "Milestones, Owners, SLAs, Statuses", "frequency": "On-demand", "format": "Excel (.xlsx)"}
        ],
        "section_16_non_functional": [
            {"id": "NFR-01", "category": "Performance", "requirement": "Proposal parsing and tracker generation within 5s", "target": "< 5.0s"},
            {"id": "NFR-02", "category": "Capacity / Scalability", "requirement": "Support concurrent proposal document parsing", "target": "100 concurrent"},
            {"id": "NFR-03", "category": "Availability", "requirement": "Cloud service uptime", "target": "99.9%"},
            {"id": "NFR-04", "category": "Security", "requirement": "Zero-exposure key masking & TLS 1.3 encryption", "target": "AES-256 / TLS 1.3"},
            {"id": "NFR-05", "category": "Compliance", "requirement": "Proposal confidentiality and access controls", "target": "SOC2 Type II"},
            {"id": "NFR-06", "category": "Accessibility", "requirement": "Accessible web dashboard contrast and controls", "target": "WCAG 2.1 AA"},
            {"id": "NFR-07", "category": "Audit Logging", "requirement": "Complete audit trail of reviews and approvals", "target": "Retained 7 years"},
            {"id": "NFR-08", "category": "Backup / Recovery", "requirement": "Automated snapshotting and recovery", "target": "RPO 15m, RTO 1h"},
            {"id": "NFR-09", "category": "Monitoring", "requirement": "Application telemetry and health probe", "target": "99.9% health check"}
        ],
        "section_17_error_handling": {
            "errors": [
                {"code": "E-DOC-01", "scenario": "Corrupted or password-protected file", "message": "Unable to read document. Please upload an unprotected DOCX, PPTX or PDF.", "behaviour": "Reject file gracefully"},
                {"code": "E-REV-02", "scenario": "Attempting external sync before review", "message": "Tracker requires internal approval by Akshay & Thasleema before external dispatch.", "behaviour": "Halt external sharing"}
            ],
            "edge_cases": [
                "User uploads slides containing only diagrams -> extract shape metadata and OCR text",
                "Proposal contains multi-cloud hybrid requirements -> split into discrete cloud prerequisite tracks"
            ]
        },
        "section_18_security_compliance": {
            "auth": "Role-based access with session tokens and secure credential vaults",
            "session": "30-minute idle timeout for administrative sessions",
            "data_masking": "All uploaded API keys and connection strings masked with zero-exposure hashes",
            "consent": "Formal internal review sign-off by Akshay & Thasleema",
            "security_testing": "Automated vulnerability scanning and dependency auditing"
        },
        "section_19_assumptions_constraints": {
            "assumptions": [
                "Uploaded proposals accurately reflect agreed architectural scope.",
                "Client stakeholders have authority to provision requested staging credentials."
            ],
            "constraints": [
                {"type": "Process", "constraint": "Generated tracker must NOT be sent directly to client without internal review."},
                {"type": "Format", "constraint": "BRD must strictly follow the 27-section template format."}
            ],
            "dependencies": [
                {"id": "DEP-01", "dependency": "Proposal document upload", "owner": "Sales / Delivery Lead", "needed_by": "Day -10"},
                {"id": "DEP-02", "dependency": "Internal review sign-off", "owner": "Akshay & Thasleema", "needed_by": "Day -7"}
            ]
        },
        "section_20_risks": analyze_missing_requirement_risks(proposal_text, p_name, project_type),
        "section_21_testing_uat": {
            "tests": [
                {"id": "TC-01", "scenario": "Verify DOCX/PPTX proposal upload", "steps": "Upload document -> Verify text extraction", "expected": "27-section BRD and minimal tracker generated", "traces_to": "US-01"},
                {"id": "TC-02", "scenario": "Verify internal review workflow", "steps": "Click approve by Akshay & Thasleema", "expected": "Tracker status updates to Approved", "traces_to": "US-02"}
            ],
            "entry_criteria": "All unit tests passing and proposal parser validated against sample documents",
            "exit_criteria": "Successful generation and export of both .docx BRD and .xlsx tracker"
        },
        "section_22_traceability": [
            {"obj": "OBJ-01", "br": "BR-01", "fr": "FR-01", "us": "US-01", "rule": "BRL-01", "test": "TC-01", "status": "Passed"},
            {"obj": "OBJ-02", "br": "BR-02", "fr": "FR-02", "us": "US-02", "rule": "BRL-02", "test": "TC-02", "status": "Passed"}
        ],
        "section_23_release_plan": [
            {"milestone": "Proposal Analysis & BRD Generation", "target_date": "Day -10", "exit_criteria": "27-section BRD ready"},
            {"milestone": "Internal Review (Akshay & Thasleema)", "target_date": "Day -7", "exit_criteria": "Internal sign-off complete"},
            {"milestone": "Prerequisite Delivery & Verification", "target_date": "Day -2", "exit_criteria": "100% Day-1 blockers cleared"},
            {"milestone": "Sprint Kick-off", "target_date": "Day 0", "exit_criteria": "Architecture sprint 0 launch"}
        ],
        "section_24_open_questions": [
            {"id": "Q-01", "question": "Are client staging RDS instances accessible via VPC peering or static NAT EIP?", "raised_by": "Thasleema", "owner": "Client DevOps Lead", "due": "Day -7", "status": "Open"}
        ],
        "section_25_glossary": [
            {"term": "BRD", "definition": "Business Requirements Document"},
            {"term": "PreQ", "definition": "Pre-requisite Verification & Readiness Platform"},
            {"term": "SOW", "definition": "Statement of Work"},
            {"term": "SLA", "definition": "Service Level Agreement"},
            {"term": "MoSCoW", "definition": "Prioritization framework: Must, Should, Could, Won't"}
        ],
        "section_26_appendices": [
            "Appendix A: Proposal Document Raw Extract",
            "Appendix B: Architectural Flow & Sequence Diagrams",
            "Appendix C: Zero-Exposure Masking & Credential Standards",
            "Appendix D: Internal Review Audit Trail (Akshay & Thasleema)",
            "Appendix E: Regulatory & Security Compliance Checklists"
        ],
        "section_27_signoff": [
            {"name": f"{c_name} Sponsor", "role": "Business Sponsor", "signature": "", "date": ""},
            {"name": "Akshay", "role": "Team Lead", "signature": "Akshay", "date": today},
            {"name": "Thasleema", "role": "Project Manager", "signature": "Thasleema", "date": today},
            {"name": "QA Lead", "role": "QA Lead", "signature": "", "date": ""}
        ]
    }


def normalize_brd_roles(brd: dict) -> dict:
    """Ensures Akshay is designated as Team Lead and Thasleema as Project Manager across all sections."""
    if not isinstance(brd, dict):
        return brd

    # Cover page prepared by
    brd["prepared_by"] = "Akshay (Team Lead) & Thasleema (Project Manager)"

    # Section 1 Document Control
    doc_ctrl = brd.get("section_1_doc_control")
    if isinstance(doc_ctrl, dict):
        doc_ctrl["owner"] = "Akshay (Team Lead)"
        doc_ctrl["tech_lead"] = "Akshay (Team Lead)"
        doc_ctrl["team_lead"] = "Akshay (Team Lead)"
        doc_ctrl["project_manager"] = "Thasleema (Project Manager)"

        for rev in doc_ctrl.get("revision_history", []):
            if isinstance(rev, dict) and rev.get("author"):
                if "akshay" in str(rev["author"]).lower():
                    rev["author"] = "Akshay (Team Lead)"
                elif "thasleema" in str(rev["author"]).lower():
                    rev["author"] = "Thasleema (Project Manager)"

        for revw in doc_ctrl.get("reviewers", []):
            if isinstance(revw, dict) and revw.get("name"):
                if "akshay" in str(revw["name"]).lower():
                    revw["role"] = "Team Lead"
                elif "thasleema" in str(revw["name"]).lower():
                    revw["role"] = "Project Manager"

    # Section 6 Stakeholders
    stk = brd.get("section_6_stakeholders")
    if isinstance(stk, dict):
        for r in stk.get("raci", []):
            if isinstance(r, dict) and r.get("name"):
                if "akshay" in str(r["name"]).lower():
                    r["role"] = "Team Lead"
                elif "thasleema" in str(r["name"]).lower():
                    r["role"] = "Project Manager"

        for ur in stk.get("user_roles", []):
            if isinstance(ur, dict):
                if "akshay" in str(ur.get("role", "")).lower() or "akshay" in str(ur.get("description", "")).lower():
                    ur["role"] = "Team Lead"
                elif "thasleema" in str(ur.get("role", "")).lower() or "thasleema" in str(ur.get("description", "")).lower():
                    ur["role"] = "Project Manager"

    # Section 27 Sign-off
    signoff = brd.get("section_27_signoff")
    if isinstance(signoff, list):
        for s in signoff:
            if isinstance(s, dict) and s.get("name"):
                if "akshay" in str(s["name"]).lower():
                    s["role"] = "Team Lead"
                elif "thasleema" in str(s["name"]).lower():
                    s["role"] = "Project Manager"

    return brd


def generate_brd_docx(brd: dict) -> io.BytesIO:
    """Generates a professional, beautifully formatted Word .docx document with goML header logo, Orange styling, and Black text (No black backgrounds)."""
    brd = normalize_brd_roles(brd)
    doc = docx.Document()

    # Ensure goML logo exists on disk
    logo_path = os.path.join(os.path.dirname(__file__), "goml_logo.png")
    ensure_goml_logo(logo_path)

    # Set page margins and top right goML logo on page header (for page 2 onwards)
    for section in doc.sections:
        section.top_margin = Inches(0.6)
        section.bottom_margin = Inches(0.7)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        section.different_first_page_header_footer = True
        section.header_distance = Inches(0.25)
        section.footer_distance = Inches(0.3)

        # Header configuration: Top Right goML Logo on subsequent pages
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hp.paragraph_format.space_before = Pt(0)
        hp.paragraph_format.space_after = Pt(0)
        if os.path.exists(logo_path):
            hrun = hp.add_run()
            hrun.add_picture(logo_path, width=Inches(0.75))

        # Footer configuration: Left title, Right pagination hint
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.paragraph_format.space_before = Pt(4)
        fp.paragraph_format.space_after = Pt(0)
        frun_l = fp.add_run("goML PreQ • Business Requirements Document")
        frun_l.font.name = "Segoe UI"
        frun_l.font.size = Pt(8.5)
        frun_l.font.color.rgb = RGBColor(148, 163, 184)

    # Helper styling functions matching the exact modal preview typography & colors
    def add_title(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(36)
        p.paragraph_format.space_after = Pt(6)
        run = p.add_run(text)
        run.font.name = "Segoe UI"
        run.font.size = Pt(24)
        run.font.bold = True
        run.font.color.rgb = RGBColor(15, 23, 42) # #0F172A Dark Navy Black
        return p

    def add_subtitle(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(16)
        run = p.add_run(text)
        run.font.name = "Segoe UI"
        run.font.size = Pt(13)
        run.font.bold = True
        run.font.color.rgb = RGBColor(237, 125, 49) # #ED7D31 Brand Orange
        return p

    def add_heading1(text):
        p = doc.add_paragraph()
        run = p.add_run(text)
        run.font.name = "Segoe UI"
        run.font.size = Pt(13.5)
        run.font.bold = True
        run.font.color.rgb = RGBColor(15, 23, 42) # #0F172A Dark Navy Black (1:1 with modal h2)
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        return p

    def add_heading2(text):
        p = doc.add_paragraph()
        run = p.add_run(text)
        run.font.name = "Segoe UI"
        run.font.size = Pt(11)
        run.font.bold = True
        run.font.color.rgb = RGBColor(237, 125, 49) # #ED7D31 Brand Orange (1:1 with modal h3)
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        return p

    def add_body(text, italic=False, bold=False):
        p = doc.add_paragraph()
        run = p.add_run(text)
        run.font.name = "Segoe UI"
        run.font.size = Pt(9.5)
        run.font.italic = italic
        run.font.bold = bold
        run.font.color.rgb = RGBColor(30, 41, 59) # #1E293B
        p.paragraph_format.space_after = Pt(4)
        return p

    def style_table(table, col_widths=None, is_kv_table=False):
        table.alignment = WD_TABLE_ALIGNMENT.CENTER

        # Clean modern enterprise borders: Subtle light gray #E2E8F0 borders
        tblPr = table._tbl.tblPr
        borders_xml = (
            f'<w:tblBorders {nsdecls("w")}>'
            f'<w:top w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>'
            f'<w:left w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>'
            f'<w:bottom w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>'
            f'<w:right w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>'
            f'<w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>'
            f'<w:insideV w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>'
            f'</w:tblBorders>'
        )
        tblPr.append(parse_xml(borders_xml))

        # Padding inside cells matching modal padding:
        cell_mar_xml = (
            f'<w:tblCellMar {nsdecls("w")}>'
            f'<w:top w:w="130" w:type="dxa"/>'
            f'<w:bottom w:w="130" w:type="dxa"/>'
            f'<w:left w:w="170" w:type="dxa"/>'
            f'<w:right w:w="170" w:type="dxa"/>'
            f'</w:tblCellMar>'
        )
        tblPr.append(parse_xml(cell_mar_xml))

        # Header row: Subtle light gray #F8FAFC fill, Slate Gray #475569 bold uppercase text
        hdr_cells = table.rows[0].cells
        for cell in hdr_cells:
            shading_elm = parse_xml(r'<w:shd {} w:fill="F8FAFC"/>'.format(nsdecls('w')))
            cell._tc.get_or_add_tcPr().append(shading_elm)
            for paragraph in cell.paragraphs:
                paragraph.paragraph_format.space_before = Pt(2)
                paragraph.paragraph_format.space_after = Pt(2)
                for run in paragraph.runs:
                    run.font.name = "Segoe UI"
                    run.font.size = Pt(8.5)
                    run.font.bold = True
                    run.font.color.rgb = RGBColor(71, 85, 105) # #475569 Slate text
                    run.text = run.text.upper() # Match modal uppercase header text

        # Style data rows:
        for row in table.rows[1:]:
            for col_idx, cell in enumerate(row.cells):
                if is_kv_table and col_idx == 0:
                    shading_elm = parse_xml(r'<w:shd {} w:fill="F8FAFC"/>'.format(nsdecls('w')))
                    cell._tc.get_or_add_tcPr().append(shading_elm)
                    for paragraph in cell.paragraphs:
                        paragraph.paragraph_format.space_before = Pt(2)
                        paragraph.paragraph_format.space_after = Pt(2)
                        for run in paragraph.runs:
                            run.font.name = "Segoe UI"
                            run.font.size = Pt(9)
                            run.font.bold = True
                            run.font.color.rgb = RGBColor(15, 23, 42) # #0F172A
                else:
                    shading_elm = parse_xml(r'<w:shd {} w:fill="FFFFFF"/>'.format(nsdecls('w')))
                    cell._tc.get_or_add_tcPr().append(shading_elm)
                    for paragraph in cell.paragraphs:
                        paragraph.paragraph_format.space_before = Pt(2)
                        paragraph.paragraph_format.space_after = Pt(2)
                        for run in paragraph.runs:
                            run.font.name = "Segoe UI"
                            run.font.size = Pt(9)
                            run.font.bold = False
                            run.font.color.rgb = RGBColor(30, 41, 59) # #1E293B

        if col_widths:
            for row in table.rows:
                for idx, width in enumerate(col_widths):
                    if idx < len(row.cells):
                        row.cells[idx].width = Inches(width)

    # --- COVER PAGE ---
    if os.path.exists(logo_path):
        p_cover_logo = doc.add_paragraph()
        p_cover_logo.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p_cover_logo.paragraph_format.space_before = Pt(0)
        p_cover_logo.paragraph_format.space_after = Pt(20)
        r_cover_logo = p_cover_logo.add_run()
        r_cover_logo.add_picture(logo_path, width=Inches(0.85))

    add_title("Business Requirements Document")
    add_subtitle(brd.get('project_name', 'Enterprise Initiative'))

    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_meta.paragraph_format.space_before = Pt(0)
    p_meta.paragraph_format.space_after = Pt(4)
    r_meta_v = p_meta.add_run(f"Version {brd.get('version', '1.0')}  •  {brd.get('date', datetime.date.today().strftime('%d-%m-%Y'))}  •  Status: ")
    r_meta_v.font.name = "Segoe UI"
    r_meta_v.font.size = Pt(10)
    r_meta_v.font.bold = True
    r_meta_v.font.color.rgb = RGBColor(71, 85, 105)
    
    r_meta_s = p_meta.add_run(f"{brd.get('status', 'In review')}")
    r_meta_s.font.name = "Segoe UI"
    r_meta_s.font.size = Pt(10)
    r_meta_s.font.bold = True
    r_meta_s.font.color.rgb = RGBColor(234, 88, 12) # #EA580C Orange Status Badge

    p_meta2 = doc.add_paragraph()
    p_meta2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_meta2.paragraph_format.space_before = Pt(0)
    p_meta2.paragraph_format.space_after = Pt(28)
    r_meta_p = p_meta2.add_run(f"Prepared by {brd.get('prepared_by', 'Akshay (Team Lead) & Thasleema (Project Manager)')}")
    r_meta_p.font.name = "Segoe UI"
    r_meta_p.font.size = Pt(9.5)
    r_meta_p.font.color.rgb = RGBColor(100, 116, 139)

    # Boxed Guidance Notice Card matching modal (Cream #FFF7ED, Orange Accent #ED7D31)
    box_table = doc.add_table(rows=1, cols=1)
    box_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    b_cell = box_table.rows[0].cells[0]
    b_cell.width = Inches(6.4)
    shading_box = parse_xml(r'<w:shd {} w:fill="FFF7ED"/>'.format(nsdecls('w')))
    b_cell._tc.get_or_add_tcPr().append(shading_box)
    
    b_tblPr = box_table._tbl.tblPr
    b_borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="4" w:space="0" w:color="FFEDD5"/>'
        f'<w:left w:val="single" w:sz="24" w:space="0" w:color="ED7D31"/>'
        f'<w:bottom w:val="single" w:sz="4" w:space="0" w:color="FFEDD5"/>'
        f'<w:right w:val="single" w:sz="4" w:space="0" w:color="FFEDD5"/>'
        f'</w:tblBorders>'
    )
    b_tblPr.append(b_borders)

    bp = b_cell.paragraphs[0]
    bp.paragraph_format.space_before = Pt(8)
    bp.paragraph_format.space_after = Pt(8)
    bp_hdr = bp.add_run("DOCUMENT GUIDANCE NOTICE:\n")
    bp_hdr.font.name = "Segoe UI"
    bp_hdr.font.size = Pt(9)
    bp_hdr.font.bold = True
    bp_hdr.font.color.rgb = RGBColor(154, 52, 18)
    
    brun = bp.add_run("This Business Requirements Document was automatically extracted and structured strictly from the project proposal. It specifies all functional, technical, non-functional, and prerequisite requirements. Internal approval by Akshay (Team Lead) & Thasleema (Project Manager) is required before external distribution.")
    brun.font.name = "Segoe UI"
    brun.font.size = Pt(9)
    brun.font.bold = False
    brun.font.color.rgb = RGBColor(154, 52, 18)

    doc.add_page_break()

    # --- SECTION 1: DOCUMENT CONTROL ---
    add_heading1("1. Document control")
    doc_ctrl = brd.get("section_1_doc_control", {})
    
    t1 = doc.add_table(rows=1, cols=2)
    t1.rows[0].cells[0].text = "Field"
    t1.rows[0].cells[1].text = "Details"
    
    fields = [
        ("Project name", doc_ctrl.get("project_name", brd.get("project_name"))),
        ("Project / ticket ID", doc_ctrl.get("ticket_id", "PRJ-2026-GOML")),
        ("Document owner", doc_ctrl.get("owner", "Akshay (Team Lead)")),
        ("Business sponsor", doc_ctrl.get("business_sponsor", "Client Executive")),
        ("Project manager", doc_ctrl.get("project_manager", doc_ctrl.get("tech_lead", "Thasleema (Project Manager)"))),
        ("Version", doc_ctrl.get("version", "1.0")),
        ("Status", doc_ctrl.get("status", "In review")),
        ("Last updated", doc_ctrl.get("last_updated", datetime.date.today().strftime("%d-%m-%Y"))),
        ("Related documents", doc_ctrl.get("related_docs", "Statement of Work, Pre-Req Tracker"))
    ]
    for k, v in fields:
        row = t1.add_row()
        row.cells[0].text = str(k)
        row.cells[1].text = str(v)
    style_table(t1, [2.2, 4.3], is_kv_table=True)

    add_heading2("Revision history")
    t1_rev = doc.add_table(rows=1, cols=4)
    t1_rev.rows[0].cells[0].text = "Version"
    t1_rev.rows[0].cells[1].text = "Date"
    t1_rev.rows[0].cells[2].text = "Author"
    t1_rev.rows[0].cells[3].text = "Summary of changes"
    for rev in doc_ctrl.get("revision_history", []):
        row = t1_rev.add_row()
        row.cells[0].text = rev.get("version", "1.0")
        row.cells[1].text = rev.get("date", "")
        row.cells[2].text = rev.get("author", "")
        row.cells[3].text = rev.get("summary", "")
    style_table(t1_rev, [1.0, 1.2, 1.5, 2.8])

    add_heading2("Reviewers and approvers")
    t1_app = doc.add_table(rows=1, cols=4)
    t1_app.rows[0].cells[0].text = "Name"
    t1_app.rows[0].cells[1].text = "Role"
    t1_app.rows[0].cells[2].text = "Responsibility"
    t1_app.rows[0].cells[3].text = "Approval date"
    for app in doc_ctrl.get("reviewers", []):
        row = t1_app.add_row()
        row.cells[0].text = app.get("name", "")
        row.cells[1].text = app.get("role", "")
        row.cells[2].text = app.get("responsibility", "")
        row.cells[3].text = app.get("approval_date", "Pending")
    style_table(t1_app, [1.6, 1.8, 1.5, 1.6])

    # --- SECTION 2: EXECUTIVE SUMMARY ---
    add_heading1("2. Executive summary")
    add_body(brd.get("section_2_executive_summary", "Executive summary of the proposal scope and architecture."))

    # --- SECTION 3: BACKGROUND & PROBLEM STATEMENT ---
    add_heading1("3. Background and problem statement")
    bg = brd.get("section_3_background", {})
    add_body(f"• Problem: {bg.get('problem', '')}")
    add_body(f"• Business impact: {bg.get('business_impact', '')}")
    add_body(f"• Root cause: {bg.get('root_cause', '')}")
    add_body(f"• Why now: {bg.get('why_now', '')}")

    # --- SECTION 4: OBJECTIVES & SUCCESS METRICS ---
    add_heading1("4. Business objectives and success metrics")
    t4 = doc.add_table(rows=1, cols=7)
    t4.rows[0].cells[0].text = "ID"
    t4.rows[0].cells[1].text = "Objective"
    t4.rows[0].cells[2].text = "KPI"
    t4.rows[0].cells[3].text = "Baseline"
    t4.rows[0].cells[4].text = "Target"
    t4.rows[0].cells[5].text = "Measured by"
    t4.rows[0].cells[6].text = "Date"
    for obj in brd.get("section_4_objectives", []):
        row = t4.add_row()
        row.cells[0].text = obj.get("id", "OBJ-01")
        row.cells[1].text = obj.get("objective", "")
        row.cells[2].text = obj.get("kpi", "")
        row.cells[3].text = obj.get("baseline", "")
        row.cells[4].text = obj.get("target", "")
        row.cells[5].text = obj.get("measured_by", "")
        row.cells[6].text = obj.get("date", "")
    style_table(t4, [0.8, 1.6, 1.1, 0.7, 0.7, 1.0, 0.8])

    # --- SECTION 5: SCOPE ---
    add_heading1("5. Scope")
    scope = brd.get("section_5_scope", {})
    add_heading2("In scope")
    for item in scope.get("in_scope", []):
        add_body(f"• {item}")
    add_heading2("Out of scope")
    for item in scope.get("out_of_scope", []):
        add_body(f"• {item}")
    add_heading2("Platforms and environments")
    t5 = doc.add_table(rows=1, cols=2)
    t5.rows[0].cells[0].text = "Item"
    t5.rows[0].cells[1].text = "Details"
    for k, v in [
        ("Platforms", scope.get("platforms", "Web, Mobile, Cloud")),
        ("Supported browsers", scope.get("browsers", "Latest 2 versions of Chrome, Safari, Edge, Firefox")),
        ("Languages / locales", scope.get("languages", "English")),
        ("Environments", scope.get("environments", "DEV -> QA -> STAGING -> PROD"))
    ]:
        row = t5.add_row()
        row.cells[0].text = k
        row.cells[1].text = str(v)
    style_table(t5, [2.0, 4.5], is_kv_table=True)

    # --- SECTION 6: STAKEHOLDERS & USER ROLES ---
    add_heading1("6. Stakeholders and user roles")
    stk = brd.get("section_6_stakeholders", {})
    add_heading2("6.1 Stakeholders (RACI)")
    t6_1 = doc.add_table(rows=1, cols=4)
    t6_1.rows[0].cells[0].text = "Name"
    t6_1.rows[0].cells[1].text = "Role / department"
    t6_1.rows[0].cells[2].text = "Interest"
    t6_1.rows[0].cells[3].text = "RACI"
    for r in stk.get("raci", []):
        row = t6_1.add_row()
        row.cells[0].text = r.get("name", "")
        row.cells[1].text = r.get("role", "")
        row.cells[2].text = r.get("interest", "")
        row.cells[3].text = r.get("raci", "R")
    style_table(t6_1, [1.5, 1.8, 2.4, 0.8])

    add_heading2("6.2 System user roles")
    t6_2 = doc.add_table(rows=1, cols=4)
    t6_2.rows[0].cells[0].text = "Role"
    t6_2.rows[0].cells[1].text = "Description"
    t6_2.rows[0].cells[2].text = "How they access"
    t6_2.rows[0].cells[3].text = "Approx. users"
    for r in stk.get("user_roles", []):
        row = t6_2.add_row()
        row.cells[0].text = r.get("role", "")
        row.cells[1].text = r.get("description", "")
        row.cells[2].text = r.get("access", "")
        row.cells[3].text = str(r.get("approx_users", "—"))
    style_table(t6_2, [1.5, 2.5, 1.5, 1.0])

    # --- SECTION 7: CURRENT STATE & FUTURE STATE ---
    add_heading1("7. Current state and future state")
    cs = brd.get("section_7_current_future_state", {})
    add_heading2("7.1 Current state (as-is)")
    for step in cs.get("as_is_steps", []):
        add_body(str(step))
    if cs.get("pain_points"):
        add_body(f"Pain points: {', '.join(cs.get('pain_points', []))}", italic=True)

    add_heading2("7.2 Future state (to-be) process flow")
    t7_2 = doc.add_table(rows=1, cols=5)
    t7_2.rows[0].cells[0].text = "Step"
    t7_2.rows[0].cells[1].text = "Actor"
    t7_2.rows[0].cells[2].text = "Action"
    t7_2.rows[0].cells[3].text = "System behaviour"
    t7_2.rows[0].cells[4].text = "Next step"
    for step in cs.get("to_be_flow", []):
        row = t7_2.add_row()
        row.cells[0].text = str(step.get("step", ""))
        row.cells[1].text = step.get("actor", "")
        row.cells[2].text = step.get("action", "")
        row.cells[3].text = step.get("system_behaviour", "")
        row.cells[4].text = str(step.get("next_step", ""))
    style_table(t7_2, [0.6, 1.0, 2.2, 2.2, 0.8])

    add_heading2("7.3 Gap analysis")
    t7_3 = doc.add_table(rows=1, cols=4)
    t7_3.rows[0].cells[0].text = "Area"
    t7_3.rows[0].cells[1].text = "Current"
    t7_3.rows[0].cells[2].text = "Future"
    t7_3.rows[0].cells[3].text = "Gap to close"
    for gap in cs.get("gap_analysis", []):
        row = t7_3.add_row()
        row.cells[0].text = gap.get("area", "")
        row.cells[1].text = gap.get("current", "")
        row.cells[2].text = gap.get("future", "")
        row.cells[3].text = gap.get("gap", "")
    style_table(t7_3, [1.2, 1.8, 1.8, 1.7])

    # --- SECTION 8: BUSINESS REQUIREMENTS ---
    add_heading1("8. Business requirements")
    t8 = doc.add_table(rows=1, cols=5)
    t8.rows[0].cells[0].text = "ID"
    t8.rows[0].cells[1].text = "Business requirement"
    t8.rows[0].cells[2].text = "Priority"
    t8.rows[0].cells[3].text = "Objective"
    t8.rows[0].cells[4].text = "Owner"
    for br in brd.get("section_8_business_requirements", []):
        row = t8.add_row()
        row.cells[0].text = br.get("id", "BR-01")
        row.cells[1].text = br.get("requirement", "")
        row.cells[2].text = br.get("priority", "Must")
        row.cells[3].text = br.get("objective", "OBJ-01")
        row.cells[4].text = br.get("owner", "Akshay")
    style_table(t8, [0.8, 3.2, 0.9, 0.9, 1.0])

    # --- SECTION 9: FUNCTIONAL REQUIREMENTS ---
    add_heading1("9. Functional requirements")
    fr_data = brd.get("section_9_functional_requirements", {})
    add_heading2("9.1 Functional requirements list")
    t9_1 = doc.add_table(rows=1, cols=5)
    t9_1.rows[0].cells[0].text = "ID"
    t9_1.rows[0].cells[1].text = "Requirement (\"The system shall...\")"
    t9_1.rows[0].cells[2].text = "Priority"
    t9_1.rows[0].cells[3].text = "Traces to"
    t9_1.rows[0].cells[4].text = "User story"
    for fr in fr_data.get("list", []):
        row = t9_1.add_row()
        row.cells[0].text = fr.get("id", "FR-01")
        row.cells[1].text = fr.get("requirement", "")
        row.cells[2].text = fr.get("priority", "Must")
        row.cells[3].text = fr.get("traces_to", "BR-01")
        row.cells[4].text = fr.get("user_story", "US-01")
    style_table(t9_1, [0.8, 3.2, 0.9, 0.9, 0.9])

    add_heading2("9.2 User stories and acceptance criteria")
    for us in fr_data.get("user_stories", []):
        add_body(f"User Story: {us.get('id', 'US-01')} - {us.get('title', '')}", italic=False)
        t_us = doc.add_table(rows=1, cols=2)
        t_us.rows[0].cells[0].text = "Field"
        t_us.rows[0].cells[1].text = "Details"
        for k, v in [
            ("User story", us.get("story", "")),
            ("Linked FR", us.get("linked_fr", "")),
            ("Priority / estimate", us.get("priority", "Must")),
            ("Acceptance criteria", "\n".join(us.get("acceptance_criteria", []))),
            ("Out of scope for this story", us.get("out_of_scope", "None"))
        ]:
            row = t_us.add_row()
            row.cells[0].text = k
            row.cells[1].text = str(v)
        style_table(t_us, [1.8, 4.7], is_kv_table=True)
        doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # --- SECTION 10: BUSINESS RULES & VALIDATIONS ---
    add_heading1("10. Business rules and validations")
    t10 = doc.add_table(rows=1, cols=6)
    t10.rows[0].cells[0].text = "Rule ID"
    t10.rows[0].cells[1].text = "Rule"
    t10.rows[0].cells[2].text = "Condition"
    t10.rows[0].cells[3].text = "Outcome"
    t10.rows[0].cells[4].text = "Configurable?"
    t10.rows[0].cells[5].text = "Error code"
    for rule in brd.get("section_10_business_rules", []):
        row = t10.add_row()
        row.cells[0].text = rule.get("id", "BRL-01")
        row.cells[1].text = rule.get("rule", "")
        row.cells[2].text = rule.get("condition", "")
        row.cells[3].text = rule.get("outcome", "")
        row.cells[4].text = rule.get("configurable", "Yes")
        row.cells[5].text = rule.get("error_code", "E-100")
    style_table(t10, [0.8, 1.2, 1.5, 1.5, 1.0, 0.8])

    # --- SECTION 11: DATA REQUIREMENTS ---
    add_heading1("11. Data requirements")
    dt = brd.get("section_11_data_requirements", {})
    add_heading2("11.1 Key entities")
    t11_1 = doc.add_table(rows=1, cols=3)
    t11_1.rows[0].cells[0].text = "Entity"
    t11_1.rows[0].cells[1].text = "Description"
    t11_1.rows[0].cells[2].text = "Key relationships"
    for ent in dt.get("entities", []):
        row = t11_1.add_row()
        row.cells[0].text = ent.get("entity", "")
        row.cells[1].text = ent.get("description", "")
        row.cells[2].text = ent.get("relationships", "")
    style_table(t11_1, [1.5, 2.5, 2.5])

    add_heading2("11.2 Data dictionary")
    t11_2 = doc.add_table(rows=1, cols=7)
    t11_2.rows[0].cells[0].text = "Field"
    t11_2.rows[0].cells[1].text = "Entity"
    t11_2.rows[0].cells[2].text = "Type"
    t11_2.rows[0].cells[3].text = "Format"
    t11_2.rows[0].cells[4].text = "Req?"
    t11_2.rows[0].cells[5].text = "Validation"
    t11_2.rows[0].cells[6].text = "Example"
    for field in dt.get("data_dictionary", []):
        row = t11_2.add_row()
        row.cells[0].text = field.get("field", "")
        row.cells[1].text = field.get("entity", "")
        row.cells[2].text = field.get("type", "String")
        row.cells[3].text = field.get("format", "")
        row.cells[4].text = field.get("required", "Yes")
        row.cells[5].text = field.get("validation", "")
        row.cells[6].text = field.get("example", "")
    style_table(t11_2, [1.0, 0.9, 0.8, 0.9, 0.6, 1.4, 1.0])

    add_heading2("11.3 Data retention, migration and privacy")
    ret = dt.get("retention_privacy", {})
    add_body(f"• Retention: {ret.get('retention', 'Retained per policy')}")
    add_body(f"• Sensitive fields: {ret.get('sensitive_fields', 'Encrypted at rest & masked')}")
    add_body(f"• Data migration: {ret.get('data_migration', 'Direct ingestion')}")

    # --- SECTION 12: UI REQUIREMENTS ---
    add_heading1("12. User interface requirements")
    ui = brd.get("section_12_ui_requirements", {})
    t12 = doc.add_table(rows=1, cols=6)
    t12.rows[0].cells[0].text = "Screen ID"
    t12.rows[0].cells[1].text = "Screen name"
    t12.rows[0].cells[2].text = "Role"
    t12.rows[0].cells[3].text = "Key fields / components"
    t12.rows[0].cells[4].text = "Actions"
    t12.rows[0].cells[5].text = "Wireframe"
    for scr in ui.get("screens", []):
        row = t12.add_row()
        row.cells[0].text = scr.get("id", "SCR-01")
        row.cells[1].text = scr.get("name", "")
        row.cells[2].text = scr.get("role", "")
        row.cells[3].text = scr.get("key_fields", "")
        row.cells[4].text = scr.get("actions", "")
        row.cells[5].text = scr.get("wireframe", "Figma link")
    style_table(t12, [0.8, 1.2, 1.0, 1.6, 1.2, 0.8])
    add_body(f"Screen states: {ui.get('states', 'Loading, empty, error, offline')}")
    add_body(f"Responsive breakpoints: {ui.get('breakpoints', '360px, 768px, 1280px')}")

    # --- SECTION 13: INTEGRATION & API REQUIREMENTS ---
    add_heading1("13. Integration and API requirements")
    integ = brd.get("section_13_integration_api", {})
    t13 = doc.add_table(rows=1, cols=7)
    t13.rows[0].cells[0].text = "ID"
    t13.rows[0].cells[1].text = "System"
    t13.rows[0].cells[2].text = "Direction"
    t13.rows[0].cells[3].text = "Protocol"
    t13.rows[0].cells[4].text = "Trigger"
    t13.rows[0].cells[5].text = "Auth"
    t13.rows[0].cells[6].text = "Timeout/retry"
    for int_item in integ.get("integrations", []):
        row = t13.add_row()
        row.cells[0].text = int_item.get("id", "INT-01")
        row.cells[1].text = int_item.get("system", "")
        row.cells[2].text = int_item.get("direction", "Outbound")
        row.cells[3].text = int_item.get("protocol", "REST")
        row.cells[4].text = int_item.get("trigger", "")
        row.cells[5].text = int_item.get("auth", "API Key")
        row.cells[6].text = int_item.get("timeout_retry", "30s / 2 retries")
    style_table(t13, [0.8, 1.2, 0.9, 0.8, 1.0, 1.0, 1.0])

    if integ.get("sample_contract"):
        add_heading2("Sample Request / Response")
        add_body(integ.get("sample_contract", ""), italic=True)
    if integ.get("failure_handling"):
        add_body(f"Failure handling: {integ.get('failure_handling')}")

    # --- SECTION 14: NOTIFICATIONS ---
    add_heading1("14. Notifications")
    t14 = doc.add_table(rows=1, cols=6)
    t14.rows[0].cells[0].text = "ID"
    t14.rows[0].cells[1].text = "Trigger event"
    t14.rows[0].cells[2].text = "Channel"
    t14.rows[0].cells[3].text = "Recipient"
    t14.rows[0].cells[4].text = "Content summary"
    t14.rows[0].cells[5].text = "Template ref"
    for ntf in brd.get("section_14_notifications", []):
        row = t14.add_row()
        row.cells[0].text = ntf.get("id", "NTF-01")
        row.cells[1].text = ntf.get("trigger", "")
        row.cells[2].text = ntf.get("channel", "SMS")
        row.cells[3].text = ntf.get("recipient", "Applicant")
        row.cells[4].text = ntf.get("summary", "")
        row.cells[5].text = ntf.get("template", "TPL-01")
    style_table(t14, [0.8, 1.4, 0.8, 1.0, 1.8, 0.8])

    # --- SECTION 15: REPORTING & ANALYTICS ---
    add_heading1("15. Reporting and analytics")
    t15 = doc.add_table(rows=1, cols=5)
    t15.rows[0].cells[0].text = "Report / event"
    t15.rows[0].cells[1].text = "Audience"
    t15.rows[0].cells[2].text = "Content / metrics"
    t15.rows[0].cells[3].text = "Frequency"
    t15.rows[0].cells[4].text = "Format"
    for rep in brd.get("section_15_reporting", []):
        row = t15.add_row()
        row.cells[0].text = rep.get("report", "")
        row.cells[1].text = rep.get("audience", "")
        row.cells[2].text = rep.get("metrics", "")
        row.cells[3].text = rep.get("frequency", "Daily")
        row.cells[4].text = rep.get("format", "Dashboard")
    style_table(t15, [1.5, 1.2, 2.2, 0.8, 0.9])

    # --- SECTION 16: NON-FUNCTIONAL REQUIREMENTS ---
    add_heading1("16. Non-functional requirements")
    t16 = doc.add_table(rows=1, cols=4)
    t16.rows[0].cells[0].text = "ID"
    t16.rows[0].cells[1].text = "Category"
    t16.rows[0].cells[2].text = "Requirement"
    t16.rows[0].cells[3].text = "Measure / target"
    for nfr in brd.get("section_16_non_functional", []):
        row = t16.add_row()
        row.cells[0].text = nfr.get("id", "NFR-01")
        row.cells[1].text = nfr.get("category", "")
        row.cells[2].text = nfr.get("requirement", "")
        row.cells[3].text = nfr.get("target", "")
    style_table(t16, [0.8, 1.6, 2.8, 1.4])

    # --- SECTION 17: ERROR HANDLING & EDGE CASES ---
    add_heading1("17. Error handling and edge cases")
    err_data = brd.get("section_17_error_handling", {})
    t17 = doc.add_table(rows=1, cols=4)
    t17.rows[0].cells[0].text = "Error code"
    t17.rows[0].cells[1].text = "Scenario"
    t17.rows[0].cells[2].text = "User-facing message"
    t17.rows[0].cells[3].text = "System behaviour"
    for err in err_data.get("errors", []):
        row = t17.add_row()
        row.cells[0].text = err.get("code", "E-100")
        row.cells[1].text = err.get("scenario", "")
        row.cells[2].text = err.get("message", "")
        row.cells[3].text = err.get("behaviour", "")
    style_table(t17, [1.0, 1.6, 2.2, 1.8])

    add_heading2("Edge cases to handle")
    for ec in err_data.get("edge_cases", []):
        add_body(f"• {ec}")

    # --- SECTION 18: SECURITY & COMPLIANCE ---
    add_heading1("18. Security and compliance requirements")
    sec = brd.get("section_18_security_compliance", {})
    add_body(f"• Authentication: {sec.get('auth', 'OAuth 2.0 / API Token')}")
    add_body(f"• Session: {sec.get('session', '15 min inactivity timeout')}")
    add_body(f"• Data masking: {sec.get('data_masking', 'Zero-exposure cryptographic masking')}")
    add_body(f"• Consent: {sec.get('consent', 'Explicit consent with timestamp')}")
    add_body(f"• Security testing: {sec.get('security_testing', 'VAPT verification prior to go-live')}")

    # --- SECTION 19: ASSUMPTIONS, CONSTRAINTS & DEPENDENCIES ---
    add_heading1("19. Assumptions, constraints and dependencies")
    acd = brd.get("section_19_assumptions_constraints", {})
    add_heading2("Assumptions")
    for asmp in acd.get("assumptions", []):
        add_body(f"• {asmp}")

    add_heading2("Constraints")
    t19_c = doc.add_table(rows=1, cols=2)
    t19_c.rows[0].cells[0].text = "Type"
    t19_c.rows[0].cells[1].text = "Constraint"
    for c in acd.get("constraints", []):
        row = t19_c.add_row()
        row.cells[0].text = c.get("type", "General")
        row.cells[1].text = c.get("constraint", "")
    style_table(t19_c, [2.0, 4.5], is_kv_table=True)

    add_heading2("Dependencies")
    t19_d = doc.add_table(rows=1, cols=4)
    t19_d.rows[0].cells[0].text = "ID"
    t19_d.rows[0].cells[1].text = "Dependency"
    t19_d.rows[0].cells[2].text = "Owner"
    t19_d.rows[0].cells[3].text = "Needed by"
    for d in acd.get("dependencies", []):
        row = t19_d.add_row()
        row.cells[0].text = d.get("id", "DEP-01")
        row.cells[1].text = d.get("dependency", "")
        row.cells[2].text = d.get("owner", "")
        row.cells[3].text = d.get("needed_by", "")
    style_table(t19_d, [0.8, 3.2, 1.4, 1.2])

    # --- SECTION 20: RISKS ---
    add_heading1("20. Risks")
    t20 = doc.add_table(rows=1, cols=6)
    t20.rows[0].cells[0].text = "ID"
    t20.rows[0].cells[1].text = "Risk"
    t20.rows[0].cells[2].text = "Likelihood"
    t20.rows[0].cells[3].text = "Impact"
    t20.rows[0].cells[4].text = "Mitigation"
    t20.rows[0].cells[5].text = "Owner"
    for r in brd.get("section_20_risks", []):
        row = t20.add_row()
        row.cells[0].text = r.get("id", "R-01")
        row.cells[1].text = r.get("risk", "")
        row.cells[2].text = r.get("likelihood", "M")
        row.cells[3].text = r.get("impact", "H")
        row.cells[4].text = r.get("mitigation", "")
        row.cells[5].text = r.get("owner", "Akshay")
    style_table(t20, [0.7, 2.2, 0.9, 0.7, 2.0, 0.9])

    # --- SECTION 21: TEST SCENARIOS & UAT ---
    add_heading1("21. Test scenarios and UAT")
    uat = brd.get("section_21_testing_uat", {})
    t21 = doc.add_table(rows=1, cols=5)
    t21.rows[0].cells[0].text = "Test ID"
    t21.rows[0].cells[1].text = "Scenario"
    t21.rows[0].cells[2].text = "Steps (summary)"
    t21.rows[0].cells[3].text = "Expected result"
    t21.rows[0].cells[4].text = "Traces to"
    for tc in uat.get("tests", []):
        row = t21.add_row()
        row.cells[0].text = tc.get("id", "TC-01")
        row.cells[1].text = tc.get("scenario", "")
        row.cells[2].text = tc.get("steps", "")
        row.cells[3].text = tc.get("expected", "")
        row.cells[4].text = tc.get("traces_to", "US-01")
    style_table(t21, [0.8, 1.6, 1.8, 1.6, 0.8])
    add_body(f"• UAT Entry Criteria: {uat.get('entry_criteria', 'All Must-have functional requirements passed internal QA')}")
    add_body(f"• UAT Exit Criteria: {uat.get('exit_criteria', '0 critical defects, test suite 100% executed, sign-off obtained')}")

    # --- SECTION 22: REQUIREMENTS TRACEABILITY MATRIX ---
    add_heading1("22. Requirements traceability matrix")
    t22 = doc.add_table(rows=1, cols=7)
    t22.rows[0].cells[0].text = "Objective"
    t22.rows[0].cells[1].text = "Business req."
    t22.rows[0].cells[2].text = "Functional req."
    t22.rows[0].cells[3].text = "User story"
    t22.rows[0].cells[4].text = "Business rule"
    t22.rows[0].cells[5].text = "Test case"
    t22.rows[0].cells[6].text = "Status"
    for rtm in brd.get("section_22_traceability", []):
        row = t22.add_row()
        row.cells[0].text = rtm.get("obj", "OBJ-01")
        row.cells[1].text = rtm.get("br", "BR-01")
        row.cells[2].text = rtm.get("fr", "FR-01")
        row.cells[3].text = rtm.get("us", "US-01")
        row.cells[4].text = rtm.get("rule", "—")
        row.cells[5].text = rtm.get("test", "TC-01")
        row.cells[6].text = rtm.get("status", "Passed")
    style_table(t22, [0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 1.1])

    # --- SECTION 23: RELEASE PLAN & MILESTONES ---
    add_heading1("23. Release plan and milestones")
    t23 = doc.add_table(rows=1, cols=3)
    t23.rows[0].cells[0].text = "Milestone"
    t23.rows[0].cells[1].text = "Target date"
    t23.rows[0].cells[2].text = "Exit criteria"
    for rel in brd.get("section_23_release_plan", []):
        row = t23.add_row()
        row.cells[0].text = rel.get("milestone", "")
        row.cells[1].text = rel.get("target_date", "")
        row.cells[2].text = rel.get("exit_criteria", "")
    style_table(t23, [2.2, 1.5, 2.8])

    # --- SECTION 24: OPEN QUESTIONS & DECISIONS LOG ---
    add_heading1("24. Open questions and decisions log")
    t24 = doc.add_table(rows=1, cols=6)
    t24.rows[0].cells[0].text = "ID"
    t24.rows[0].cells[1].text = "Question / decision"
    t24.rows[0].cells[2].text = "Raised by"
    t24.rows[0].cells[3].text = "Owner"
    t24.rows[0].cells[4].text = "Due"
    t24.rows[0].cells[5].text = "Status / answer"
    for q in brd.get("section_24_open_questions", []):
        row = t24.add_row()
        row.cells[0].text = q.get("id", "Q-01")
        row.cells[1].text = q.get("question", "")
        row.cells[2].text = q.get("raised_by", "")
        row.cells[3].text = q.get("owner", "")
        row.cells[4].text = q.get("due", "")
        row.cells[5].text = q.get("status", "Open")
    style_table(t24, [0.7, 2.4, 0.9, 0.9, 0.8, 1.1])

    # --- SECTION 25: GLOSSARY ---
    add_heading1("25. Glossary")
    t25 = doc.add_table(rows=1, cols=2)
    t25.rows[0].cells[0].text = "Term"
    t25.rows[0].cells[1].text = "Definition"
    for g in brd.get("section_25_glossary", []):
        row = t25.add_row()
        row.cells[0].text = g.get("term", "")
        row.cells[1].text = g.get("definition", "")
    style_table(t25, [1.8, 4.7], is_kv_table=True)

    # --- SECTION 26: APPENDICES ---
    add_heading1("26. Appendices")
    for appx in brd.get("section_26_appendices", []):
        add_body(f"• {appx}")

    # --- SECTION 27: SIGN-OFF ---
    add_heading1("27. Sign-off")
    add_body("By signing, approvers confirm this document accurately captures the requirements and is approved as the baseline for development. Changes after sign-off follow the change request process.", italic=True)
    t27 = doc.add_table(rows=1, cols=4)
    t27.rows[0].cells[0].text = "Name"
    t27.rows[0].cells[1].text = "Role"
    t27.rows[0].cells[2].text = "Signature"
    t27.rows[0].cells[3].text = "Date"
    for s in brd.get("section_27_signoff", []):
        row = t27.add_row()
        row.cells[0].text = s.get("name", "")
        row.cells[1].text = s.get("role", "")
        row.cells[2].text = s.get("signature", "Verified Internal Sign-off")
        row.cells[3].text = s.get("date", datetime.date.today().strftime("%d-%m-%Y"))
    style_table(t27, [1.8, 2.0, 1.7, 1.2])

    # Save to memory buffer
    file_stream = io.BytesIO()
    doc.save(file_stream)
    file_stream.seek(0)
    return file_stream


def generate_excel_tracker(project_data: dict, items: list) -> io.BytesIO:
    """
    Generate the Excel-based Pre-Req Tracker.

    Columns:
        Category
        Title
        Description
        Requirement Timeline

    Timeline values are normalized using normalize_excel_timeline().
    
    """

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Pre-Req Tracker"

    # Excel colors.
    HEADER_FILL = PatternFill(
        start_color="C55A11",
        end_color="C55A11",
        fill_type="solid",
    )

    PEACH_FILL = PatternFill(
        start_color="FBE5D6",
        end_color="FBE5D6",
        fill_type="solid",
    )

    # Fonts.
    WHITE_BOLD_FONT = Font(
        name="Calibri",
        size=11,
        bold=True,
        color="FFFFFF",
    )

    BLACK_BOLD_FONT = Font(
        name="Calibri",
        size=10,
        bold=True,
        color="000000",
    )

    BLACK_BODY_FONT = Font(
        name="Calibri",
        size=10,
        color="000000",
    )

    # Borders.
    BLACK_THIN_SIDE = Side(
        style="thin",
        color="000000",
    )

    GRID_BORDER = Border(
        left=BLACK_THIN_SIDE,
        right=BLACK_THIN_SIDE,
        top=BLACK_THIN_SIDE,
        bottom=BLACK_THIN_SIDE,
    )

    # ---------------------------------------------------------
    # 1. Column headers
    # ---------------------------------------------------------

    headers = [
        ("Category", 32),
        ("Title", 36),
        ("Description", 65),
        ("Requirement Timeline", 26),
    ]

    for col_idx, (header_name, col_width) in enumerate(headers, start=1):
        cell = ws.cell(
            row=1,
            column=col_idx,
            value=header_name,
        )

        cell.font = WHITE_BOLD_FONT
        cell.fill = HEADER_FILL
        cell.alignment = Alignment(
            horizontal="left",
            vertical="center",
            wrap_text=True,
        )
        cell.border = GRID_BORDER

        column_letter = get_column_letter(col_idx)
        ws.column_dimensions[column_letter].width = col_width

    ws.row_dimensions[1].height = 26

    # ---------------------------------------------------------
    # 2. Group items by category while preserving input order
    # ---------------------------------------------------------

    categorized_items = {}

    for item in items:
        category = item.get("category") or "General"

        if category not in categorized_items:
            categorized_items[category] = []

        categorized_items[category].append(item)

    # ---------------------------------------------------------
    # 3. Populate Excel rows
    # ---------------------------------------------------------

    current_row = 2

    for category_name, category_items in categorized_items.items():
        start_category_row = current_row

        for item in category_items:
            # Title.
            title = (
                item.get("name")
                or item.get("title")
                or ""
            )

            # Description.
            description = (
                item.get("description")
                or item.get("expected_evidence")
                or item.get("details")
                or ""
            )

            if not isinstance(description, str):
                description = str(description)

            description = description.strip()

            # Normalize the timeline.
            # requirement_timeline takes priority over due_date.
            timeline_str = normalize_excel_timeline(item)

            # -------------------------------------------------
            # Column A: Category
            # -------------------------------------------------

            category_cell = ws.cell(
                row=current_row,
                column=1,
                value=category_name,
            )

            category_cell.font = BLACK_BOLD_FONT
            category_cell.fill = PEACH_FILL
            category_cell.alignment = Alignment(
                horizontal="center",
                vertical="center",
                wrap_text=True,
            )
            category_cell.border = GRID_BORDER

            # -------------------------------------------------
            # Column B: Title
            # -------------------------------------------------

            title_cell = ws.cell(
                row=current_row,
                column=2,
                value=title,
            )

            title_cell.font = BLACK_BOLD_FONT
            title_cell.fill = PEACH_FILL
            title_cell.alignment = Alignment(
                horizontal="left",
                vertical="center",
                wrap_text=True,
            )
            title_cell.border = GRID_BORDER

            # -------------------------------------------------
            # Column C: Description
            # -------------------------------------------------

            description_cell = ws.cell(
                row=current_row,
                column=3,
                value=description,
            )

            description_cell.font = BLACK_BODY_FONT
            description_cell.fill = PEACH_FILL
            description_cell.alignment = Alignment(
                horizontal="left",
                vertical="center",
                wrap_text=True,
            )
            description_cell.border = GRID_BORDER

            # -------------------------------------------------
            # Column D: Requirement Timeline
            # -------------------------------------------------

            timeline_cell = ws.cell(
                row=current_row,
                column=4,
                value=timeline_str,
            )

            timeline_cell.font = BLACK_BODY_FONT
            timeline_cell.fill = PEACH_FILL
            timeline_cell.alignment = Alignment(
                horizontal="left",
                vertical="center",
                wrap_text=True,
            )
            timeline_cell.border = GRID_BORDER

            ws.row_dimensions[current_row].height = 32

            current_row += 1

        # -----------------------------------------------------
        # 4. Merge category cells when a category has multiple
        #    prerequisite rows
        # -----------------------------------------------------

        end_category_row = current_row - 1

        if end_category_row > start_category_row:
            ws.merge_cells(
                start_row=start_category_row,
                start_column=1,
                end_row=end_category_row,
                end_column=1,
            )

            # Ensure consistent formatting for merged cells.
            for row_index in range(
                start_category_row,
                end_category_row + 1,
            ):
                cell = ws.cell(
                    row=row_index,
                    column=1,
                )

                cell.border = GRID_BORDER
                cell.fill = PEACH_FILL

    # ---------------------------------------------------------
    # 5. Save the workbook to an in-memory stream
    # ---------------------------------------------------------

    stream = io.BytesIO()

    wb.save(stream)
    stream.seek(0)

    return stream

def generate_brd_html(brd: dict) -> str:
    """Generates a complete, beautiful 1:1 PDF document replica HTML preview string.
    All content is driven dynamically from the brd dict — no project-specific hardcodes.
    """
    brd = normalize_brd_roles(brd)
    logo_base64 = ""
    logo_path = os.path.join(os.path.dirname(__file__), "goml_logo.png")
    ensure_goml_logo(logo_path)
    if os.path.exists(logo_path):
        import base64
        with open(logo_path, "rb") as f:
            logo_base64 = base64.b64encode(f.read()).decode("utf-8")

    logo_img = (
        f'<img src="data:image/png;base64,{logo_base64}" style="height: 34px; object-fit: contain;" alt="goML Logo" />'
        if logo_base64
        else '<span style="font-weight: 800; font-size: 18px; color: #ED7D31;">goML</span>'
    )

    # ---- Dynamic section extraction (correct schema keys) ----
    doc_ctrl = brd.get("section_1_doc_control", {}) or {}
    exec_summary = brd.get(
        "section_2_executive_summary",
        "This project delivers an enterprise-grade solution with automated workflows, "
        "secure integrations, and Day-1 verified architecture to enable seamless kick-off.",
    )
    bg = brd.get("section_3_background", {}) or {}
    objectives = brd.get("section_4_objectives", []) or []
    scope = brd.get("section_5_scope", {}) or {}
    stakeholders = brd.get("section_6_stakeholders", {}) or {}
    current_future = brd.get("section_7_current_future_state", {}) or {}
    biz_reqs = brd.get("section_8_business_requirements", []) or []
    func_reqs = brd.get("section_9_functional_requirements", {}) or {}
    biz_rules = brd.get("section_10_business_rules", []) or []
    data_reqs = brd.get("section_11_data_requirements", {}) or {}
    ui_reqs = brd.get("section_12_ui_requirements", {}) or {}
    integ = brd.get("section_13_integration_api", {}) or {}
    notifications = brd.get("section_14_notifications", []) or []
    reporting = brd.get("section_15_reporting", []) or []
    nfr_list = brd.get("section_16_non_functional", []) or []
    err_data = brd.get("section_17_error_handling", {}) or {}
    security = brd.get("section_18_security_compliance", {}) or {}
    assumptions = brd.get("section_19_assumptions_constraints", {}) or {}
    risks = brd.get("section_20_risks", []) or []
    uat = brd.get("section_21_testing_uat", {}) or {}
    traceability = brd.get("section_22_traceability", []) or []
    milestones = brd.get("section_23_release_plan", []) or []
    questions = brd.get("section_24_open_questions", []) or []
    glossary = brd.get("section_25_glossary", []) or []
    appendices = brd.get("section_26_appendices", []) or []
    signoff = brd.get("section_27_signoff", []) or []

    proj_name = brd.get("project_name") or doc_ctrl.get("project_name") or "Enterprise Initiative"
    version = brd.get("version") or doc_ctrl.get("version") or "1.0"
    date_str = brd.get("date") or doc_ctrl.get("last_updated") or datetime.date.today().strftime("%d-%m-%Y")
    status = brd.get("status") or doc_ctrl.get("status") or "In review"
    prepared_by = brd.get("prepared_by") or "Akshay (Team Lead) & Thasleema (Project Manager)"

    def esc(val):
        if val is None:
            return ""
        return (
            str(val)
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
        )

    # Document control fields
    dc_fields = [
        ("Project name", doc_ctrl.get("project_name", proj_name)),
        ("Project / ticket ID", doc_ctrl.get("ticket_id", "PRJ-2026-XXX")),
        ("Document owner", doc_ctrl.get("owner", "Akshay (Team Lead)")),
        ("Business sponsor", doc_ctrl.get("business_sponsor", "Client Executive Sponsor")),
        ("Project manager", doc_ctrl.get("project_manager", doc_ctrl.get("tech_lead", "Thasleema (Project Manager)"))),
        ("Version", doc_ctrl.get("version", version)),
        ("Status", doc_ctrl.get("status", status)),
        ("Last updated", doc_ctrl.get("last_updated", date_str)),
        ("Related documents", doc_ctrl.get("related_docs", "Statement of Work, Architecture Specification, Pre-Req Tracker")),
    ]
    dc_rows = "".join(
        f'<tr><td class="kv-label">{esc(k)}</td><td class="kv-value">{esc(v)}</td></tr>'
        for k, v in dc_fields
    )

    rev_hist = doc_ctrl.get("revision_history") or [
        {"version": "0.1", "date": date_str, "author": "Akshay (Team Lead)", "summary": "Initial proposal extraction"},
        {"version": "1.0", "date": date_str, "author": "Thasleema (Project Manager)", "summary": "Structured BRD baseline"},
    ]
    rev_rows = "".join(
        f"<tr><td>{esc(r.get('version',''))}</td><td>{esc(r.get('date',''))}</td>"
        f"<td>{esc(r.get('author',''))}</td><td>{esc(r.get('summary',''))}</td></tr>"
        for r in rev_hist
    )

    reviewers = doc_ctrl.get("reviewers") or [
        {"name": "Client Sponsor", "role": "Business Sponsor", "responsibility": "Approver", "approval_date": "Pending"},
        {"name": "Akshay", "role": "Team Lead", "responsibility": "Approver", "approval_date": date_str},
        {"name": "Thasleema", "role": "Project Manager", "responsibility": "Reviewer", "approval_date": date_str},
        {"name": "QA Lead", "role": "QA Lead", "responsibility": "Reviewer", "approval_date": "Pending"},
    ]
    reviewer_rows = "".join(
        f"<tr><td>{esc(r.get('name',''))}</td><td>{esc(r.get('role',''))}</td>"
        f"<td>{esc(r.get('responsibility',''))}</td><td>{esc(r.get('approval_date','Pending'))}</td></tr>"
        for r in reviewers
    )

    if not objectives:
        objectives = [
            {"id": "OBJ-01", "objective": "Achieve 100% Day-1 prerequisite clearance", "kpi": "% Gatekeepers Verified",
             "baseline": "0%", "target": "100%", "measured_by": "PreQ Dashboard", "date": date_str},
            {"id": "OBJ-02", "objective": "Automate core integration workflows", "kpi": "Transaction latency",
             "baseline": "Manual", "target": "< 500ms", "measured_by": "Telemetry", "date": date_str},
        ]
    obj_rows = "".join(
        f"<tr><td><strong>{esc(o.get('id','OBJ-01'))}</strong></td>"
        f"<td>{esc(o.get('objective', o.get('description','')))}</td>"
        f"<td>{esc(o.get('kpi',''))}</td><td>{esc(o.get('baseline',''))}</td>"
        f"<td><strong>{esc(o.get('target',''))}</strong></td>"
        f"<td>{esc(o.get('measured_by',''))}</td><td>{esc(o.get('date', date_str))}</td></tr>"
        for o in objectives
    )

    in_scope = scope.get("in_scope") or ["Core architecture implementation", "API and database integration", "Security compliance and key masking"]
    out_scope = scope.get("out_of_scope") or ["Unrelated legacy system deprecation", "Production hardware provisioning outside cloud tenant"]
    in_scope_li = "".join(f"<li>{esc(i)}</li>" for i in in_scope)
    out_scope_li = "".join(f"<li>{esc(i)}</li>" for i in out_scope)

    raci = stakeholders.get("raci") or [
        {"name": "Client Executive Sponsor", "role": "Business Sponsor", "interest": "Budget & Outcome", "raci": "A"},
        {"name": "Akshay", "role": "Team Lead", "interest": "Requirements & Scope", "raci": "R"},
        {"name": "Thasleema", "role": "Project Manager", "interest": "Solution Delivery & Schedule", "raci": "R"},
        {"name": "Client Security Lead", "role": "Compliance", "interest": "Security Sign-off", "raci": "C"},
    ]
    raci_rows = "".join(
        f"<tr><td>{esc(r.get('name',''))}</td><td>{esc(r.get('role',''))}</td>"
        f"<td>{esc(r.get('interest',''))}</td>"
        f'<td><span class="badge-raci">{esc(r.get("raci","R"))}</span></td></tr>'
        for r in raci
    )

    user_roles = stakeholders.get("user_roles") or [
        {"role": "Integration Engineer", "description": "Oversees system connectors and validates environment prerequisites",
         "access": "Admin Console, SSO", "approx_users": "10"},
        {"role": "Technical Reviewer", "description": "Inspects prerequisite evidence artifacts and grants verification",
         "access": "Reviewer Console", "approx_users": "5"},
        {"role": "Operational End User", "description": "Executes daily business operations and monitors telemetry",
         "access": "Web Dashboard", "approx_users": "100"},
    ]
    user_role_rows = "".join(
        f"<tr><td>{esc(r.get('role',''))}</td><td>{esc(r.get('description',''))}</td>"
        f"<td>{esc(r.get('access',''))}</td><td>{esc(r.get('approx_users','—'))}</td></tr>"
        for r in user_roles
    )

    as_is = current_future.get("as_is_steps") or [
        "1. Stakeholders exchange credentials and requirements over unstructured email/chat threads.",
        "2. Engineers discover missing access permissions during active sprint cycles.",
        "3. Sprints stall pending third-party API quotas and database whitelisting.",
    ]
    as_is_li = "".join(f'<li style="margin-bottom: 4px;">{esc(s)}</li>' for s in as_is)
    pain = current_future.get("pain_points") or ["No single source of truth", "Missing security masking", "Unpredictable kick-off delays"]
    pain_str = ", ".join(str(p) for p in pain)

    to_be = current_future.get("to_be_flow") or [
        {"step": "1", "actor": "Client Lead", "action": "Uploads proposal / SOW", "system_behaviour": "AI extracts 27-section BRD and minimal tracker", "next_step": "2"},
        {"step": "2", "actor": "Akshay / Thasleema", "action": "Review tracker internally", "system_behaviour": "Sets review status to Approved", "next_step": "3"},
        {"step": "3", "actor": "Client Sponsor", "action": "Submits proof / credentials", "system_behaviour": "Zero-exposure masking and instant verification", "next_step": "End"},
    ]
    to_be_rows = "".join(
        f"<tr><td>{esc(s.get('step',''))}</td><td>{esc(s.get('actor',''))}</td>"
        f"<td>{esc(s.get('action',''))}</td><td>{esc(s.get('system_behaviour',''))}</td>"
        f"<td>{esc(s.get('next_step',''))}</td></tr>"
        for s in to_be
    )

    gaps = current_future.get("gap_analysis") or [
        {"area": "Process", "current": "Manual email handovers", "future": "Automated PreQ portal", "gap": "Implement centralized tracker"},
        {"area": "Security", "current": "Plaintext secret sharing", "future": "Cryptographic masking", "gap": "Vault & zero-exposure integration"},
    ]
    gap_rows = "".join(
        f"<tr><td>{esc(g.get('area',''))}</td><td>{esc(g.get('current',''))}</td>"
        f"<td>{esc(g.get('future',''))}</td><td>{esc(g.get('gap',''))}</td></tr>"
        for g in gaps
    )

    if not biz_reqs:
        biz_reqs = [
            {"id": "BR-01", "requirement": "All prerequisite access credentials must be verified 48h before kick-off", "priority": "Must", "objective": "OBJ-01", "owner": "Akshay"},
            {"id": "BR-02", "requirement": "System must support real-time status and audit logging", "priority": "Must", "objective": "OBJ-02", "owner": "Thasleema"},
        ]
    br_rows = "".join(
        f"<tr><td><strong>{esc(b.get('id','BR-01'))}</strong></td>"
        f"<td>{esc(b.get('requirement', b.get('title','')))}</td>"
        f"<td>{esc(b.get('priority','Must'))}</td>"
        f"<td>{esc(b.get('objective','OBJ-01'))}</td>"
        f"<td>{esc(b.get('owner','Akshay'))}</td></tr>"
        for b in biz_reqs
    )

    fr_list = func_reqs.get("list") or [
        {"id": "FR-01", "requirement": "The system shall ingest proposal documents (DOCX, PPTX, PDF) and extract structured requirements.", "priority": "Must", "traces_to": "BR-01", "user_story": "US-01"},
        {"id": "FR-02", "requirement": "The system shall enforce internal review by Akshay & Thasleema prior to external client sharing.", "priority": "Must", "traces_to": "BR-01", "user_story": "US-02"},
    ]
    fr_rows = "".join(
        f"<tr><td><strong>{esc(f.get('id','FR-01'))}</strong></td>"
        f"<td>{esc(f.get('requirement',''))}</td>"
        f"<td>{esc(f.get('priority','Must'))}</td>"
        f"<td>{esc(f.get('traces_to','BR-01'))}</td>"
        f"<td>{esc(f.get('user_story','US-01'))}</td></tr>"
        for f in fr_list
    )

    user_stories = func_reqs.get("user_stories") or []
    us_html = ""
    if user_stories:
        for us in user_stories:
            acs = us.get("acceptance_criteria") or []
            ac_str = "<br/>".join(esc(a) for a in acs) if acs else "—"
            us_html += f"""
      <p style="font-size: 13px; font-weight: bold; margin-bottom: 8px;">User Story: {esc(us.get('id','US-01'))} - {esc(us.get('title',''))}</p>
      <table>
        <thead><tr><th style="width: 32%;">Field</th><th>Details</th></tr></thead>
        <tbody>
          <tr><td style="background: #FBE5D6; font-weight: bold;">User story</td><td>{esc(us.get('story',''))}</td></tr>
          <tr><td style="background: #FFFFFF; font-weight: bold;">Linked FR</td><td>{esc(us.get('linked_fr',''))}</td></tr>
          <tr><td style="background: #FBE5D6; font-weight: bold;">Priority / estimate</td><td>{esc(us.get('priority','Must'))}</td></tr>
          <tr><td style="background: #FFFFFF; font-weight: bold;">Acceptance criteria</td><td>{ac_str}</td></tr>
          <tr><td style="background: #FBE5D6; font-weight: bold;">Out of scope for this story</td><td>{esc(us.get('out_of_scope','None'))}</td></tr>
        </tbody>
      </table>
"""
    else:
        us_html = """
      <p style="font-size: 13px; font-weight: bold; margin-bottom: 8px;">User Story: US-01 - Automated Proposal Ingestion</p>
      <table>
        <thead><tr><th style="width: 32%;">Field</th><th>Details</th></tr></thead>
        <tbody>
          <tr><td style="background: #FBE5D6; font-weight: bold;">User story</td><td>As an engineering lead, I want to upload a proposal so that requirements and prerequisites are automatically mapped.</td></tr>
          <tr><td style="background: #FFFFFF; font-weight: bold;">Linked FR</td><td>FR-01</td></tr>
          <tr><td style="background: #FBE5D6; font-weight: bold;">Priority / estimate</td><td>Must / 5 pts</td></tr>
          <tr><td style="background: #FFFFFF; font-weight: bold;">Acceptance criteria</td><td>AC1 - Given a valid DOCX, PPTX or PDF file, when uploaded, then the system extracts text and generates the BRD within 10 seconds.<br/>AC2 - Given unreadable or empty files, when uploaded, then clear validation feedback is returned.</td></tr>
          <tr><td style="background: #FBE5D6; font-weight: bold;">Out of scope for this story</td><td>Manual OCR of physical paper documents</td></tr>
        </tbody>
      </table>
"""

    if not biz_rules:
        biz_rules = [
            {"id": "BRL-01", "rule": "Internal Review Gate", "condition": "Tracker generated from proposal",
             "outcome": "Lock external sharing until Akshay & Thasleema approve", "configurable": "No", "error_code": "E-REV-01"},
            {"id": "BRL-02", "rule": "Zero Plaintext Secrets", "condition": "Secret key or token entered",
             "outcome": "Mask and store securely", "configurable": "No", "error_code": "E-SEC-02"},
        ]
    rule_rows = "".join(
        f"<tr><td><strong>{esc(r.get('id','BRL-01'))}</strong></td>"
        f"<td>{esc(r.get('rule',''))}</td><td>{esc(r.get('condition',''))}</td>"
        f"<td>{esc(r.get('outcome',''))}</td><td>{esc(r.get('configurable','Yes'))}</td>"
        f"<td><code>{esc(r.get('error_code','E-100'))}</code></td></tr>"
        for r in biz_rules
    )

    entities = data_reqs.get("entities") or [
        {"entity": "Project", "description": "Core initiative entity", "relationships": "1 Project -> Many ChecklistItems"},
        {"entity": "ChecklistItem", "description": "Prerequisite milestone", "relationships": "Belongs to 1 Project"},
    ]
    entity_rows = "".join(
        f"<tr><td><strong>{esc(e.get('entity',''))}</strong></td>"
        f"<td>{esc(e.get('description',''))}</td><td>{esc(e.get('relationships',''))}</td></tr>"
        for e in entities
    )

    dd = data_reqs.get("data_dictionary") or [
        {"field": "name", "entity": "ChecklistItem", "type": "String", "format": "Text (1-255 chars)", "required": "Yes", "validation": "Non-empty string", "example": "MySQL Read-Only Credentials"},
        {"field": "status", "entity": "ChecklistItem", "type": "Enum", "format": "Pending | Submitted | Verified", "required": "Yes", "validation": "Valid status enum", "example": "Pending"},
    ]
    dd_rows = "".join(
        f"<tr><td><code>{esc(d.get('field',''))}</code></td><td>{esc(d.get('entity',''))}</td>"
        f"<td>{esc(d.get('type','String'))}</td><td>{esc(d.get('format',''))}</td>"
        f"<td>{esc(d.get('required','Yes'))}</td><td>{esc(d.get('validation',''))}</td>"
        f"<td>{esc(d.get('example',''))}</td></tr>"
        for d in dd
    )
    ret = data_reqs.get("retention_privacy") or {}
    ret_retention = ret.get("retention", "Active project artifacts retained throughout engagement lifecycle; logs retained 7 years.")
    ret_sensitive = ret.get("sensitive_fields", "API keys, database passwords, IAM role credentials (encrypted at rest).")
    ret_migration = ret.get("data_migration", "Direct ingestion from structured proposals.")

    screens = ui_reqs.get("screens") or [
        {"id": "SCR-01", "name": "Proposal Upload & Ingestion", "role": "Lead Architect", "key_fields": "Dropzone, file picker, parse status", "actions": "Upload, Analyze, Generate", "wireframe": "CreateProject.jsx"},
        {"id": "SCR-02", "name": "Minimal Pre-Req Tracker View", "role": "Solutions Team", "key_fields": "Milestone list, internal review badge, export button", "actions": "Review, Approve, Export Excel", "wireframe": "ProjectDashboard.jsx"},
    ]
    screen_rows = "".join(
        f"<tr><td>{esc(s.get('id','SCR-01'))}</td><td>{esc(s.get('name',''))}</td>"
        f"<td>{esc(s.get('role',''))}</td><td>{esc(s.get('key_fields',''))}</td>"
        f"<td>{esc(s.get('actions',''))}</td><td>{esc(s.get('wireframe','TBD'))}</td></tr>"
        for s in screens
    )
    ui_states = ui_reqs.get("states", "Loading, parsed, reviewing, approved, error")
    ui_breakpoints = ui_reqs.get("breakpoints", "360px (mobile), 768px (tablet), 1280px (desktop), 1920px (ultrawide)")

    integ_list = integ.get("integrations") or [
        {"id": "INT-01", "system": "LLM Engine", "direction": "Outbound", "protocol": "REST / JSON", "trigger": "Proposal upload", "auth": "API Key", "timeout_retry": "30s / 2 retries"},
        {"id": "INT-02", "system": "PostgreSQL Database", "direction": "Inbound/Outbound", "protocol": "SQL / TLS", "trigger": "On state change", "auth": "Database connection pool", "timeout_retry": "5s"},
    ]
    integ_rows = "".join(
        f"<tr><td>{esc(i.get('id','INT-01'))}</td><td>{esc(i.get('system',''))}</td>"
        f"<td>{esc(i.get('direction','Outbound'))}</td><td>{esc(i.get('protocol','REST'))}</td>"
        f"<td>{esc(i.get('trigger',''))}</td><td>{esc(i.get('auth','API Key'))}</td>"
        f"<td>{esc(i.get('timeout_retry','30s / 2 retries'))}</td></tr>"
        for i in integ_list
    )

    if not notifications:
        notifications = [
            {"id": "NTF-01", "trigger": "Tracker generated", "channel": "In-app Alert", "recipient": "Akshay & Thasleema", "summary": "New proposal analyzed and ready for internal review", "template": "TPL-REV-01"},
            {"id": "NTF-02", "trigger": "Evidence submitted", "channel": "Dashboard & Webhook", "recipient": "Engineering Team", "summary": "Milestone evidence submitted for review", "template": "TPL-EVI-02"},
        ]
    ntf_rows = "".join(
        f"<tr><td>{esc(n.get('id','NTF-01'))}</td><td>{esc(n.get('trigger',''))}</td>"
        f"<td>{esc(n.get('channel',''))}</td><td>{esc(n.get('recipient',''))}</td>"
        f"<td>{esc(n.get('summary',''))}</td><td>{esc(n.get('template','TPL-01'))}</td></tr>"
        for n in notifications
    )

    if not reporting:
        reporting = [
            {"report": "Pre-Req Executive Readiness Index", "audience": "Leadership & Sponsors", "metrics": "% Cleared, Blockers Remaining", "frequency": "Realtime", "format": "Interactive Dashboard"},
            {"report": "Minimal Pre-Req Tracker Spreadsheet", "audience": "Delivery Team", "metrics": "Milestones, Owners, SLAs, Statuses", "frequency": "On-demand", "format": "Excel (.xlsx)"},
        ]
    rep_rows = "".join(
        f"<tr><td>{esc(r.get('report',''))}</td><td>{esc(r.get('audience',''))}</td>"
        f"<td>{esc(r.get('metrics',''))}</td><td>{esc(r.get('frequency','Daily'))}</td>"
        f"<td>{esc(r.get('format','Dashboard'))}</td></tr>"
        for r in reporting
    )

    if not nfr_list:
        nfr_list = [
            {"id": "NFR-01", "category": "Performance", "requirement": "Proposal parsing and tracker generation within 5s", "target": "< 5.0s"},
            {"id": "NFR-02", "category": "Capacity / Scalability", "requirement": "Support concurrent proposal document parsing", "target": "100 concurrent"},
            {"id": "NFR-03", "category": "Availability", "requirement": "Cloud service uptime", "target": "99.9%"},
            {"id": "NFR-04", "category": "Security", "requirement": "Zero-exposure key masking & TLS 1.3 encryption", "target": "AES-256 / TLS 1.3"},
            {"id": "NFR-05", "category": "Compliance", "requirement": "Proposal confidentiality and access controls", "target": "SOC2 Type II"},
            {"id": "NFR-06", "category": "Accessibility", "requirement": "Accessible web dashboard contrast and controls", "target": "WCAG 2.1 AA"},
            {"id": "NFR-07", "category": "Audit Logging", "requirement": "Complete audit trail of reviews and approvals", "target": "Retained 7 years"},
            {"id": "NFR-08", "category": "Backup / Recovery", "requirement": "Automated snapshotting and recovery", "target": "RPO 15m, RTO 1h"},
            {"id": "NFR-09", "category": "Monitoring", "requirement": "Application telemetry and health probe", "target": "99.9% health check"},
        ]
    nfr_rows_1 = "".join(
        f"<tr><td>{esc(n.get('id',''))}</td><td>{esc(n.get('category',''))}</td>"
        f"<td>{esc(n.get('requirement',''))}</td><td>{esc(n.get('target',''))}</td></tr>"
        for n in nfr_list[:4]
    )
    nfr_rows_2 = "".join(
        f"<tr><td>{esc(n.get('id',''))}</td><td>{esc(n.get('category',''))}</td>"
        f"<td>{esc(n.get('requirement',''))}</td><td>{esc(n.get('target',''))}</td></tr>"
        for n in nfr_list[4:]
    )

    errors = err_data.get("errors") or [
        {"code": "E-DOC-01", "scenario": "Corrupted or password-protected file", "message": "Unable to read document. Please upload an unprotected DOCX, PPTX or PDF.", "behaviour": "Reject file gracefully"},
        {"code": "E-REV-02", "scenario": "Attempting external sync before review", "message": "Tracker requires internal approval by Akshay & Thasleema before external dispatch.", "behaviour": "Halt external sharing"},
    ]
    err_rows = "".join(
        f"<tr><td>{esc(e.get('code','E-100'))}</td><td>{esc(e.get('scenario',''))}</td>"
        f"<td>{esc(e.get('message',''))}</td><td>{esc(e.get('behaviour',''))}</td></tr>"
        for e in errors
    )
    edge_cases = err_data.get("edge_cases") or [
        "User uploads slides containing only diagrams -> extract shape metadata and OCR text",
        "Proposal contains multi-cloud hybrid requirements -> split into discrete cloud prerequisite tracks",
    ]
    edge_li = "".join(f"<li>{esc(ec)}</li>" for ec in edge_cases)

    sec_auth = security.get("auth", "Role-based access with session tokens and secure credential vaults")
    sec_session = security.get("session", "30-minute idle timeout for administrative sessions")
    sec_masking = security.get("data_masking", "All uploaded API keys and connection strings masked with zero-exposure hashes")
    sec_consent = security.get("consent", "Formal internal review sign-off by Akshay & Thasleema")
    sec_testing = security.get("security_testing", "Automated vulnerability scanning and dependency auditing")

    asmp_list = assumptions.get("assumptions") or [
        "Uploaded proposals accurately reflect agreed architectural scope.",
        "Client stakeholders have authority to provision requested staging credentials.",
    ]
    asmp_li = "".join(f"<li>{esc(a)}</li>" for a in asmp_list)
    constraints = assumptions.get("constraints") or [
        {"type": "Process", "constraint": "Generated tracker must NOT be sent directly to client without internal review."},
        {"type": "Format", "constraint": "BRD must strictly follow the 27-section template format."},
    ]
    const_rows = "".join(
        f'<tr><td class="kv-label">{esc(c.get("type","General"))}</td><td class="kv-value">{esc(c.get("constraint",""))}</td></tr>'
        for c in constraints
    )
    deps = assumptions.get("dependencies") or [
        {"id": "DEP-01", "dependency": "Proposal document upload", "owner": "Sales / Delivery Lead", "needed_by": "Day -10"},
        {"id": "DEP-02", "dependency": "Internal review sign-off", "owner": "Akshay & Thasleema", "needed_by": "Day -7"},
    ]
    dep_rows = "".join(
        f"<tr><td>{esc(d.get('id','DEP-01'))}</td><td>{esc(d.get('dependency',''))}</td>"
        f"<td>{esc(d.get('owner',''))}</td><td>{esc(d.get('needed_by',''))}</td></tr>"
        for d in deps
    )

    if not risks:
        risks = [
            {"id": "R-REQ-01", "risk": "Risk of scope creep due to unvetted requirement ambiguities during active development.",
             "likelihood": "Medium", "impact": "Medium",
             "mitigation": "Enforce strict 27-section BRD requirement traceability and dual review sign-off by Akshay & Thasleema.",
             "owner": "Akshay"},
        ]
    risk_rows = "".join(
        f"<tr><td><strong>{esc(r.get('id','R-01'))}</strong></td>"
        f"<td>{esc(r.get('risk',''))}</td><td>{esc(r.get('likelihood','M'))}</td>"
        f"<td>{esc(r.get('impact','H'))}</td><td>{esc(r.get('mitigation',''))}</td>"
        f"<td>{esc(r.get('owner','Akshay'))}</td></tr>"
        for r in risks
    )

    tests = uat.get("tests") or [
        {"id": "TC-01", "scenario": "Verify DOCX/PPTX proposal upload", "steps": "Upload document -> Verify text extraction", "expected": "27-section BRD and minimal tracker generated", "traces_to": "US-01"},
        {"id": "TC-02", "scenario": "Verify internal review workflow", "steps": "Click approve by Akshay & Thasleema", "expected": "Tracker status updates to Approved", "traces_to": "US-02"},
    ]
    test_rows = "".join(
        f"<tr><td>{esc(t.get('id','TC-01'))}</td><td>{esc(t.get('scenario',''))}</td>"
        f"<td>{esc(t.get('steps',''))}</td><td>{esc(t.get('expected',''))}</td>"
        f"<td>{esc(t.get('traces_to','US-01'))}</td></tr>"
        for t in tests
    )
    entry_crit = uat.get("entry_criteria", "All unit tests passing and proposal parser validated against sample documents")
    exit_crit = uat.get("exit_criteria", "Successful generation and export of both .docx BRD and .xlsx tracker")

    if not traceability:
        traceability = [
            {"obj": "OBJ-01", "br": "BR-01", "fr": "FR-01", "us": "US-01", "rule": "BRL-01", "test": "TC-01", "status": "Passed"},
            {"obj": "OBJ-02", "br": "BR-02", "fr": "FR-02", "us": "US-02", "rule": "BRL-02", "test": "TC-02", "status": "Passed"},
        ]
    rtm_rows = "".join(
        f"<tr><td>{esc(t.get('obj','OBJ-01'))}</td><td>{esc(t.get('br','BR-01'))}</td>"
        f"<td>{esc(t.get('fr','FR-01'))}</td><td>{esc(t.get('us','US-01'))}</td>"
        f"<td>{esc(t.get('rule','—'))}</td><td>{esc(t.get('test','TC-01'))}</td>"
        f'<td><strong style="color: #166534;">{esc(t.get("status","Passed"))}</strong></td></tr>'
        for t in traceability
    )

    if not milestones:
        milestones = [
            {"milestone": "Proposal Analysis & BRD Generation", "target_date": "Day -10", "exit_criteria": "27-section BRD ready"},
            {"milestone": "Internal Review (Akshay & Thasleema)", "target_date": "Day -7", "exit_criteria": "Internal sign-off complete"},
            {"milestone": "Prerequisite Delivery & Verification", "target_date": "Day -2", "exit_criteria": "100% Day-1 blockers cleared"},
            {"milestone": "Sprint Kick-off", "target_date": "Day 0", "exit_criteria": "Architecture sprint 0 launch"},
        ]
    mile_rows = "".join(
        f"<tr><td>{esc(m.get('milestone',''))}</td><td>{esc(m.get('target_date',''))}</td>"
        f"<td>{esc(m.get('exit_criteria',''))}</td></tr>"
        for m in milestones
    )

    if not questions:
        questions = [
            {"id": "Q-01", "question": "Are client staging environments accessible via VPC peering or static NAT EIP?",
             "raised_by": "Thasleema", "owner": "Client DevOps Lead", "due": "Day -7", "status": "Open"},
        ]
    q_rows = "".join(
        f"<tr><td>{esc(q.get('id','Q-01'))}</td><td>{esc(q.get('question',''))}</td>"
        f"<td>{esc(q.get('raised_by',''))}</td><td>{esc(q.get('owner',''))}</td>"
        f"<td>{esc(q.get('due',''))}</td><td>{esc(q.get('status','Open'))}</td></tr>"
        for q in questions
    )

    if not glossary:
        glossary = [
            {"term": "BRD", "definition": "Business Requirements Document"},
            {"term": "PreQ", "definition": "Pre-requisite Verification & Readiness Platform"},
            {"term": "SOW", "definition": "Statement of Work"},
            {"term": "SLA", "definition": "Service Level Agreement"},
            {"term": "MoSCoW", "definition": "Prioritization framework: Must, Should, Could, Won't"},
        ]
    gloss_rows = "".join(
        f'<tr><td class="kv-label">{esc(g.get("term",""))}</td><td class="kv-value">{esc(g.get("definition",""))}</td></tr>'
        for g in glossary
    )

    if not appendices:
        appendices = [
            "Appendix A: Proposal Document Raw Extract",
            "Appendix B: Architectural Flow & Sequence Diagrams",
            "Appendix C: Zero-Exposure Masking & Credential Standards",
            "Appendix D: Internal Review Audit Trail (Akshay & Thasleema)",
            "Appendix E: Regulatory & Security Compliance Checklists",
        ]
    appx_li = "".join(f"<li>{esc(a)}</li>" for a in appendices)

    if not signoff:
        signoff = [
            {"name": "Client Sponsor", "role": "Business Sponsor", "signature": "", "date": ""},
            {"name": "Akshay", "role": "Team Lead", "signature": "Akshay", "date": date_str},
            {"name": "Thasleema", "role": "Project Manager", "signature": "Thasleema", "date": date_str},
            {"name": "QA Lead", "role": "QA Lead", "signature": "", "date": ""},
        ]
    sign_rows = "".join(
        f"<tr><td>{esc(s.get('name',''))}</td><td>{esc(s.get('role',''))}</td>"
        f"<td>{'<strong>' + esc(s.get('signature','')) + '</strong>' if s.get('signature') else ''}</td>"
        f"<td>{esc(s.get('date',''))}</td></tr>"
        for s in signoff
    )

    platforms = scope.get("platforms", "Cloud Infrastructure (AWS/GCP/Azure), Web Application")
    browsers = scope.get("browsers", "Latest versions of Chrome, Safari, Edge, Firefox")
    languages = scope.get("languages", "English (Primary)")
    environments = scope.get("environments", "DEV -> QA -> STAGING -> PROD")

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{esc(proj_name)} — Business Requirements Document</title>
  <style>
    @page {{ size: A4; margin: 0; }}
    * {{ box-sizing: border-box; }}
    body {{
      background-color: #F8FAFC; margin: 0; padding: 36px 0;
      font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #0F172A; line-height: 1.55;
    }}
    .page {{
      width: 210mm; min-height: 297mm; padding: 24mm 22mm 20mm 22mm;
      margin: 0 auto 36px auto; background: #FFFFFF;
      box-shadow: 0 4px 24px -2px rgba(15, 23, 42, 0.08), 0 2px 8px -1px rgba(15, 23, 42, 0.04);
      border-radius: 12px; border: 1px solid #E2E8F0; position: relative;
      page-break-after: always; display: flex; flex-direction: column; justify-content: space-between;
    }}
    @media print {{
      body {{ background: white; padding: 0; }}
      .page {{ margin: 0; box-shadow: none; border: none; border-radius: 0; page-break-after: always; width: 100%; min-height: 100vh; }}
    }}
    .header-logo {{ display: flex; justify-content: flex-end; align-items: center; margin-bottom: 24px; }}
    .footer {{
      border-top: 1px solid #E2E8F0; padding-top: 12px; margin-top: 32px;
      display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #94A3B8;
    }}
    h1.cover-title {{ color: #0F172A; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; margin: 70px 0 12px 0; text-align: center; }}
    h2.cover-subtitle {{ color: #ED7D31; font-size: 17px; font-weight: 700; margin: 0 0 32px 0; text-align: center; line-height: 1.45; }}
    .cover-meta {{ text-align: center; font-size: 12.5px; color: #475569; margin-bottom: 6px; }}
    .cover-notice {{
      background-color: #FFF7ED; border: 1px solid #FFEDD5; border-left: 4px solid #ED7D31;
      border-radius: 10px; padding: 16px 20px; margin: 50px auto 0 auto; width: 92%;
      font-size: 12px; line-height: 1.6; color: #9A3412; text-align: left;
    }}
    h2 {{ color: #0F172A; font-size: 17px; font-weight: 750; letter-spacing: -0.02em; margin-top: 24px; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #F1F5F9; }}
    h3 {{ color: #ED7D31; font-size: 13.5px; font-weight: 700; margin-top: 16px; margin-bottom: 8px; }}
    table {{ width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 18px; font-size: 12px; border-radius: 8px; overflow: hidden; border: 1px solid #E2E8F0; }}
    th {{ background-color: #F8FAFC; color: #475569; font-weight: 700; padding: 9px 12px; border-bottom: 1px solid #E2E8F0; border-right: 1px solid #E2E8F0; font-size: 11px; text-align: left; text-transform: uppercase; letter-spacing: 0.04em; }}
    th:last-child {{ border-right: none; }}
    td {{ padding: 9px 12px; border-bottom: 1px solid #E2E8F0; border-right: 1px solid #E2E8F0; font-size: 11.5px; vertical-align: middle; color: #1E293B; background-color: #FFFFFF; }}
    td:last-child {{ border-right: none; }}
    tr:last-child td {{ border-bottom: none; }}
    td.kv-label {{ background-color: #F8FAFC; color: #0F172A; font-weight: 600; width: 32%; }}
    td.kv-value {{ background-color: #FFFFFF; }}
    ul {{ margin: 4px 0 12px 0; padding-left: 20px; font-size: 12.5px; color: #334155; }}
    li {{ margin-bottom: 5px; }}
    .badge-raci {{ background: #0F172A; color: #FFFFFF; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 10.5px; }}
  </style>
</head>
<body>

  <div class="page" id="page-1">
    <div>
      <div class="header-logo">{logo_img}</div>
      <h1 class="cover-title">Business Requirements Document</h1>
      <h2 class="cover-subtitle">{esc(proj_name)}</h2>
      <div class="cover-meta" style="font-weight: 600; color: #334155;">Version {esc(version)} &bull; {esc(date_str)} &bull; Status: <span style="background: #FFF7ED; color: #EA580C; padding: 2px 8px; border-radius: 9999px; font-size: 11px; border: 1px solid #FFEDD5; font-weight: 700;">{esc(status)}</span></div>
      <div class="cover-meta" style="color: #64748B; margin-top: 4px;">Prepared by {esc(prepared_by)}</div>
      <div class="cover-notice">
        <strong style="color: #9A3412; display: block; margin-bottom: 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em;">DOCUMENT GUIDANCE NOTICE:</strong>
        This Business Requirements Document was automatically extracted and structured strictly from the project proposal. It specifies all functional, technical, non-functional, and prerequisite requirements. Internal approval by Akshay (Team Lead) &amp; Thasleema (Project Manager) is required before external distribution.
      </div>
    </div>
    <div class="footer"><span>goML PreQ &bull; Business Requirements Document</span><span style="font-weight: 700; color: #ED7D31;">Page 1 of 12</span></div>
  </div>

  <div class="page" id="page-2">
    <div>
      <div class="header-logo">{logo_img}</div>
      <h2>1. Document control</h2>
      <table><thead><tr><th>Field</th><th>Details</th></tr></thead><tbody>{dc_rows}</tbody></table>
      <h3>Revision history</h3>
      <table><thead><tr><th>Version</th><th>Date</th><th>Author</th><th>Summary of changes</th></tr></thead><tbody>{rev_rows}</tbody></table>
      <h3>Reviewers and approvers</h3>
      <table><thead><tr><th>Name</th><th>Role</th><th>Responsibility</th><th>Approval date</th></tr></thead><tbody>{reviewer_rows}</tbody></table>
    </div>
    <div class="footer"><span>goML PreQ | Business Requirements Document</span><span style="font-weight: bold; color: #C55A11;">Page 2 of 12</span></div>
  </div>

  <div class="page" id="page-3">
    <div>
      <div class="header-logo">{logo_img}</div>
      <h2>2. Executive summary</h2>
      <p style="font-size: 12.5px; line-height: 1.6; margin-bottom: 16px;">{esc(exec_summary)}</p>
      <h2>3. Background and problem statement</h2>
      <ul style="list-style-type: disc;">
        <li><strong>Problem:</strong> {esc(bg.get('problem', 'Existing manual and fragmented workflows lead to delivery bottlenecks and uncoordinated environment access.'))}</li>
        <li><strong>Business impact:</strong> {esc(bg.get('business_impact', 'Operational delays, lack of visibility into technical gatekeepers, and risk of delayed sprint kick-offs.'))}</li>
        <li><strong>Root cause:</strong> {esc(bg.get('root_cause', 'Absence of structured prerequisite governance and automated requirement traceability prior to development.'))}</li>
        <li><strong>Why now:</strong> {esc(bg.get('why_now', 'Immediate business need to launch production capabilities within the target schedule.'))}</li>
      </ul>
      <h2>4. Business objectives and success metrics</h2>
      <table><thead><tr><th>ID</th><th>Objective</th><th>KPI</th><th>Baseline</th><th>Target</th><th>Measured by</th><th>Date</th></tr></thead><tbody>{obj_rows}</tbody></table>
      <h2>5. Scope</h2>
      <h3>In scope</h3><ul style="list-style-type: disc;">{in_scope_li}</ul>
      <h3>Out of scope</h3><ul style="list-style-type: disc;">{out_scope_li}</ul>
      <h3>Platforms and environments</h3>
      <table><thead><tr><th>Item</th><th>Details</th></tr></thead><tbody>
        <tr><td class="kv-label">Platforms</td><td class="kv-value">{esc(platforms)}</td></tr>
        <tr><td class="kv-label">Supported browsers</td><td class="kv-value">{esc(browsers)}</td></tr>
        <tr><td class="kv-label">Languages / locales</td><td class="kv-value">{esc(languages)}</td></tr>
        <tr><td class="kv-label">Environments</td><td class="kv-value">{esc(environments)}</td></tr>
      </tbody></table>
    </div>
    <div class="footer"><span>goML PreQ | Business Requirements Document</span><span style="font-weight: bold; color: #C55A11;">Page 3 of 12</span></div>
  </div>

  <div class="page" id="page-4">
    <div>
      <div class="header-logo">{logo_img}</div>
      <h2>6. Stakeholders and user roles</h2>
      <h3>6.1 Stakeholders (RACI)</h3>
      <table><thead><tr><th>Name</th><th>Role / department</th><th>Interest</th><th>RACI</th></tr></thead><tbody>{raci_rows}</tbody></table>
      <h3>6.2 System user roles</h3>
      <table><thead><tr><th>Role</th><th>Description</th><th>How they access</th><th>Approx. users</th></tr></thead><tbody>{user_role_rows}</tbody></table>
      <h2>7. Current state and future state</h2>
      <h3>7.1 Current state (as-is)</h3>
      <ol style="padding-left: 20px; font-size: 12.5px; margin-bottom: 8px;">{as_is_li}</ol>
      <p style="font-size: 12px; font-style: italic; color: #475569; margin-top: 4px;">Pain points: {esc(pain_str)}</p>
    </div>
    <div class="footer"><span>goML PreQ | Business Requirements Document</span><span style="font-weight: bold; color: #C55A11;">Page 4 of 12</span></div>
  </div>

  <div class="page" id="page-5">
    <div>
      <div class="header-logo">{logo_img}</div>
      <h3>7.2 Future state (to-be) process flow</h3>
      <table><thead><tr><th>Step</th><th>Actor</th><th>Action</th><th>System behaviour</th><th>Next step</th></tr></thead><tbody>{to_be_rows}</tbody></table>
      <h3>7.3 Gap analysis</h3>
      <table><thead><tr><th>Area</th><th>Current</th><th>Future</th><th>Gap to close</th></tr></thead><tbody>{gap_rows}</tbody></table>
      <h2>8. Business requirements</h2>
      <table><thead><tr><th>ID</th><th>Business requirement</th><th>Priority</th><th>Objective</th><th>Owner</th></tr></thead><tbody>{br_rows}</tbody></table>
      <h2>9. Functional requirements</h2>
      <h3>9.1 Functional requirements list</h3>
      <table><thead><tr><th>ID</th><th>Requirement ("The system shall...")</th><th>Priority</th><th>Traces to</th><th>User story</th></tr></thead><tbody>{fr_rows}</tbody></table>
    </div>
    <div class="footer"><span>goML PreQ | Business Requirements Document</span><span style="font-weight: bold; color: #C55A11;">Page 5 of 12</span></div>
  </div>

  <div class="page" id="page-6">
    <div>
      <div class="header-logo">{logo_img}</div>
      <h3>9.2 User stories and acceptance criteria</h3>
      {us_html}
      <h2>10. Business rules and validations</h2>
      <table><thead><tr><th>Rule ID</th><th>Rule</th><th>Condition</th><th>Outcome</th><th>Configurable?</th><th>Error code</th></tr></thead><tbody>{rule_rows}</tbody></table>
      <h2>11. Data requirements</h2>
      <h3>11.1 Key entities</h3>
      <table><thead><tr><th>Entity</th><th>Description</th><th>Key relationships</th></tr></thead><tbody>{entity_rows}</tbody></table>
    </div>
    <div class="footer"><span>goML PreQ | Business Requirements Document</span><span style="font-weight: bold; color: #C55A11;">Page 6 of 12</span></div>
  </div>

  <div class="page" id="page-7">
    <div>
      <div class="header-logo">{logo_img}</div>
      <h3>11.2 Data dictionary</h3>
      <table><thead><tr><th>Field</th><th>Entity</th><th>Type</th><th>Format</th><th>Req?</th><th>Validation</th><th>Example</th></tr></thead><tbody>{dd_rows}</tbody></table>
      <h3>11.3 Data retention, migration and privacy</h3>
      <ul style="list-style-type: disc;">
        <li><strong>Retention:</strong> {esc(ret_retention)}</li>
        <li><strong>Sensitive fields:</strong> {esc(ret_sensitive)}</li>
        <li><strong>Data migration:</strong> {esc(ret_migration)}</li>
      </ul>
      <h2>12. User interface requirements</h2>
      <table><thead><tr><th>Screen ID</th><th>Screen name</th><th>Role</th><th>Key fields / components</th><th>Actions</th><th>Wireframe</th></tr></thead><tbody>{screen_rows}</tbody></table>
      <p style="font-size: 11.5px; color: #475569; margin-top: 4px;">Screen states: {esc(ui_states)}<br/>Responsive breakpoints: {esc(ui_breakpoints)}</p>
      <h2>13. Integration and API requirements</h2>
      <table><thead><tr><th>ID</th><th>System</th><th>Direction</th><th>Protocol</th><th>Trigger</th><th>Auth</th><th>Timeout/retry</th></tr></thead><tbody>{integ_rows}</tbody></table>
    </div>
    <div class="footer"><span>goML PreQ | Business Requirements Document</span><span style="font-weight: bold; color: #C55A11;">Page 7 of 12</span></div>
  </div>

  <div class="page" id="page-8">
    <div>
      <div class="header-logo">{logo_img}</div>
      <h2>14. Notifications</h2>
      <table><thead><tr><th>ID</th><th>Trigger event</th><th>Channel</th><th>Recipient</th><th>Content summary</th><th>Template ref</th></tr></thead><tbody>{ntf_rows}</tbody></table>
      <h2>15. Reporting and analytics</h2>
      <table><thead><tr><th>Report / event</th><th>Audience</th><th>Content / metrics</th><th>Frequency</th><th>Format</th></tr></thead><tbody>{rep_rows}</tbody></table>
      <h2>16. Non-functional requirements</h2>
      <table><thead><tr><th>ID</th><th>Category</th><th>Requirement</th><th>Measure / target</th></tr></thead><tbody>{nfr_rows_1}</tbody></table>
    </div>
    <div class="footer"><span>goML PreQ | Business Requirements Document</span><span style="font-weight: bold; color: #C55A11;">Page 8 of 12</span></div>
  </div>

  <div class="page" id="page-9">
    <div>
      <div class="header-logo">{logo_img}</div>
      <table><thead><tr><th>ID</th><th>Category</th><th>Requirement</th><th>Measure / target</th></tr></thead><tbody>{nfr_rows_2}</tbody></table>
      <h2>17. Error handling and edge cases</h2>
      <table><thead><tr><th>Error code</th><th>Scenario</th><th>User-facing message</th><th>System behaviour</th></tr></thead><tbody>{err_rows}</tbody></table>
      <h3>Edge cases to handle</h3>
      <ul style="list-style-type: disc;">{edge_li}</ul>
      <h2>18. Security and compliance requirements</h2>
      <ul style="list-style-type: disc;">
        <li><strong>Authentication:</strong> {esc(sec_auth)}</li>
        <li><strong>Session:</strong> {esc(sec_session)}</li>
        <li><strong>Data masking:</strong> {esc(sec_masking)}</li>
        <li><strong>Consent:</strong> {esc(sec_consent)}</li>
        <li><strong>Security testing:</strong> {esc(sec_testing)}</li>
      </ul>
    </div>
    <div class="footer"><span>goML PreQ | Business Requirements Document</span><span style="font-weight: bold; color: #C55A11;">Page 9 of 12</span></div>
  </div>

  <div class="page" id="page-10">
    <div>
      <div class="header-logo">{logo_img}</div>
      <h2>19. Assumptions, constraints and dependencies</h2>
      <h3>Assumptions</h3><ul style="list-style-type: disc;">{asmp_li}</ul>
      <h3>Constraints</h3>
      <table><thead><tr><th>Type</th><th>Constraint</th></tr></thead><tbody>{const_rows}</tbody></table>
      <h3>Dependencies</h3>
      <table><thead><tr><th>ID</th><th>Dependency</th><th>Owner</th><th>Needed by</th></tr></thead><tbody>{dep_rows}</tbody></table>
      <h2>20. Risks</h2>
      <table><thead><tr><th>ID</th><th>Risk</th><th>Likelihood</th><th>Impact</th><th>Mitigation</th><th>Owner</th></tr></thead><tbody>{risk_rows}</tbody></table>
    </div>
    <div class="footer"><span>goML PreQ | Business Requirements Document</span><span style="font-weight: bold; color: #C55A11;">Page 10 of 12</span></div>
  </div>

  <div class="page" id="page-11">
    <div>
      <div class="header-logo">{logo_img}</div>
      <h2>21. Test scenarios and UAT</h2>
      <table><thead><tr><th>Test ID</th><th>Scenario</th><th>Steps (summary)</th><th>Expected result</th><th>Traces to</th></tr></thead><tbody>{test_rows}</tbody></table>
      <p style="font-size: 11.5px; color: #475569; margin-top: 4px;">• UAT Entry Criteria: {esc(entry_crit)}<br/>• UAT Exit Criteria: {esc(exit_crit)}</p>
      <h2>22. Requirements traceability matrix</h2>
      <table><thead><tr><th>Objective</th><th>Business req.</th><th>Functional req.</th><th>User story</th><th>Business rule</th><th>Test case</th><th>Status</th></tr></thead><tbody>{rtm_rows}</tbody></table>
      <h2>23. Release plan and milestones</h2>
      <table><thead><tr><th>Milestone</th><th>Target date</th><th>Exit criteria</th></tr></thead><tbody>{mile_rows}</tbody></table>
      <h2>24. Open questions and decisions log</h2>
      <table><thead><tr><th>ID</th><th>Question / decision</th><th>Raised by</th><th>Owner</th><th>Due</th><th>Status / answer</th></tr></thead><tbody>{q_rows}</tbody></table>
    </div>
    <div class="footer"><span>goML PreQ | Business Requirements Document</span><span style="font-weight: bold; color: #C55A11;">Page 11 of 12</span></div>
  </div>

  <div class="page" id="page-12">
    <div>
      <div class="header-logo">{logo_img}</div>
      <h2>25. Glossary</h2>
      <table><thead><tr><th>Term</th><th>Definition</th></tr></thead><tbody>{gloss_rows}</tbody></table>
      <h2>26. Appendices</h2>
      <ul style="list-style-type: disc;">{appx_li}</ul>
      <h2>27. Sign-off</h2>
      <p style="font-size: 12px; font-style: italic; margin-bottom: 10px;">By signing, approvers confirm this document accurately captures the requirements and is approved as the baseline for development. Changes after sign-off follow the change request process.</p>
      <table><thead><tr><th>Name</th><th>Role</th><th>Signature</th><th>Date</th></tr></thead><tbody>{sign_rows}</tbody></table>
    </div>
    <div class="footer"><span>goML PreQ | Business Requirements Document</span><span style="font-weight: bold; color: #C55A11;">Page 12 of 12</span></div>
  </div>

</body>
</html>
"""
    return html
