# run once: python add_plant_disease_columns.py
# safe to run multiple times — skips columns that already exist

import sqlite3
import os

DB_PATH = os.path.expanduser(
    "/Users/simen/Desktop/fruit_monitoring/backend/detections.db"
)

NEW_COLUMNS = [
    ("model_type",   "VARCHAR DEFAULT 'lychee'"),
    ("disease_type", "VARCHAR"),
    ("plant_type",   "VARCHAR"),
    ("is_healthy",   "BOOLEAN"),
]

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("PRAGMA table_info(detections)")
    existing = {row[1] for row in cursor.fetchall()}

    added = []
    for col_name, col_def in NEW_COLUMNS:
        if col_name not in existing:
            cursor.execute(f"ALTER TABLE detections ADD COLUMN {col_name} {col_def}")
            added.append(col_name)
            print(f"  ✅ Added column: {col_name}")
        else:
            print(f"  ⏭️  Already exists: {col_name}")

    conn.commit()
    conn.close()

    if added:
        print(f"\n✅ Migration complete — added {len(added)} columns")
    else:
        print("\n✅ Nothing to do — all columns already exist")

if __name__ == "__main__":
    migrate()