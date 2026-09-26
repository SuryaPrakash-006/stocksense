from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import AdjustmentStatus
from app.schemas.product import ProductResponse
from app.schemas.warehouse import LocationResponse


class InventoryAdjustmentBase(BaseModel):
    product_id: UUID
    location_id: UUID
    counted_quantity: Decimal = Field(..., ge=0, description="Counted quantity must be non-negative")
    reason: Optional[str] = None


class InventoryAdjustmentCreate(InventoryAdjustmentBase):
    adjustment_number: Optional[str] = Field(None, max_length=100)


class InventoryAdjustmentUpdate(BaseModel):
    counted_quantity: Optional[Decimal] = Field(None, ge=0)
    reason: Optional[str] = None


class InventoryAdjustmentResponse(BaseModel):
    id: UUID
    adjustment_number: str
    product_id: UUID
    location_id: UUID
    previous_quantity: Decimal
    counted_quantity: Decimal
    difference: Decimal
    reason: Optional[str] = None
    status: AdjustmentStatus
    created_by: UUID
    validated_by: Optional[UUID] = None
    validated_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    product: Optional[ProductResponse] = None
    location: Optional[LocationResponse] = None
    created_by_name: Optional[str] = None
    validated_by_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class InventoryAdjustmentPaginationResponse(BaseModel):
    items: list[InventoryAdjustmentResponse]
    total: int
    page: int
    page_size: int
    pages: int

