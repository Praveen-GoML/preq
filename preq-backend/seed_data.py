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
