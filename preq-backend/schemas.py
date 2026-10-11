from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import datetime

class CategoryScore(BaseModel):
    category: str
    total: int
    verified: int
    score: int

class ChecklistItemOut(BaseModel):
    id: str
    project_id: str
    category: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    owner: Optional[str] = None
    is_critical: bool = False
    due_date: Optional[str] = None
    status: str = "Pending"
    expected_evidence: Optional[str] = None
    evidence_url: Optional[str] = None
    evidence_file: Optional[str] = None
    evidence_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    depends_on: List[str] = []
    is_locked: bool = False
    blocking_items: List[Dict[str, Any]] = []
    verification_score: Optional[int] = None
    verification_notes: Optional[str] = None
    escalation_level: int = 0
    api_key_name: Optional[str] = None
    masked_api_key: Optional[str] = None
    has_api_key: bool = False
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class ProjectOut(BaseModel):
    id: str
    name: Optional[str] = None
    description: Optional[str] = None
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    type: Optional[str] = None
    industry: Optional[str] = None
    deployment: Optional[str] = None
    target_kickoff_date: Optional[str] = None
    status: str = "In Progress"
    score: int = 0
    internal_review_status: str = "Pending Internal Review (Akshay & Thasleema)"
    has_brd: bool = False
    proposal_filename: Optional[str] = None
    proposal_text: Optional[str] = None
    analysis_status: Optional[str] = "COMPLETED"
    analysis_error: Optional[str] = None
    total_items: int = 0
    verified_items: int = 0
    critical_blockers: int = 0
    category_scores: List[CategoryScore] = []
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    type: Optional[str] = None
    industry: Optional[str] = None
    deployment: Optional[str] = None
    target_kickoff_date: Optional[str] = ""

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    target_kickoff_date: Optional[str] = None
    status: Optional[str] = None

class ChecklistItemCreate(BaseModel):
    category: str = "General"
    name: str
    description: str = ""
    owner: Optional[str] = None
    is_critical: bool = False
    due_date: Optional[str] = ""
    expected_evidence: Optional[str] = None
    depends_on: Optional[List[str]] = []

class ChecklistItemUpdate(BaseModel):
    status: Optional[str] = None
    evidence_url: Optional[str] = None
    evidence_notes: Optional[str] = None
    owner: Optional[str] = None
    is_critical: Optional[bool] = None
    due_date: Optional[str] = None
    expected_evidence: Optional[str] = None
    rejection_reason: Optional[str] = None
    api_key_name: Optional[str] = None
    api_key_value: Optional[str] = None

class SubmitEvidenceRequest(BaseModel):
    evidence_url: Optional[str] = None
    evidence_notes: Optional[str] = None
    api_key_name: Optional[str] = None
    api_key_value: Optional[str] = None

class InboundSharePayload(BaseModel):
    platform: str = "Teams"
    sender: Optional[str] = "Client Lead"
    content: Optional[str] = "Shared credentials & validation artifact"
    api_key_name: Optional[str] = None
    api_key_value: Optional[str] = None

class RejectRequest(BaseModel):
    reason: str

class EscalateRequest(BaseModel):
    level: Optional[int] = 2
    message: Optional[str] = None

class EscalationLogOut(BaseModel):
    id: str
    project_id: str
    item_id: Optional[str] = None
    item_name: str
    level: int
    title: str
    message: str
    recipient: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class Signatory(BaseModel):
    role: str
    name: str
    status: str

class CertificateOut(BaseModel):
    cert_number: str
    project_id: str
    project_name: str
    client_name: str
    industry: str
    deployment: str
    score: int
    verified_count: int
    total_count: int
    verification_hash: str
    issued_at: datetime.datetime
    signatories: List[Signatory]

class CopilotChatRequest(BaseModel):
    project_id: Optional[str] = None
    messages: List[Dict[str, str]]

class SOWAnalyzeRequest(BaseModel):
    content: str
    groq_api_key: Optional[str] = None

class RetryAnalysisRequest(BaseModel):
    content: Optional[str] = None

class DashboardStats(BaseModel):
    total_projects: int
    cleared_projects: int
    at_risk_projects: int
    average_score: int
    total_critical_blockers: int
    recent_escalations: List[EscalationLogOut]
