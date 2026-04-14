# run once: python add_farm_type.py
# safe to run multiple times

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

    if "farm_type" not in existing:
        cursor.execute("ALTER TABLE farms ADD COLUMN farm_type VARCHAR DEFAULT 'lychee'")
        print("✅ Added column: farm_type to farms table")
    else:
        print("⏭️  Already exists: farm_type")

    conn.commit()
    conn.close()
    print("✅ Migration complete")

if __name__ == "__main__":
    migrate()