from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Never hardcode hosted database credentials in source code. Configure DATABASE_URL
# in the local .env / deployment environment. SQLite is only a safe local fallback.
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./preq_local.db")

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL, 
        connect_args={"check_same_thread": False}
    )
else:
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
    elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
