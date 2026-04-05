from pydantic import BaseModel, Field
from typing import List, Optional

class CoordinatesSchema(BaseModel):
    x: float = Field(0, title="X Coordinate", example=0)
    y: float = Field(0, title="Y Coordinate", example=0)

    class Config:
        orm_mode = True  # allows reading from SQLAlchemy JSON column

class FieldSchema(BaseModel):
    name: str = Field(..., title="Field Name", example="North Field")
    coordinates: Optional[CoordinatesSchema] = Field(
        default_factory=CoordinatesSchema,
        title="Coordinates"
    )
    # REMOVED: ripe, unripe, health, zoneColor

    class Config:
        orm_mode = True

class FarmSchema(BaseModel):
    name: str = Field(..., title="Farm Name", example="Sunny Farm")
    location: str = Field(..., title="Farm Address", example="123 Farm Rd")
    fields: List[FieldSchema] = Field(default_factory=list, title="Fields")

    class Config:
        orm_mode = True