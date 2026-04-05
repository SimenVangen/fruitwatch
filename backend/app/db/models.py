# app/db/models.py
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from app.db.db import Base



# ---------- USER ----------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=False)

    # relationships
    farms = relationship("Farm", back_populates="owner", cascade="all, delete-orphan")
    detections = relationship("Detection", back_populates="user", cascade="all, delete-orphan")

# ---------- FARM ----------
class Farm(Base):
    __tablename__ = "farms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # relationships
    owner = relationship("User", back_populates="farms")
    detections = relationship("Detection", back_populates="farm", cascade="all, delete-orphan")
    fields = relationship("Field", back_populates="farm", cascade="all, delete-orphan")

# ---------- FIELD ----------
class Field(Base):
    __tablename__ = "fields"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    # REMOVED: ripe, unripe, health, zone_color - these are dynamic from detections
    coordinates = Column(JSON, default={})  # Changed from String to JSON for better handling
    farm_id = Column(Integer, ForeignKey("farms.id"))

    # relationships
    farm = relationship("Farm", back_populates="fields")

# ---------- INDIVIDUAL DETECTION ----------
class IndividualDetection(Base):
    __tablename__ = "individual_detections"
    
    id = Column(Integer, primary_key=True, index=True)
    detection_id = Column(Integer, ForeignKey('detections.id'))
    latitude = Column(Float)
    longitude = Column(Float)
    fruit_type = Column(String)
    confidence = Column(Float)
    bbox = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

# ---------- DETECTION ----------
class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    altitude = Column(Float, nullable=True)
    total_detected = Column(Integer, nullable=False)
    ripe = Column(Integer, nullable=False)
    unripe = Column(Integer, nullable=False)
    predicted_next_week = Column(Integer, nullable=False)
    average_confidence = Column(Float, default=0.0)
    # In the Detection class, add after average_confidence:
    image_path = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=True)
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=True)  # NEW: Link to specific field

    user = relationship("User", back_populates="detections")
    farm = relationship("Farm", back_populates="detections")
    field = relationship("Field")  # NEW: Link to specific field
    individual_detections = relationship("IndividualDetection", backref="detection")

class HealthMetric(Base):
        __tablename__ = "health_metrics"
        id = Column(Integer, primary_key=True, index=True)
        farm_id = Column(Integer)
        region = Column(String)
        avg_health = Column(Float)
        moisture_level = Column(Float)
        timestamp = Column(DateTime, default=datetime.utcnow)

class DroneMission(Base):
    __tablename__ = "drone_missions"

    id = Column(Integer, primary_key=True, index=True)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime)
    area_scanned = Column(Float)
    avg_health_score = Column(Float)
    irrigation_issue_percent = Column(Float)
    last_scan_time = Column(DateTime)
    flight_path = Column(JSON)

class SoilMoisture(Base):
    __tablename__ = "soil_moisture"

    id = Column(Integer, primary_key=True, index=True)
    moisture_level = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)

    farm_id = Column(Integer, ForeignKey("farms.id"))
    user_id = Column(Integer, ForeignKey("users.id"))

# ---------- DRONE TELEMETRY ----------
class DroneTelemetry(Base):
    __tablename__ = "drone_telemetry"

    id = Column(Integer, primary_key=True, index=True)
    battery = Column(Float)
    gps_signal = Column(Float)
    flight_time_remaining = Column(Integer)
    model_confidence = Column(Float)
    model_version = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)