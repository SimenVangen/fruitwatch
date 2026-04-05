# backend/clean_migration.py
from app.db.db import engine, Base
from app.db.models import User, Farm, Field, Detection, IndividualDetection

def clean_migration():
    """Complete database recreation with new structure"""
    try:
        print("🔄 Recreating database with new structure...")
        
        # Drop and recreate all tables
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        
        print("✅ Database recreated successfully!")
        print("📋 New structure:")
        print("   - Fields: name, coordinates only (no ripe/unripe/health)")
        print("   - Detections: now includes field_id")
        print("   - All data coherence fixed!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")

if __name__ == "__main__":
    clean_migration()