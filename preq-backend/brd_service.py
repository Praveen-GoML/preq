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
            "tech_lead": "Thasleema (Lead AI Architect)",
            "product_lead": "Akshay (AI Solutions Lead)",
            "raci_roles": [
                {"name": f"{c_name} Executive AI Sponsor", "role": "Business Sponsor", "interest": "GenAI Strategy & Outcomes", "raci": "A"},
                {"name": "Akshay", "role": "AI Solutions Lead", "interest": "RAG & LLM Requirement Definition", "raci": "R"},
                {"name": "Thasleema", "role": "Lead AI Architect", "interest": "Model Architecture & Pipeline", "raci": "R"},
                {"name": "AI Safety & Compliance Officer", "role": "AI Governance Auditor", "interest": "Model Safety & Zero Data Exposure", "raci": "C"}
            ],
            "user_roles": [
                {"role": "LLM & Prompt Engineer", "description": "Constructs and tunes retrieval workflows, system prompts, and vector embeddings", "access": "AI Workbench Console", "approx_users": "8"},
                {"role": "Model Evaluation Reviewer", "description": "Audits model output accuracy, latency metrics, and hallucination scores", "access": "Eval & Analytics Portal", "approx_users": "4"},
                {"role": "Enterprise Operator / End User", "description": "Interacts with automated AI assistants and multi-agent workflows", "access": "Web App / REST API", "approx_users": "250"}
            ],
            "reviewers": [
                {"name": f"{c_name} Sponsor", "role": "Executive AI Sponsor", "responsibility": "Approver", "approval_date": "Pending"},
                {"name": "Akshay", "role": "AI Solutions Lead", "responsibility": "Approver", "approval_date": datetime.date.today().strftime("%d-%m-%Y")},
                {"name": "Thasleema", "role": "Lead AI Architect", "responsibility": "Reviewer", "approval_date": datetime.date.today().strftime("%d-%m-%Y")},
                {"name": "AI Governance Auditor", "role": "AI Safety Lead", "responsibility": "Reviewer", "approval_date": "Pending"}
            ]
        }
    elif any(k in txt for k in ["cloud", "aws", "azure", "gcp", "kubernetes", "terraform", "devops", "infrastructure"]):
        return {
            "business_sponsor": f"{c_name} VP of Infrastructure",
            "tech_lead": "Thasleema (Principal Cloud Architect)",
            "product_lead": "Akshay (Cloud Delivery Lead)",
            "raci_roles": [
                {"name": f"{c_name} Infrastructure Sponsor", "role": "Cloud Executive", "interest": "Uptime & SLA Governance", "raci": "A"},
                {"name": "Akshay", "role": "Cloud Delivery Lead", "interest": "Deployment Timelines & Scope", "raci": "R"},
                {"name": "Thasleema", "role": "Principal Cloud Architect", "interest": "Cloud IaC & VPC Topology", "raci": "R"},
                {"name": "Cloud Security Auditor", "role": "Infosec Lead", "interest": "IAM & Key Management", "raci": "C"}
            ],
            "user_roles": [
                {"role": "Cloud DevOps & SRE Engineer", "description": "Manages Terraform IaC pipelines, Kubernetes clusters, and deployment manifests", "access": "Cloud Console & CLI", "approx_users": "12"},
                {"role": "Security Compliance Inspector", "description": "Reviews IAM policies, VPC peering configs, and encryption keys", "access": "Security Hub", "approx_users": "3"},
                {"role": "Application Developer", "description": "Deploys microservices and consumes infrastructure APIs", "access": "CI/CD Pipeline", "approx_users": "45"}
            ],
            "reviewers": [
                {"name": f"{c_name} Cloud Sponsor", "role": "VP of Infrastructure", "responsibility": "Approver", "approval_date": "Pending"},
                {"name": "Akshay", "role": "Cloud Delivery Lead", "responsibility": "Approver", "approval_date": datetime.date.today().strftime("%d-%m-%Y")},
                {"name": "Thasleema", "role": "Principal Cloud Architect", "responsibility": "Reviewer", "approval_date": datetime.date.today().strftime("%d-%m-%Y")},
                {"name": "Infosec Lead", "role": "Cloud Security Auditor", "responsibility": "Reviewer", "approval_date": "Pending"}
            ]
        }
    elif any(k in txt for k in ["data", "etl", "snowflake", "bigquery", "postgres", "sql", "analytics", "pipeline"]):
        return {
            "business_sponsor": f"{c_name} Chief Data Officer (CDO)",
            "tech_lead": "Thasleema (Principal Data Architect)",
            "product_lead": "Akshay (Data Solutions Lead)",
            "raci_roles": [
                {"name": f"{c_name} Data Sponsor", "role": "Chief Data Officer", "interest": "Data Integrity & Governance", "raci": "A"},
                {"name": "Akshay", "role": "Data Solutions Lead", "interest": "Ingestion Scope & Requirements", "raci": "R"},
                {"name": "Thasleema", "role": "Principal Data Architect", "interest": "ETL & Database Schema Design", "raci": "R"},
                {"name": "Data Privacy Lead", "role": "Compliance Officer", "interest": "PII Masking & Audit Logging", "raci": "C"}
            ],
            "user_roles": [
                {"role": "Lead Data Pipeline Engineer", "description": "Maintains ETL ingestion streams, data transformations, and schemas", "access": "Data Lake Console", "approx_users": "10"},
                {"role": "BI Analytics Specialist", "description": "Builds executive dashboards and queries curated datasets", "access": "BI Dashboard", "approx_users": "30"},
                {"role": "Data Governance Inspector", "description": "Verifies zero-exposure PII masking and retention policies", "access": "Governance Portal", "approx_users": "5"}
            ],
            "reviewers": [
                {"name": f"{c_name} Data Sponsor", "role": "Chief Data Officer", "responsibility": "Approver", "approval_date": "Pending"},
                {"name": "Akshay", "role": "Data Solutions Lead", "responsibility": "Approver", "approval_date": datetime.date.today().strftime("%d-%m-%Y")},
                {"name": "Thasleema", "role": "Principal Data Architect", "responsibility": "Reviewer", "approval_date": datetime.date.today().strftime("%d-%m-%Y")},
                {"name": "Data Privacy Lead", "role": "Compliance Officer", "responsibility": "Reviewer", "approval_date": "Pending"}
            ]
        }
    else:
        domain_title = project_type or "Enterprise Systems"
        return {
            "business_sponsor": f"{c_name} Executive Sponsor",
            "tech_lead": "Thasleema (Lead Systems Architect)",
            "product_lead": "Akshay (Solutions Lead)",
            "raci_roles": [
                {"name": f"{c_name} Executive Sponsor", "role": "Business Sponsor", "interest": "Budget & Project Outcome", "raci": "A"},
                {"name": "Akshay", "role": "Solutions & Product Lead", "interest": "Scope & Requirement Traceability", "raci": "R"},
                {"name": "Thasleema", "role": "Lead Systems Architect", "interest": "Technical Solution & Architecture", "raci": "R"},
                {"name": "Enterprise Security Lead", "role": "Governance Lead", "interest": "Security & Credential Governance", "raci": "C"}
            ],
            "user_roles": [
                {"role": f"{domain_title} Integration Engineer", "description": "Oversees system connectors and validates environment prerequisites", "access": "Admin Console, SSO", "approx_users": "10"},
                {"role": "Technical Reviewer / Approver", "description": "Inspects prerequisite evidence artifacts and grants verification", "access": "Reviewer Console", "approx_users": "5"},
                {"role": "Operational End User", "description": "Executes daily business operations and monitors real-time telemetry", "access": "Web Dashboard", "approx_users": "100"}
            ],
            "reviewers": [
                {"name": f"{c_name} Executive Sponsor", "role": "Business Sponsor", "responsibility": "Approver", "approval_date": "Pending"},
                {"name": "Akshay", "role": "Solutions & Product Lead", "responsibility": "Approver", "approval_date": datetime.date.today().strftime("%d-%m-%Y")},
                {"name": "Thasleema", "role": "Lead Systems Architect", "responsibility": "Reviewer", "approval_date": datetime.date.today().strftime("%d-%m-%Y")},
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
        "prepared_by": "Akshay & Thasleema, Principal Solutions Analysts",
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
                {"version": "0.1", "date": today, "author": "Akshay", "summary": "Initial proposal extraction"},
                {"version": "1.0", "date": today, "author": "Thasleema", "summary": "Structured BRD baseline"}
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
            {"name": "Akshay", "role": "Product & Solutions Lead", "signature": "Akshay", "date": today},
            {"name": "Thasleema", "role": "Lead Architect", "signature": "Thasleema", "date": today},
            {"name": "QA Lead", "role": "QA Lead", "signature": "", "date": ""}
        ]
    }


def generate_brd_docx(brd: dict) -> io.BytesIO:
    """Generates a professional, beautifully formatted Word .docx document with goML header logo, Orange styling, and Black text (No black backgrounds)."""
    doc = docx.Document()

    # Ensure goML logo exists on disk
    logo_path = os.path.join(os.path.dirname(__file__), "goml_logo.png")
    ensure_goml_logo(logo_path)

    # Set page margins and top right goML logo on page header
    for section in doc.sections:
        section.top_margin = Inches(0.5)
        section.bottom_margin = Inches(0.7)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        section.header_distance = Inches(0.2) # Position high up in extreme top right corner

        # Header configuration: Small Top Right goML Logo
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hp.paragraph_format.space_before = Pt(0)
        hp.paragraph_format.space_after = Pt(0)
        if os.path.exists(logo_path):
            hrun = hp.add_run()
            hrun.add_picture(logo_path, width=Inches(0.85)) # Small, clean size

    # Helper styling function (Orange theme, Black text, NO black backgrounds)
    def add_title(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(text)
        run.font.name = "Arial"
        run.font.size = Pt(24)
        run.font.bold = True
        run.font.color.rgb = RGBColor(197, 90, 17) # Dark Rust / Orange
        p.paragraph_format.space_after = Pt(8)
        return p

    def add_subtitle(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(text)
        run.font.name = "Arial"
        run.font.size = Pt(14)
        run.font.color.rgb = RGBColor(237, 125, 49) # Bright Orange
        run.font.bold = True
        p.paragraph_format.space_after = Pt(20)
        return p

    def add_heading1(text):
        p = doc.add_paragraph()
        run = p.add_run(text)
        run.font.name = "Arial"
        run.font.size = Pt(14)
        run.font.bold = True
        run.font.color.rgb = RGBColor(197, 90, 17) # Dark Rust / Orange
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(6)
        return p

    def add_heading2(text):
        p = doc.add_paragraph()
        run = p.add_run(text)
        run.font.name = "Arial"
        run.font.size = Pt(12)
        run.font.bold = True
        run.font.color.rgb = RGBColor(237, 125, 49) # Bright Orange
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        return p

    def add_body(text, italic=False):
        p = doc.add_paragraph()
        run = p.add_run(text)
        run.font.name = "Arial"
        run.font.size = Pt(10)
        run.font.italic = italic
        run.font.color.rgb = RGBColor(0, 0, 0) # Black text
        p.paragraph_format.space_after = Pt(4)
        return p

    def style_table(table, col_widths=None):
        table.alignment = WD_TABLE_ALIGNMENT.CENTER

        # Boxy layout: Solid 1pt black borders on all table outer & inner cell boundaries
        tblPr = table._tbl.tblPr
        borders_xml = (
            f'<w:tblBorders {nsdecls("w")}>'
            f'<w:top w:val="single" w:sz="6" w:space="0" w:color="000000"/>'
            f'<w:left w:val="single" w:sz="6" w:space="0" w:color="000000"/>'
            f'<w:bottom w:val="single" w:sz="6" w:space="0" w:color="000000"/>'
            f'<w:right w:val="single" w:sz="6" w:space="0" w:color="000000"/>'
            f'<w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
            f'<w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
            f'</w:tblBorders>'
        )
        tblPr.append(parse_xml(borders_xml))

        # Boxy padding for cell contents
        cell_mar_xml = (
            f'<w:tblCellMar {nsdecls("w")}>'
            f'<w:top w:w="120" w:type="dxa"/>'
            f'<w:bottom w:w="120" w:type="dxa"/>'
            f'<w:left w:w="160" w:type="dxa"/>'
            f'<w:right w:w="160" w:type="dxa"/>'
            f'</w:tblCellMar>'
        )
        tblPr.append(parse_xml(cell_mar_xml))

        # Style header row (Orange ED7D31 fill, Bold Black 000000 text)
        hdr_cells = table.rows[0].cells
        for cell in hdr_cells:
            shading_elm = parse_xml(r'<w:shd {} w:fill="ED7D31"/>'.format(nsdecls('w')))
            cell._tc.get_or_add_tcPr().append(shading_elm)
            for paragraph in cell.paragraphs:
                for run in paragraph.runs:
                    run.font.name = "Arial"
                    run.font.size = Pt(9.5)
                    run.font.bold = True
                    run.font.color.rgb = RGBColor(0, 0, 0) # Black text
        
        # Style alternating rows (Soft Peach FBE5D6 / White FFFFFF, Black 000000 text)
        for i, row in enumerate(table.rows[1:], 1):
            bg_color = "FBE5D6" if i % 2 == 1 else "FFFFFF"
            for cell in row.cells:
                shading_elm = parse_xml(r'<w:shd {} w:fill="{}"/>'.format(nsdecls('w'), bg_color))
                cell._tc.get_or_add_tcPr().append(shading_elm)
                for paragraph in cell.paragraphs:
                    for run in paragraph.runs:
                        run.font.name = "Arial"
                        run.font.size = Pt(9)
                        run.font.color.rgb = RGBColor(0, 0, 0) # Black text

        if col_widths:
            for row in table.rows:
                for idx, width in enumerate(col_widths):
                    if idx < len(row.cells):
                        row.cells[idx].width = Inches(width)

    # --- COVER PAGE ---
    # Top-Right Unfaded Body Logo
    if os.path.exists(logo_path):
        p_cover_logo = doc.add_paragraph()
        p_cover_logo.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p_cover_logo.paragraph_format.space_before = Pt(0)
        p_cover_logo.paragraph_format.space_after = Pt(0)
        r_cover_logo = p_cover_logo.add_run()
        r_cover_logo.add_picture(logo_path, width=Inches(0.85))

    add_title("Business Requirements Document")
    add_subtitle(f"[{brd.get('project_name', 'Enterprise Initiative')}]")

    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_meta = p_meta.add_run(f"Version [{brd.get('version', '1.0')}]  |  [{brd.get('date', datetime.date.today().strftime('%d-%m-%Y'))}]  |  Status: [{brd.get('status', 'In review')}]\nPrepared by [{brd.get('prepared_by', 'Akshay & Thasleema, Principal Solutions Analysts')}]")
    r_meta.font.name = "Arial"
    r_meta.font.size = Pt(11)
    r_meta.font.color.rgb = RGBColor(0, 0, 0)

    doc.add_paragraph().paragraph_format.space_after = Pt(20)

    # Boxed Guidance Notice Card
    box_table = doc.add_table(rows=1, cols=1)
    box_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    b_cell = box_table.rows[0].cells[0]
    b_cell.width = Inches(6.5)
    shading_box = parse_xml(r'<w:shd {} w:fill="FBE5D6"/>'.format(nsdecls('w')))
    b_cell._tc.get_or_add_tcPr().append(shading_box)
    
    b_tblPr = box_table._tbl.tblPr
    b_borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="8" w:space="0" w:color="000000"/>'
        f'<w:left w:val="single" w:sz="8" w:space="0" w:color="000000"/>'
        f'<w:bottom w:val="single" w:sz="8" w:space="0" w:color="000000"/>'
        f'<w:right w:val="single" w:sz="8" w:space="0" w:color="000000"/>'
        f'</w:tblBorders>'
    )
    b_tblPr.append(b_borders)

    bp = b_cell.paragraphs[0]
    brun = bp.add_run("DOCUMENT GUIDANCE NOTICE:\nThis Business Requirements Document was automatically extracted and structured strictly from the project proposal. It specifies all functional, technical, non-functional, and prerequisite requirements. Internal approval by Akshay & Thasleema is required before external distribution.")
    brun.font.name = "Arial"
    brun.font.size = Pt(9.5)
    brun.font.bold = False
    brun.font.color.rgb = RGBColor(0, 0, 0)

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
        ("Document owner", doc_ctrl.get("owner", "Akshay (Solutions Lead)")),
        ("Business sponsor", doc_ctrl.get("business_sponsor", "Client Executive")),
        ("Technical lead", doc_ctrl.get("tech_lead", "Thasleema (Lead Architect)")),
        ("Version", doc_ctrl.get("version", "1.0")),
        ("Status", doc_ctrl.get("status", "In review")),
        ("Last updated", doc_ctrl.get("last_updated", datetime.date.today().strftime("%d-%m-%Y"))),
        ("Related documents", doc_ctrl.get("related_docs", "Statement of Work, Pre-Req Tracker"))
    ]
    for k, v in fields:
        row = t1.add_row()
        row.cells[0].text = str(k)
        row.cells[1].text = str(v)
    style_table(t1, [2.2, 4.3])

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
    style_table(t5, [2.0, 4.5])

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
        style_table(t_us, [1.8, 4.7])
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
    style_table(t19_c, [2.0, 4.5])

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
    style_table(t25, [1.8, 4.7])

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
    """Generates the clean, minimal Excel-based Pre-Req Tracker matching exact user template (Category, Title, Description, Requirement Timeline)."""
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Pre-Req Tracker"

    # Exact Color Definitions matching user screenshot
    HEADER_FILL = PatternFill(start_color="C55A11", end_color="C55A11", fill_type="solid")  # Dark rust / orange
    PEACH_FILL = PatternFill(start_color="FBE5D6", end_color="FBE5D6", fill_type="solid")   # Soft peach fill

    WHITE_BOLD_FONT = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    BLACK_BOLD_FONT = Font(name="Calibri", size=10, bold=True, color="000000")
    BLACK_BODY_FONT = Font(name="Calibri", size=10, color="000000")

    BLACK_THIN_SIDE = Side(style='thin', color='000000')
    GRID_BORDER = Border(
        left=BLACK_THIN_SIDE,
        right=BLACK_THIN_SIDE,
        top=BLACK_THIN_SIDE,
        bottom=BLACK_THIN_SIDE
    )

    # 1. Table Column Headers (Row 1)
    headers = [
        ("Category", 32),
        ("Title", 36),
        ("Description", 65),
        ("Requirement Timeline", 26)
    ]

    for col_idx, (hdr_name, col_width) in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col_idx)
        cell.value = hdr_name
        cell.font = WHITE_BOLD_FONT
        cell.fill = HEADER_FILL
        cell.alignment = Alignment(horizontal="left", vertical="center")
        cell.border = GRID_BORDER
        col_letter = get_column_letter(col_idx)
        ws.column_dimensions[col_letter].width = col_width

    ws.row_dimensions[1].height = 26

    # Group items by Category while preserving order
    categorized_items = {}
    for item in items:
        cat = item.get("category") or "General"
        if cat not in categorized_items:
            categorized_items[cat] = []
        categorized_items[cat].append(item)

    current_row = 2

    for cat_name, cat_items in categorized_items.items():
        start_cat_row = current_row
        item_count = len(cat_items)

        for item in cat_items:
            title = item.get("name") or item.get("title") or ""
            desc = (item.get("description") or item.get("expected_evidence") or item.get("details") or "").strip()
            if not desc and title:
                desc = f"Technical clearance, access provisioning, and verification required for {title}."

            # Normalize Requirement Timeline text
            raw_timeline = item.get("due_date") or item.get("requirement_timeline") or "Before development"
            raw_str = str(raw_timeline).strip()
            if "kickoff" in raw_str.lower() or "day-1" in raw_str.lower() or "day 1" in raw_str.lower():
                timeline_str = "Before project kickoff"
            elif "start" in raw_str.lower():
                timeline_str = "Before development starts"
            elif "setup" in raw_str.lower() or "env" in raw_str.lower() or "infra" in raw_str.lower():
                timeline_str = "Before environment setup"
            elif "uat" in raw_str.lower() or "test" in raw_str.lower():
                timeline_str = "Before UAT"
            elif raw_str.startswith("Before"):
                timeline_str = raw_str
            else:
                timeline_str = f"Before {raw_str}"

            # Col A: Category (value populated on first row, merged later)
            c1 = ws.cell(row=current_row, column=1, value=cat_name)
            c1.font = BLACK_BOLD_FONT
            c1.fill = PEACH_FILL
            c1.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
            c1.border = GRID_BORDER

            # Col B: Title
            c2 = ws.cell(row=current_row, column=2, value=title)
            c2.font = BLACK_BOLD_FONT
            c2.fill = PEACH_FILL
            c2.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
            c2.border = GRID_BORDER

            # Col C: Description
            c3 = ws.cell(row=current_row, column=3, value=desc)
            c3.font = BLACK_BODY_FONT
            c3.fill = PEACH_FILL
            c3.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
            c3.border = GRID_BORDER

            # Col D: Requirement Timeline
            c4 = ws.cell(row=current_row, column=4, value=timeline_str)
            c4.font = BLACK_BODY_FONT
            c4.fill = PEACH_FILL
            c4.alignment = Alignment(horizontal="left", vertical="center")
            c4.border = GRID_BORDER

            ws.row_dimensions[current_row].height = 32
            current_row += 1

        end_cat_row = current_row - 1

        # Vertically merge Category cells in Col A if there are multiple items
        if end_cat_row > start_cat_row:
            ws.merge_cells(start_row=start_cat_row, start_column=1, end_row=end_cat_row, end_column=1)
            # Ensure borders apply across all merged cells
            for r in range(start_cat_row, end_cat_row + 1):
                cell = ws.cell(row=r, column=1)
                cell.border = GRID_BORDER
                cell.fill = PEACH_FILL

    # Save to memory buffer
    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    return stream


def generate_brd_html(brd: dict) -> str:
    """Generates a complete, beautiful 1:1 PDF document replica HTML preview string with exact cover page, orange header tables, peach fills, and 12-page structure."""
    logo_base64 = ""
    logo_path = os.path.join(os.path.dirname(__file__), "goml_logo.png")
    ensure_goml_logo(logo_path)
    if os.path.exists(logo_path):
        import base64
        with open(logo_path, "rb") as f:
            logo_base64 = base64.b64encode(f.read()).decode("utf-8")

    logo_img = f'<img src="data:image/png;base64,{logo_base64}" style="height: 34px; object-fit: contain;" alt="goML Logo" />' if logo_base64 else '<span style="font-weight: 800; font-size: 18px; color: #ED7D31;">goML</span>'

    doc_ctrl = brd.get("section_1_doc_control", {})
    exec_summary = brd.get("section_2_executive_summary", "This project delivers an enterprise-grade POC Build for Haletale. The system addresses operational latency and data integration barriers by providing automated workflows, secure API handshakes, and Day-1 verified architecture. Target delivery enables seamless kick-off with zero unvetted prerequisites.")
    bg = brd.get("section_3_background", {})
    objectives = brd.get("section_4_objectives", [])
    scope = brd.get("section_5_scope", {})
    stakeholders = brd.get("section_6_stakeholders", {})
    current_future = brd.get("section_7_current_future_state", {})
    biz_reqs = brd.get("section_8_business_requirements", [])
    func_reqs = brd.get("section_9_functional_requirements", {})
    biz_rules = brd.get("section_10_business_rules", [])
    data_reqs = brd.get("section_11_data_requirements", {})
    ui_reqs = brd.get("section_12_ui_requirements", {})
    integrations = brd.get("section_13_integrations", [])
    notifications = brd.get("section_14_notifications", [])
    reporting = brd.get("section_15_reporting", [])
    nfr = brd.get("section_16_non_functional_requirements", {})
    edge_cases = brd.get("section_17_edge_cases", [])
    security = brd.get("section_18_security", {})
    assumptions = brd.get("section_19_assumptions_constraints", {})
    risks = brd.get("section_20_risks", [])
    test_scenarios = brd.get("section_21_test_scenarios", [])
    traceability = brd.get("section_22_traceability", [])
    milestones = brd.get("section_23_milestones", [])
    questions = brd.get("section_24_open_questions", [])
    glossary = brd.get("section_25_glossary", [])
    appendices = brd.get("section_26_appendices", [])
    signoff = brd.get("section_27_signoff", [])

    proj_name = brd.get('project_name', 'Chatbot Optimisation, Guided Workflows, and Credit Wallet System for Haletale')
    version = brd.get('version', '1.0')
    date_str = brd.get('date', datetime.date.today().strftime('%d-%m-%Y'))
    status = brd.get('status', 'In review')
    prepared_by = brd.get('prepared_by', 'Akshay & Thasleema, Principal Solutions Analysts')

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{proj_name} — Business Requirements Document</title>
  <style>
    @page {{
      size: A4;
      margin: 0;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      background-color: #525659;
      margin: 0;
      padding: 30px 0;
      font-family: Arial, Helvetica, sans-serif;
      color: #000000;
      line-height: 1.45;
    }}
    .page {{
      width: 210mm;
      min-height: 297mm;
      padding: 20mm 20mm 20mm 20mm;
      margin: 0 auto 30px auto;
      background: #FFFFFF;
      box-shadow: 0 10px 30px rgba(0,0,0,0.35);
      position: relative;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }}
    @media print {{
      body {{ background: white; padding: 0; }}
      .page {{ margin: 0; box-shadow: none; page-break-after: always; width: 100%; min-height: 100vh; }}
    }}
    .header-logo {{
      display: flex;
      justify-content: flex-end;
      align-items: center;
      margin-bottom: 20px;
    }}
    .footer {{
      border-top: 1px solid #CBD5E1;
      padding-top: 8px;
      margin-top: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #475569;
    }}
    h1.cover-title {{
      color: #C55A11;
      font-size: 28px;
      font-weight: bold;
      margin: 80px 0 15px 0;
      text-align: center;
    }}
    h2.cover-subtitle {{
      color: #C55A11;
      font-size: 16px;
      font-weight: bold;
      margin: 0 0 35px 0;
      text-align: center;
      line-height: 1.4;
    }}
    .cover-meta {{
      text-align: center;
      font-size: 13px;
      color: #000000;
      margin-bottom: 6px;
    }}
    .cover-notice {{
      background-color: #FBE5D6;
      border: 1pt solid #000000;
      padding: 16px 20px;
      margin: 60px auto 0 auto;
      width: 92%;
      font-size: 12px;
      line-height: 1.5;
      color: #000000;
      text-align: left;
    }}
    h2 {{
      color: #C55A11;
      font-size: 16px;
      font-weight: bold;
      margin-top: 22px;
      margin-bottom: 10px;
    }}
    h3 {{
      color: #ED7D31;
      font-size: 13.5px;
      font-weight: bold;
      margin-top: 14px;
      margin-bottom: 8px;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 12px;
    }}
    th {{
      background-color: #ED7D31;
      color: #000000;
      font-weight: bold;
      padding: 8px 10px;
      border: 1pt solid #000000;
      font-size: 11.5px;
      text-align: left;
      text-transform: uppercase;
    }}
    td {{
      padding: 8px 10px;
      border: 1pt solid #000000;
      font-size: 11.5px;
      vertical-align: middle;
      color: #000000;
      background-color: #FFFFFF;
    }}
    td.kv-label {{
      background-color: #FBE5D6;
      font-weight: bold;
      width: 32%;
    }}
    td.kv-value {{
      background-color: #FFFFFF;
    }}
    tr.alt-row td {{
      background-color: #FBE5D6;
    }}
    ul {{
      margin: 4px 0 12px 0;
      padding-left: 20px;
      font-size: 12.5px;
    }}
    li {{
      margin-bottom: 5px;
    }}
    .badge-raci {{
      background: #000000;
      color: #FFFFFF;
      padding: 2px 8px;
      border-radius: 3px;
      font-weight: bold;
      font-size: 11px;
    }}
  </style>
</head>
<body>

  <!-- PAGE 1: COVER PAGE -->
  <div class="page" id="page-1">
    <div>
      <div class="header-logo">
        {logo_img}
      </div>

      <h1 class="cover-title">Business Requirements Document</h1>
      <h2 class="cover-subtitle">[{proj_name}]</h2>

      <div class="cover-meta">Version [{version}] | [{date_str}] | Status: [{status}]</div>
      <div class="cover-meta">Prepared by [{prepared_by}]</div>

      <div class="cover-notice">
        <strong style="color: #000000; display: block; margin-bottom: 4px; font-size: 11.5px; text-transform: uppercase;">
          DOCUMENT GUIDANCE NOTICE:
        </strong>
        This Business Requirements Document was automatically extracted and structured strictly from the project proposal. It specifies all functional, technical, non-functional, and prerequisite requirements. Internal approval by Akshay &amp; Thasleema is required before external distribution.
      </div>
    </div>

    <div class="footer">
      <span>goML PreQ | Business Requirements Document</span>
      <span style="font-weight: bold; color: #C55A11;">Page 1 of 12</span>
    </div>
  </div>

  <!-- PAGE 2: 1. DOCUMENT CONTROL -->
  <div class="page" id="page-2">
    <div>
      <div class="header-logo">
        {logo_img}
      </div>

      <h2>1. Document control</h2>
      <table>
        <thead>
          <tr><th>Field</th><th>Details</th></tr>
        </thead>
        <tbody>
          <tr><td class="kv-label">Project name</td><td class="kv-value">{doc_ctrl.get("project_name", proj_name)}</td></tr>
          <tr><td class="kv-label">Project / ticket ID</td><td class="kv-value">{doc_ctrl.get("ticket_id", "PRJ-2026-CHA")}</td></tr>
          <tr><td class="kv-label">Document owner</td><td class="kv-value">{doc_ctrl.get("owner", "Akshay (AI Solutions Lead)")}</td></tr>
          <tr><td class="kv-label">Business sponsor</td><td class="kv-value">{doc_ctrl.get("business_sponsor", "Haletale Executive AI Sponsor")}</td></tr>
          <tr><td class="kv-label">Technical lead</td><td class="kv-value">{doc_ctrl.get("tech_lead", "Thasleema (Lead AI Architect)")}</td></tr>
          <tr><td class="kv-label">Version</td><td class="kv-value">{doc_ctrl.get("version", version)}</td></tr>
          <tr><td class="kv-label">Status</td><td class="kv-value">{doc_ctrl.get("status", status)}</td></tr>
          <tr><td class="kv-label">Last updated</td><td class="kv-value">{doc_ctrl.get("last_updated", date_str)}</td></tr>
          <tr><td class="kv-label">Related documents</td><td class="kv-value">Statement of Work, Architecture Specification, Pre-Req Tracker</td></tr>
        </tbody>
      </table>

      <h3>Revision history</h3>
      <table>
        <thead>
          <tr><th>Version</th><th>Date</th><th>Author</th><th>Summary of changes</th></tr>
        </thead>
        <tbody>
          <tr><td>0.1</td><td>{date_str}</td><td>Akshay</td><td>Initial proposal extraction</td></tr>
          <tr><td>1.0</td><td>{date_str}</td><td>Thasleema</td><td>Structured BRD baseline</td></tr>
        </tbody>
      </table>

      <h3>Reviewers and approvers</h3>
      <table>
        <thead>
          <tr><th>Name</th><th>Role</th><th>Responsibility</th><th>Approval date</th></tr>
        </thead>
        <tbody>
          {''.join([f"<tr><td>{r.get('name', 'Haletale Sponsor')}</td><td>{r.get('role', 'Executive AI Sponsor')}</td><td>{r.get('responsibility', 'Approver')}</td><td>{r.get('approval_date', 'Pending')}</td></tr>" for r in doc_ctrl.get("reviewers", [
            {"name": "Haletale Sponsor", "role": "Executive AI Sponsor", "responsibility": "Approver", "approval_date": "Pending"},
            {"name": "Akshay", "role": "AI Solutions Lead", "responsibility": "Approver", "approval_date": date_str},
            {"name": "Thasleema", "role": "Lead AI Architect", "responsibility": "Reviewer", "approval_date": date_str},
            {"name": "AI Governance Auditor", "role": "AI Safety Lead", "responsibility": "Reviewer", "approval_date": "Pending"}
          ])])}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <span>goML PreQ | Business Requirements Document</span>
      <span style="font-weight: bold; color: #C55A11;">Page 2 of 12</span>
    </div>
  </div>

  <!-- PAGE 3: OBJECTIVES & SCOPE -->
  <div class="page" id="page-3">
    <div>
      <div class="header-logo">
        {logo_img}
      </div>

      <h2>2. Executive summary</h2>
      <p style="font-size: 12.5px; line-height: 1.6; margin-bottom: 16px;">
        {exec_summary}
      </p>

      <h2>3. Background and problem statement</h2>
      <ul style="list-style-type: disc;">
        <li><strong>Problem:</strong> {bg.get('problem', 'Existing manual and fragmented workflows lead to delivery bottlenecks and uncoordinated environment access.')}</li>
        <li><strong>Business impact:</strong> {bg.get('business_impact', 'Operational delays, lack of visibility into technical gatekeepers, and risk of delayed sprint kick-offs.')}</li>
        <li><strong>Root cause:</strong> {bg.get('root_cause', 'Absence of structured prerequisite governance and automated requirement traceability prior to development.')}</li>
        <li><strong>Why now:</strong> {bg.get('why_now', 'Immediate business need to launch production capabilities within the target schedule.')}</li>
      </ul>

      <h2>4. Business objectives and success metrics</h2>
      <table>
        <thead>
          <tr><th>ID</th><th>Objective</th><th>KPI</th><th>Baseline</th><th>Target</th><th>Measured by</th><th>Date</th></tr>
        </thead>
        <tbody>
          {''.join([f"<tr><td><strong>{o.get('id', 'OBJ-01')}</strong></td><td>{o.get('objective', o.get('description', 'Achieve 100% Day-1 prerequisite clearance'))}</td><td>{o.get('kpi', '% Gatekeepers Verified')}</td><td>{o.get('baseline', '0%')}</td><td><strong>{o.get('target', '100%')}</strong></td><td>{o.get('measured_by', 'PreQ Dashboard')}</td><td>{o.get('date', date_str)}</td></tr>" for o in (objectives if isinstance(objectives, list) and len(objectives)>0 else [
            {"id": "OBJ-01", "objective": "Achieve 100% Day-1 prerequisite clearance", "kpi": "% Gatekeepers Verified", "baseline": "0%", "target": "100%", "measured_by": "PreQ Dashboard", "date": date_str},
            {"id": "OBJ-02", "objective": "Automate core integration workflows", "kpi": "Transaction latency", "baseline": "Manual", "target": "< 500ms", "measured_by": "Telemetry", "date": date_str}
          ])])}
        </tbody>
      </table>

      <h2>5. Scope</h2>
      <h3>In scope</h3>
      <ul style="list-style-type: disc;">
        <li>Core POC Build implementation</li>
        <li>API and database integration with staging environments</li>
        <li>Automated validation and verification telemetry</li>
        <li>Security compliance, IAM role provisioning, and key masking</li>
      </ul>

      <h3>Out of scope</h3>
      <ul style="list-style-type: disc;">
        <li>Unrelated legacy system deprecation</li>
        <li>Production hardware provisioning outside cloud tenant</li>
      </ul>

      <h3>Platforms and environments</h3>
      <table>
        <thead>
          <tr><th>Item</th><th>Details</th></tr>
        </thead>
        <tbody>
          <tr><td class="kv-label">Platforms</td><td class="kv-value">Cloud Infrastructure (AWS/GCP/Azure), Web Application</td></tr>
          <tr><td class="kv-label">Supported browsers</td><td class="kv-value">Latest versions of Chrome, Safari, Edge, Firefox</td></tr>
          <tr><td class="kv-label">Languages / locales</td><td class="kv-value">English (Primary)</td></tr>
          <tr><td class="kv-label">Environments</td><td class="kv-value">DEV -&gt; QA -&gt; STAGING -&gt; PROD</td></tr>
        </tbody>
      </table>
    </div>

    <div class="footer">
      <span>goML PreQ | Business Requirements Document</span>
      <span style="font-weight: bold; color: #C55A11;">Page 3 of 12</span>
    </div>
  </div>

  <!-- PAGE 4: STAKEHOLDERS & USER ROLES -->
  <div class="page" id="page-4">
    <div>
      <div class="header-logo">
        {logo_img}
      </div>

      <h2>6. Stakeholders and user roles</h2>
      <h3>6.1 Stakeholders (RACI)</h3>
      <table>
        <thead>
          <tr><th>Name</th><th>Role / department</th><th>Interest</th><th>RACI</th></tr>
        </thead>
        <tbody>
          <tr><td>Haletale Executive AI Sponsor</td><td>Business Sponsor</td><td>GenAI Strategy &amp; Outcomes</td><td><span class="badge-raci">A</span></td></tr>
          <tr><td>Akshay</td><td>AI Solutions Lead</td><td>RAG &amp; LLM Requirement Definition</td><td><span class="badge-raci">R</span></td></tr>
          <tr><td>Thasleema</td><td>Lead AI Architect</td><td>Model Architecture &amp; Pipeline</td><td><span class="badge-raci">R</span></td></tr>
          <tr><td>AI Safety &amp; Compliance Officer</td><td>AI Governance Auditor</td><td>Model Safety &amp; Zero Data Exposure</td><td><span class="badge-raci">C</span></td></tr>
        </tbody>
      </table>

      <h3>6.2 System user roles</h3>
      <table>
        <thead>
          <tr><th>Role</th><th>Description</th><th>How they access</th><th>Approx. users</th></tr>
        </thead>
        <tbody>
          <tr><td>LLM &amp; Prompt Engineer</td><td>Constructs and tunes retrieval workflows, system prompts, and vector embeddings</td><td>AI Workbench Console</td><td>8</td></tr>
          <tr><td>Model Evaluation Reviewer</td><td>Audits model output accuracy, latency metrics, and hallucination scores</td><td>Eval &amp; Analytics Portal</td><td>4</td></tr>
          <tr><td>Enterprise Operator / End User</td><td>Interacts with automated AI assistants and multi-agent workflows</td><td>Web App / REST API</td><td>250</td></tr>
        </tbody>
      </table>

      <h2>7. Current state and future state</h2>
      <h3>7.1 Current state (as-is)</h3>
      <ol style="padding-left: 20px; font-size: 12.5px; margin-bottom: 8px;">
        <li style="margin-bottom: 4px;">Stakeholders exchange credentials and requirements over unstructured email/chat threads.</li>
        <li style="margin-bottom: 4px;">Engineers discover missing access permissions during active sprint cycles.</li>
        <li style="margin-bottom: 4px;">Sprints stall pending third-party API quotas and database whitelisting.</li>
      </ol>
      <p style="font-size: 12px; font-style: italic; color: #475569; margin-top: 4px;">
        Pain points: No single source of truth, Missing security masking, Unpredictable kick-off delays
      </p>
    </div>

    <div class="footer">
      <span>goML PreQ | Business Requirements Document</span>
      <span style="font-weight: bold; color: #C55A11;">Page 4 of 12</span>
    </div>
  </div>

  <!-- PAGE 5: FUTURE STATE & BUSINESS REQUIREMENTS -->
  <div class="page" id="page-5">
    <div>
      <div class="header-logo">
        {logo_img}
      </div>

      <h3>7.2 Future state (to-be) process flow</h3>
      <table>
        <thead>
          <tr><th>Step</th><th>Actor</th><th>Action</th><th>System behaviour</th><th>Next step</th></tr>
        </thead>
        <tbody>
          <tr><td>1</td><td>Client Lead</td><td>Uploads proposal / SOW</td><td>AI extracts 27-section BRD and minimal tracker</td><td>2</td></tr>
          <tr><td>2</td><td>Akshay / Thasleema</td><td>Review tracker internally</td><td>Sets review status to Approved</td><td>3</td></tr>
          <tr><td>3</td><td>Client Sponsor</td><td>Submits proof / credentials</td><td>Zero-exposure masking and instant verification</td><td>End</td></tr>
        </tbody>
      </table>

      <h3>7.3 Gap analysis</h3>
      <table>
        <thead>
          <tr><th>Area</th><th>Current</th><th>Future</th><th>Gap to close</th></tr>
        </thead>
        <tbody>
          <tr><td>Process</td><td>Manual email handovers</td><td>Automated PreQ portal</td><td>Implement centralized tracker</td></tr>
          <tr><td>Security</td><td>Plaintext secret sharing</td><td>Cryptographic masking</td><td>Vault &amp; zero-exposure integration</td></tr>
        </tbody>
      </table>

      <h2>8. Business requirements</h2>
      <table>
        <thead>
          <tr><th>ID</th><th>Business requirement</th><th>Priority</th><th>Objective</th><th>Owner</th></tr>
        </thead>
        <tbody>
          {''.join([f"<tr><td><strong>{br_item.get('id', f'BR-0{i+1}')}</strong></td><td>{br_item.get('requirement', br_item.get('title', 'All prerequisite access credentials must be verified 48h before kick-off'))}</td><td>Must</td><td>OBJ-01</td><td>{br_item.get('owner', 'Akshay')}</td></tr>" for i, br_item in enumerate(biz_reqs if isinstance(biz_reqs, list) and len(biz_reqs)>0 else [
            {"id": "BR-01", "requirement": "All prerequisite access credentials must be verified 48h before kick-off", "owner": "Akshay"},
            {"id": "BR-02", "requirement": "System must support real-time status and audit logging", "owner": "Thasleema"}
          ])])}
        </tbody>
      </table>

      <h2>9. Functional requirements</h2>
      <h3>9.1 Functional requirements list</h3>
      <table>
        <thead>
          <tr><th>ID</th><th>Requirement ("The system shall...")</th><th>Priority</th><th>Traces to</th><th>User story</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>FR-01</strong></td><td>The system shall ingest proposal documents (DOCX, PPTX, PDF) and extract structured requirements.</td><td>Must</td><td>BR-01</td><td>US-01</td></tr>
          <tr><td><strong>FR-02</strong></td><td>The system shall enforce internal review by Akshay &amp; Thasleema prior to external client sharing.</td><td>Must</td><td>BR-01</td><td>US-02</td></tr>
        </tbody>
      </table>
    </div>

    <div class="footer">
      <span>goML PreQ | Business Requirements Document</span>
      <span style="font-weight: bold; color: #C55A11;">Page 5 of 12</span>
    </div>
  </div>

  <!-- PAGE 6: USER STORIES & BUSINESS RULES -->
  <div class="page" id="page-6">
    <div>
      <div class="header-logo">
        {logo_img}
      </div>

      <h3>9.2 User stories and acceptance criteria</h3>
      <p style="font-size: 13px; font-weight: bold; margin-bottom: 8px;">User Story: US-01 - Automated Proposal Ingestion</p>
      <table>
        <thead>
          <tr><th style="width: 32%;">Field</th><th>Details</th></tr>
        </thead>
        <tbody>
          <tr><td style="background: #FBE5D6; font-weight: bold;">User story</td><td>As an engineering lead, I want to upload a proposal so that requirements and prerequisites are automatically mapped.</td></tr>
          <tr><td style="background: #FFFFFF; font-weight: bold;">Linked FR</td><td>FR-01</td></tr>
          <tr><td style="background: #FBE5D6; font-weight: bold;">Priority / estimate</td><td>Must / 5 pts</td></tr>
          <tr><td style="background: #FFFFFF; font-weight: bold;">Acceptance criteria</td><td>AC1 - Given a valid DOCX, PPTX or PDF file, when uploaded, then the system extracts text and generates the BRD within 10 seconds.<br/>AC2 - Given unreadable or empty files, when uploaded, then clear validation feedback is returned.</td></tr>
          <tr><td style="background: #FBE5D6; font-weight: bold;">Out of scope for this story</td><td>Manual OCR of physical paper documents</td></tr>
        </tbody>
      </table>

      <h2>10. Business rules and validations</h2>
      <table>
        <thead>
          <tr><th>Rule ID</th><th>Rule</th><th>Condition</th><th>Outcome</th><th>Configurable?</th><th>Error code</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>BRL-01</strong></td><td>Internal Review Gate</td><td>Tracker generated from proposal</td><td>Lock external sharing until Akshay &amp; Thasleema approve</td><td>No</td><td><code>E-REV-01</code></td></tr>
          <tr><td><strong>BRL-02</strong></td><td>Zero Plaintext Secrets</td><td>Secret key or token entered</td><td>Mask and store securely</td><td>No</td><td><code>E-SEC-02</code></td></tr>
        </tbody>
      </table>

      <h2>11. Data requirements</h2>
      <h3>11.1 Key entities</h3>
      <table>
        <thead>
          <tr><th>Entity</th><th>Description</th><th>Key relationships</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>Project</strong></td><td>Core initiative entity</td><td>1 Project -&gt; Many ChecklistItems</td></tr>
          <tr><td><strong>ChecklistItem</strong></td><td>Prerequisite milestone</td><td>Belongs to 1 Project</td></tr>
        </tbody>
      </table>
    </div>

    <div class="footer">
      <span>goML PreQ | Business Requirements Document</span>
      <span style="font-weight: bold; color: #C55A11;">Page 6 of 12</span>
    </div>
  </div>

  <!-- PAGE 7: DATA DICTIONARY & UI REQUIREMENTS -->
  <div class="page" id="page-7">
    <div>
      <div class="header-logo">
        {logo_img}
      </div>

      <h3>11.2 Data dictionary</h3>
      <table>
        <thead>
          <tr><th>Field</th><th>Entity</th><th>Type</th><th>Format</th><th>Req?</th><th>Validation</th><th>Example</th></tr>
        </thead>
        <tbody>
          <tr><td><code>name</code></td><td>ChecklistItem</td><td>String</td><td>Text (1-255 chars)</td><td>Yes</td><td>Non-empty string</td><td>MySQL Read-Only Credentials</td></tr>
          <tr><td><code>status</code></td><td>ChecklistItem</td><td>Enum</td><td>Pending | Submitted | Verified</td><td>Yes</td><td>Valid status enum</td><td>Pending</td></tr>
        </tbody>
      </table>

      <h3>11.3 Data retention, migration and privacy</h3>
      <ul style="list-style-type: disc;">
        <li><strong>Retention:</strong> Active project artifacts retained throughout engagement lifecycle; logs retained 7 years.</li>
        <li><strong>Sensitive fields:</strong> API keys, database passwords, IAM role credentials (encrypted at rest).</li>
        <li><strong>Data migration:</strong> Direct ingestion from structured proposals.</li>
      </ul>

      <h2>12. User interface requirements</h2>
      <table>
        <thead>
          <tr><th>Screen ID</th><th>Screen name</th><th>Role</th><th>Key fields / components</th><th>Actions</th><th>Wireframe</th></tr>
        </thead>
        <tbody>
          <tr><td>SCR-01</td><td>Proposal Upload &amp; Ingestion</td><td>Lead Architect</td><td>Dropzone, file picker, parse status</td><td>Upload, Analyze, Generate</td><td>CreateProject.jsx</td></tr>
          <tr><td>SCR-02</td><td>Minimal Pre-Req Tracker View</td><td>Solutions Team</td><td>Milestone list, internal review badge, export button</td><td>Review, Approve, Export Excel</td><td>ProjectDashboard.jsx</td></tr>
        </tbody>
      </table>
      <p style="font-size: 11.5px; color: #475569; margin-top: 4px;">
        Screen states: Loading, parsed, reviewing, approved, error<br/>
        Responsive breakpoints: 360px (mobile), 768px (tablet), 1280px (desktop), 1920px (ultrawide)
      </p>

      <h2>13. Integration and API requirements</h2>
      <table>
        <thead>
          <tr><th>ID</th><th>System</th><th>Direction</th><th>Protocol</th><th>Trigger</th><th>Auth</th><th>Timeout/retry</th></tr>
        </thead>
        <tbody>
          <tr><td>INT-01</td><td>Groq LLM Engine</td><td>Outbound</td><td>REST / JSON</td><td>Proposal upload</td><td>API Key</td><td>30s / 2 retries</td></tr>
          <tr><td>INT-02</td><td>PostgreSQL Database</td><td>Inbound/Outbound</td><td>SQL / TLS</td><td>On state change</td><td>Database connection pool</td><td>5s</td></tr>
        </tbody>
      </table>
    </div>

    <div class="footer">
      <span>goML PreQ | Business Requirements Document</span>
      <span style="font-weight: bold; color: #C55A11;">Page 7 of 12</span>
    </div>
  </div>

  <!-- PAGE 8: NOTIFICATIONS, REPORTING & NFR -->
  <div class="page" id="page-8">
    <div>
      <div class="header-logo">
        {logo_img}
      </div>

      <h2>14. Notifications</h2>
      <table>
        <thead>
          <tr><th>ID</th><th>Trigger event</th><th>Channel</th><th>Recipient</th><th>Content summary</th><th>Template ref</th></tr>
        </thead>
        <tbody>
          <tr><td>NTF-01</td><td>Tracker generated</td><td>In-app Alert</td><td>Akshay &amp; Thasleema</td><td>New proposal analyzed and ready for internal review</td><td>TPL-REV-01</td></tr>
          <tr><td>NTF-02</td><td>Evidence submitted</td><td>Dashboard &amp; Webhook</td><td>Engineering Team</td><td>Milestone evidence submitted for review</td><td>TPL-EVI-02</td></tr>
        </tbody>
      </table>

      <h2>15. Reporting and analytics</h2>
      <table>
        <thead>
          <tr><th>Report / event</th><th>Audience</th><th>Content / metrics</th><th>Frequency</th><th>Format</th></tr>
        </thead>
        <tbody>
          <tr><td>Pre-Req Executive Readiness Index</td><td>Leadership &amp; Sponsors</td><td>% Cleared, Blockers Remaining</td><td>Realtime</td><td>Interactive Dashboard</td></tr>
          <tr><td>Minimal Pre-Req Tracker Spreadsheet</td><td>Delivery Team</td><td>Milestones, Owners, SLAs, Statuses</td><td>On-demand</td><td>Excel (.xlsx)</td></tr>
        </tbody>
      </table>

      <h2>16. Non-functional requirements</h2>
      <table>
        <thead>
          <tr><th>ID</th><th>Category</th><th>Requirement</th><th>Measure / target</th></tr>
        </thead>
        <tbody>
          <tr><td>NFR-01</td><td>Performance</td><td>Proposal parsing and tracker generation within 5s</td><td>&lt; 5.0s</td></tr>
          <tr><td>NFR-02</td><td>Capacity / Scalability</td><td>Support concurrent proposal document parsing</td><td>100 concurrent</td></tr>
          <tr><td>NFR-03</td><td>Availability</td><td>Cloud service uptime</td><td>99.9%</td></tr>
          <tr><td>NFR-04</td><td>Security</td><td>Zero-exposure key masking &amp; TLS 1.3 encryption</td><td>AES-256 / TLS 1.3</td></tr>
        </tbody>
      </table>
    </div>

    <div class="footer">
      <span>goML PreQ | Business Requirements Document</span>
      <span style="font-weight: bold; color: #C55A11;">Page 8 of 12</span>
    </div>
  </div>

  <!-- PAGE 9: ERROR HANDLING & SECURITY -->
  <div class="page" id="page-9">
    <div>
      <div class="header-logo">
        {logo_img}
      </div>

      <table>
        <thead>
          <tr><th>ID</th><th>Category</th><th>Requirement</th><th>Measure / target</th></tr>
        </thead>
        <tbody>
          <tr><td>NFR-05</td><td>Compliance</td><td>Proposal confidentiality and access controls</td><td>SOC2 Type II</td></tr>
          <tr><td>NFR-06</td><td>Accessibility</td><td>Accessible web dashboard contrast and controls</td><td>WCAG 2.1 AA</td></tr>
          <tr><td>NFR-07</td><td>Audit Logging</td><td>Complete audit trail of reviews and approvals</td><td>Retained 7 years</td></tr>
          <tr><td>NFR-08</td><td>Backup / Recovery</td><td>Automated snapshotting and recovery</td><td>RPO 15m, RTO 1h</td></tr>
          <tr><td>NFR-09</td><td>Monitoring</td><td>Application telemetry and health probe</td><td>99.9% health check</td></tr>
        </tbody>
      </table>

      <h2>17. Error handling and edge cases</h2>
      <table>
        <thead>
          <tr><th>Error code</th><th>Scenario</th><th>User-facing message</th><th>System behaviour</th></tr>
        </thead>
        <tbody>
          <tr><td>E-DOC-01</td><td>Corrupted or password-protected file</td><td>Unable to read document. Please upload an unprotected DOCX, PPTX or PDF.</td><td>Reject file gracefully</td></tr>
          <tr><td>E-REV-02</td><td>Attempting external sync before review</td><td>Tracker requires internal approval by Akshay &amp; Thasleema before external dispatch.</td><td>Halt external sharing</td></tr>
        </tbody>
      </table>
      <h3>Edge cases to handle</h3>
      <ul style="list-style-type: disc;">
        <li>User uploads slides containing only diagrams -&gt; extract shape metadata and OCR text</li>
        <li>Proposal contains multi-cloud hybrid requirements -&gt; split into discrete cloud prerequisite tracks</li>
      </ul>

      <h2>18. Security and compliance requirements</h2>
      <ul style="list-style-type: disc;">
        <li><strong>Authentication:</strong> Role-based access with session tokens and secure credential vaults</li>
        <li><strong>Session:</strong> 30-minute idle timeout for administrative sessions</li>
        <li><strong>Data masking:</strong> All uploaded API keys and connection strings masked with zero-exposure hashes</li>
        <li><strong>Consent:</strong> Formal internal review sign-off by Akshay &amp; Thasleema</li>
        <li><strong>Security testing:</strong> Automated vulnerability scanning and dependency auditing</li>
      </ul>
    </div>

    <div class="footer">
      <span>goML PreQ | Business Requirements Document</span>
      <span style="font-weight: bold; color: #C55A11;">Page 9 of 12</span>
    </div>
  </div>

  <!-- PAGE 10: ASSUMPTIONS, CONSTRAINTS & RISKS -->
  <div class="page" id="page-10">
    <div>
      <div class="header-logo">
        {logo_img}
      </div>

      <h2>19. Assumptions, constraints and dependencies</h2>
      <h3>Assumptions</h3>
      <ul style="list-style-type: disc;">
        <li>Uploaded proposals accurately reflect agreed architectural scope.</li>
        <li>Client stakeholders have authority to provision requested staging credentials.</li>
      </ul>

      <h3>Constraints</h3>
      <table>
        <thead>
          <tr><th>Type</th><th>Constraint</th></tr>
        </thead>
        <tbody>
          <tr><td class="kv-label">Process</td><td class="kv-value">Generated tracker must NOT be sent directly to client without internal review.</td></tr>
          <tr><td class="kv-label">Format</td><td class="kv-value">BRD must strictly follow the 27-section template format.</td></tr>
        </tbody>
      </table>

      <h3>Dependencies</h3>
      <table>
        <thead>
          <tr><th>ID</th><th>Dependency</th><th>Owner</th><th>Needed by</th></tr>
        </thead>
        <tbody>
          <tr><td>DEP-01</td><td>Proposal document upload</td><td>Sales / Delivery Lead</td><td>Day -10</td></tr>
          <tr><td>DEP-02</td><td>Internal review sign-off</td><td>Akshay &amp; Thasleema</td><td>Day -7</td></tr>
        </tbody>
      </table>

      <h2>20. Risks</h2>
      <table>
        <thead>
          <tr><th>ID</th><th>Risk</th><th>Likelihood</th><th>Impact</th><th>Mitigation</th><th>Owner</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>R-MISS-01</strong></td><td>Inadequate Requirement Specification: SOW lacks formal API rate-limit, throughput SLA, and timeout definitions for integrated endpoints.</td><td>High</td><td>High</td><td>Establish mandatory SLA contracts during Sprint 0 kick-off and configure real-time telemetry alerts.</td><td>Akshay</td></tr>
          <tr><td><strong>R-MISS-03</strong></td><td>Inadequate Security Governance: Absence of zero-exposure credential masking and secrets vault protocols in SOW requirements.</td><td>Medium</td><td>High</td><td>Enforce mandatory PreQ cryptographic key masking and role-based access control before credential dispatch.</td><td>Thasleema</td></tr>
          <tr><td><strong>R-MISS-04</strong></td><td>Missing Non-Functional Requirement: Unstated Disaster Recovery RPO/RTO parameters and environment failover strategy.</td><td>Medium</td><td>Medium</td><td>Define automated database snapshotting (RPO 15m) and blue/green deployment strategy in Section 16 NFRs.</td><td>Akshay</td></tr>
        </tbody>
      </table>
    </div>

    <div class="footer">
      <span>goML PreQ | Business Requirements Document</span>
      <span style="font-weight: bold; color: #C55A11;">Page 10 of 12</span>
    </div>
  </div>

  <!-- PAGE 11: TEST SCENARIOS & TRACEABILITY -->
  <div class="page" id="page-11">
    <div>
      <div class="header-logo">
        {logo_img}
      </div>

      <h2>21. Test scenarios and UAT</h2>
      <table>
        <thead>
          <tr><th>Test ID</th><th>Scenario</th><th>Steps (summary)</th><th>Expected result</th><th>Traces to</th></tr>
        </thead>
        <tbody>
          <tr><td>TC-01</td><td>Verify DOCX/PPTX proposal upload</td><td>Upload document -&gt; Verify text extraction</td><td>27-section BRD and minimal tracker generated</td><td>US-01</td></tr>
          <tr><td>TC-02</td><td>Verify internal review workflow</td><td>Click approve by Akshay &amp; Thasleema</td><td>Tracker status updates to Approved</td><td>US-02</td></tr>
        </tbody>
      </table>
      <p style="font-size: 11.5px; color: #475569; margin-top: 4px;">
        • UAT Entry Criteria: All unit tests passing and proposal parser validated against sample documents<br/>
        • UAT Exit Criteria: Successful generation and export of both .docx BRD and .xlsx tracker
      </p>

      <h2>22. Requirements traceability matrix</h2>
      <table>
        <thead>
          <tr><th>Objective</th><th>Business req.</th><th>Functional req.</th><th>User story</th><th>Business rule</th><th>Test case</th><th>Status</th></tr>
        </thead>
        <tbody>
          <tr><td>OBJ-01</td><td>BR-01</td><td>FR-01</td><td>US-01</td><td>BRL-01</td><td>TC-01</td><td><strong style="color: #166534;">Passed</strong></td></tr>
          <tr><td>OBJ-02</td><td>BR-02</td><td>FR-02</td><td>US-02</td><td>BRL-02</td><td>TC-02</td><td><strong style="color: #166534;">Passed</strong></td></tr>
        </tbody>
      </table>

      <h2>23. Release plan and milestones</h2>
      <table>
        <thead>
          <tr><th>Milestone</th><th>Target date</th><th>Exit criteria</th></tr>
        </thead>
        <tbody>
          <tr><td>Proposal Analysis &amp; BRD Generation</td><td>Day -10</td><td>27-section BRD ready</td></tr>
          <tr><td>Internal Review (Akshay &amp; Thasleema)</td><td>Day -7</td><td>Internal sign-off complete</td></tr>
          <tr><td>Prerequisite Delivery &amp; Verification</td><td>Day -2</td><td>100% Day-1 blockers cleared</td></tr>
          <tr><td>Sprint Kick-off</td><td>Day 0</td><td>Architecture sprint 0 launch</td></tr>
        </tbody>
      </table>

      <h2>24. Open questions and decisions log</h2>
      <table>
        <thead>
          <tr><th>ID</th><th>Question / decision</th><th>Raised by</th><th>Owner</th><th>Due</th><th>Status / answer</th></tr>
        </thead>
        <tbody>
          <tr><td>Q-01</td><td>Are client staging RDS instances accessible via VPC peering or static NAT EIP?</td><td>Thasleema</td><td>Client DevOps Lead</td><td>Day -7</td><td>Open</td></tr>
        </tbody>
      </table>
    </div>

    <div class="footer">
      <span>goML PreQ | Business Requirements Document</span>
      <span style="font-weight: bold; color: #C55A11;">Page 11 of 12</span>
    </div>
  </div>

  <!-- PAGE 12: GLOSSARY, APPENDICES & SIGN-OFF -->
  <div class="page" id="page-12">
    <div>
      <div class="header-logo">
        {logo_img}
      </div>

      <h2>25. Glossary</h2>
      <table>
        <thead>
          <tr><th>Term</th><th>Definition</th></tr>
        </thead>
        <tbody>
          <tr><td class="kv-label">BRD</td><td class="kv-value">Business Requirements Document</td></tr>
          <tr><td class="kv-label">PreQ</td><td class="kv-value">Pre-requisite Verification &amp; Readiness Platform</td></tr>
          <tr><td class="kv-label">SOW</td><td class="kv-value">Statement of Work</td></tr>
          <tr><td class="kv-label">SLA</td><td class="kv-value">Service Level Agreement</td></tr>
          <tr><td class="kv-label">MoSCoW</td><td class="kv-value">Prioritization framework: Must, Should, Could, Won't</td></tr>
        </tbody>
      </table>

      <h2>26. Appendices</h2>
      <ul style="list-style-type: disc;">
        <li>Appendix A: Proposal Document Raw Extract</li>
        <li>Appendix B: Architectural Flow &amp; Sequence Diagrams</li>
        <li>Appendix C: Zero-Exposure Masking &amp; Credential Standards</li>
        <li>Appendix D: Internal Review Audit Trail (Akshay &amp; Thasleema)</li>
        <li>Appendix E: Regulatory &amp; Security Compliance Checklists</li>
      </ul>

      <h2>27. Sign-off</h2>
      <p style="font-size: 12px; font-style: italic; margin-bottom: 10px;">
        By signing, approvers confirm this document accurately captures the requirements and is approved as the baseline for development. Changes after sign-off follow the change request process.
      </p>
      <table>
        <thead>
          <tr><th>Name</th><th>Role</th><th>Signature</th><th>Date</th></tr>
        </thead>
        <tbody>
          <tr><td>Haletale Sponsor</td><td>Business Sponsor</td><td></td><td></td></tr>
          <tr><td>Akshay</td><td>Product &amp; Solutions Lead</td><td><strong>Akshay</strong></td><td>{date_str}</td></tr>
          <tr><td>Thasleema</td><td>Lead Architect</td><td><strong>Thasleema</strong></td><td>{date_str}</td></tr>
          <tr><td>QA Lead</td><td>QA Lead</td><td></td><td></td></tr>
        </tbody>
      </table>
    </div>

    <div class="footer">
      <span>goML PreQ | Business Requirements Document</span>
      <span style="font-weight: bold; color: #C55A11;">Page 12 of 12</span>
    </div>
  </div>

</body>
</html>
"""
    return html

