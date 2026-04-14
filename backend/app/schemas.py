from pydantic import BaseModel, Field
from typing import List, Optional

class CoordinatesSchema(BaseModel):
    x: float = Field(0, title="X Coordinate", example=0)
    y: float = Field(0, title="Y Coordinate", example=0)

    class Config:
        orm_mode = True

class FieldSchema(BaseModel):
    name: str = Field(..., title="Field Name", example="North Field")
    coordinates: Optional[CoordinatesSchema] = Field(
        default_factory=CoordinatesSchema,
        title="Coordinates"
    )

    class Config:
        orm_mode = True

class FarmSchema(BaseModel):
    name:     str = Field(..., title="Farm Name",    example="Sunny Farm")
    location: str = Field(..., title="Farm Address", example="123 Farm Rd")
    fields:   List[FieldSchema] = Field(default_factory=list, title="Fields")

    # lychee | plant_disease_only
    farm_type: Optional[str] = Field(default="lychee", title="Farm Type")

    # Whether to run plant disease detection on every image
    run_disease_detection: Optional[bool] = Field(default=True, title="Run Disease Detection")

    class Config:
        orm_mode = True