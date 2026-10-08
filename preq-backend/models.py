from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
import datetime
import uuid
from database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text, default="")
    client_name = Column(String, default="Acme Enterprise")
    client_email = Column(String, default="sponsor@client.com")
    type = Column(String, default="GenAI / LLM Application")
    industry = Column(String, default="BFSI (Banking & Financial Services)")
    deployment = Column(String, default="AWS Cloud")
    target_kickoff_date = Column(String, default="")
    status = Column(String, default="Kick-off Not Cleared")
    score = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    items = relationship("ChecklistItem", back_populates="project", cascade="all, delete-orphan")
    escalations = relationship("EscalationLog", back_populates="project", cascade="all, delete-orphan")
    certificate = relationship("Certificate", back_populates="project", uselist=False, cascade="all, delete-orphan")

class ChecklistItem(Base):
    __tablename__ = "checklist_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    category = Column(String, default="General")  # Data, Environment, Compliance, People, Security, Integration
    name = Column(String, nullable=False)
    description = Column(Text, default="")
    owner = Column(String, default="Client")
    is_critical = Column(Boolean, default=False)
    due_date = Column(String, default="")
    status = Column(String, default="Pending")  # Pending, In Progress, Submitted, Verifying, Verified, Rejected
    expected_evidence = Column(String, default="")
    evidence_url = Column(String, nullable=True)
    evidence_file = Column(String, nullable=True)
    evidence_notes = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    depends_on = Column(Text, default="[]")  # JSON string of prerequisite item IDs
    verification_score = Column(Integer, nullable=True)
    verification_notes = Column(Text, nullable=True)
    escalation_level = Column(Integer, default=0)  # 0=Normal, 1=Warning, 2=Urgent, 3=Critical
    api_key_name = Column(String, nullable=True)
    api_key_value = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="items")

class EscalationLog(Base):
    __tablename__ = "escalation_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    item_id = Column(String, nullable=True)
    item_name = Column(String, default="")
    level = Column(Integer, default=1)
    title = Column(String, default="")
    message = Column(Text, default="")
    recipient = Column(String, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="escalations")

class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    cert_number = Column(String, unique=True, nullable=False)
    verification_hash = Column(String, nullable=False)
    issued_at = Column(DateTime, default=datetime.datetime.utcnow)
    score = Column(Integer, default=100)
    metadata_json = Column(Text, default="{}")

    project = relationship("Project", back_populates="certificate")
