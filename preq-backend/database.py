from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os

NEON_DATABASE_URL = "postgresql://neondb_owner:npg_vYRKDjgQ8J0Z@ep-divine-fog-b3dcoy4w-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

DATABASE_URL = os.environ.get("DATABASE_URL", NEON_DATABASE_URL)

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
