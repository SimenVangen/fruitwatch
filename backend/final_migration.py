# backend/final_migration.py
from app.db.db import engine, Base
from app.db.models import User, Farm, Field, Detection, IndividualDetection

def final_migration():
    """Complete database recreation with ALL changes"""
    try:
        print("🔄 Final database recreation...")
        
        # Drop and recreate all tables
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        
        print("✅ Database recreated with ALL changes:")
        print("   - Fields: name + coordinates only")
        print("   - Detections: field_id column added")
        print("   - All relationships fixed")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")

if __name__ == "__main__":
    final_migration()