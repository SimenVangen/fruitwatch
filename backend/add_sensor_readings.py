# run once: python add_sensor_readings.py
import sqlite3
import os

DB_PATH = os.path.expanduser(
    "/Users/simen/Desktop/fruit_monitoring/backend/detections.db"
)

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("PRAGMA table_info(sensor_readings)")
    existing = cursor.fetchall()

    if not existing:
        cursor.execute("""
            CREATE TABLE sensor_readings (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                farm_id     INTEGER NOT NULL,
                temperature REAL,
                humidity    REAL,
                timestamp   DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (farm_id) REFERENCES farms(id)
            )
        """)
        print("✅ Created table: sensor_readings")
    else:
        print("⏭️  Already exists: sensor_readings")

    conn.commit()
    conn.close()
    print("✅ Migration complete")

if __name__ == "__main__":
    migrate()