import datetime
import json
import uuid
import hashlib
from database import SessionLocal, Base, engine
from models import Project, ChecklistItem, EscalationLog, Certificate

def clear_database():
    """Wipe all mock data from the database cleanly."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        db.query(Certificate).delete()
        db.query(EscalationLog).delete()
        db.query(ChecklistItem).delete()
        db.query(Project).delete()
        db.commit()
        print("PreQ Database cleared of all mock and demo data.")
    except Exception as e:
        db.rollback()
        print(f"Error clearing database: {e}")
    finally:
        db.close()

def seed_database():
    """No-op by default so the application starts with a clean slate."""
    pass

def seed_movilventas_demo():
    """Create a single clean MovilVentas demo project matching the kickoff prerequisites."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        project_id = str(uuid.uuid4())
        today = datetime.date.today()
        kickoff = (today + datetime.timedelta(days=14)).isoformat()
        
        project = Project(
            id=project_id,
            name="MovilVentas - Native LLM Routing Agent on AWS Bedrock",
            description="Autonomous field-sales routing & visit optimization agent using Bedrock Claude 3.5 Sonnet, MySQL RDS, and Google Maps API.",
            client_name="MovilVentas",
            client_email="carlos.cto@movilventas.net",
            type="GenAI / LLM Application",
            industry="Retail & E-Commerce",
            deployment="AWS Cloud",
            target_kickoff_date=kickoff,
            status="In Progress",
            score=0
        )
        db.add(project)
        db.commit()

        items = [
            {
                "name": "MySQL (RDS) schema access & read-only dev/staging credentials",
                "category": "Data",
                "owner": "Data Steward",
                "is_critical": True,
                "due_date": (today + datetime.timedelta(days=2)).isoformat(),
                "expected_evidence": "Read-only database connection string and RDS security group access confirmation"
            },
            {
                "name": "Existing Google Maps API integration & credentials accessible",
                "category": "Integration",
                "owner": "DevOps Lead",
                "is_critical": True,
                "due_date": (today + datetime.timedelta(days=3)).isoformat(),
                "expected_evidence": "GCP Maps API Key with Distance Matrix & Directions API quotas enabled"
            },
            {
                "name": "All 40 client companies' data in the unified DB (no per-client isolation)",
                "category": "Data",
                "owner": "Data Steward",
                "is_critical": True,
                "due_date": (today + datetime.timedelta(days=4)).isoformat(),
                "expected_evidence": "Schema confirmation verifying unified multi-tenant database tables"
            },
            {
                "name": "Sufficient Bedrock service quota on the MovilVentas AWS account",
                "category": "Environment",
                "owner": "DevOps Lead",
                "is_critical": True,
                "due_date": (today + datetime.timedelta(days=5)).isoformat(),
                "expected_evidence": "AWS Service Quotas console screenshot showing Claude 3.5 Sonnet TPM limits"
            },
            {
                "name": "Carlos (CTO) & Jan (Data Lead) available for architecture alignment & UAT",
                "category": "People",
                "owner": "Client Sponsor",
                "is_critical": True,
                "due_date": (today + datetime.timedelta(days=6)).isoformat(),
                "expected_evidence": "Confirmed calendar invites for weekly architecture alignment and UAT sign-off"
            },
            {
                "name": "All clients already geolocated with latitude & longitude coordinates",
                "category": "Data",
                "owner": "Data Steward",
                "is_critical": False,
                "due_date": (today + datetime.timedelta(days=7)).isoformat(),
                "expected_evidence": "SQL sample query showing non-null latitude and longitude columns across 40 accounts"
            },
            {
                "name": "Historical visit, purchase, payment & returns data available in MySQL",
                "category": "Data",
                "owner": "Data Steward",
                "is_critical": False,
                "due_date": (today + datetime.timedelta(days=8)).isoformat(),
                "expected_evidence": "Sample dataset export showing 12 months historical order and return records"
            }
        ]

        for it in items:
            item_id = str(uuid.uuid4())
            item_obj = ChecklistItem(
                id=item_id,
                project_id=project_id,
                category=it["category"],
                name=it["name"],
                description=f"Prerequisite gatekeeper for {project.name}.",
                owner=it["owner"],
                is_critical=it["is_critical"],
                due_date=it["due_date"],
                status="Pending",
                expected_evidence=it["expected_evidence"],
                depends_on="[]"
            )
            db.add(item_obj)

        db.commit()
        return project_id
    except Exception as e:
        db.rollback()
        print(f"Error seeding demo project: {e}")
        return None
    finally:
        db.close()

