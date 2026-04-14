# run once: python add_disease_toggle.py
import sqlite3
import os

DB_PATH = os.path.expanduser(
    "/Users/simen/Desktop/fruit_monitoring/backend/detections.db"
)

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("PRAGMA table_info(farms)")
    existing = {row[1] for row in cursor.fetchall()}

    if "run_disease_detection" not in existing:
        cursor.execute("ALTER TABLE farms ADD COLUMN run_disease_detection BOOLEAN DEFAULT 1")
        print("✅ Added column: run_disease_detection to farms table")
    else:
        print("⏭️  Already exists: run_disease_detection")

    conn.commit()
    conn.close()
    print("✅ Migration complete")

if __name__ == "__main__":
    migrate()