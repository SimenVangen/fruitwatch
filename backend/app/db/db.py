# backend /app/db/db.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Database URL (SQLite in this case)
SQLALCHEMY_DATABASE_URL = "sqlite:///./detections.db"

# Create the SQLAlchemy engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}  # Needed only for SQLite
)

# Create a configured "Session" class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models to inherit from
Base = declarative_base()

def get_db():
    """
    FastAPI dependency that provides a database session.
    Closes the session automatically after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """
    Initializes the database by creating all tables from models.
    """
    # Import all models
    # This imports User, Farm, Field, Detection, IndividualDetection
    from app.db import models  

    # Create all tables
    models.Base.metadata.create_all(bind=engine)
    print("✅ Database created successfully with all tables!")