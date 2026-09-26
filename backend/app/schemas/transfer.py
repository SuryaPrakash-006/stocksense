from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, model_validator
from app.models.enums import DocumentStatus
from app.schemas.product import ProductResponse
from app.schemas.warehouse import LocationResponse


class InternalTransferItemBase(BaseModel):
    product_id: UUID
    quantity: Decimal = Field(..., gt=0, description="Quantity must be strictly greater than zero")


class InternalTransferItemCreate(InternalTransferItemBase):
    pass


class InternalTransferItemResponse(InternalTransferItemBase):
    id: UUID
    transfer_id: UUID
    created_at: datetime
    updated_at: datetime
    product: Optional[ProductResponse] = None
    available_stock: Decimal = Field(default=Decimal("0.0000"), description="Live stock at source location")
    is_sufficient: bool = Field(default=True, description="Whether source stock >= requested quantity")

    model_config = ConfigDict(from_attributes=True)


class InternalTransferBase(BaseModel):
    source_location_id: UUID
    destination_location_id: UUID
    notes: Optional[str] = None


class InternalTransferCreate(InternalTransferBase):
    transfer_number: Optional[str] = Field(None, max_length=100)
    items: List[InternalTransferItemCreate] = Field(..., min_length=1)

    @model_validator(mode="after")
    def validate_different_locations(self) -> "InternalTransferCreate":
        if self.source_location_id == self.destination_location_id:
            raise ValueError("Source location and destination location must be different.")
        return self


class InternalTransferUpdate(BaseModel):
    source_location_id: Optional[UUID] = None
    destination_location_id: Optional[UUID] = None
    notes: Optional[str] = None
    status: Optional[DocumentStatus] = None
    items: Optional[List[InternalTransferItemCreate]] = None


class InternalTransferResponse(InternalTransferBase):
    id: UUID
    transfer_number: str
    status: DocumentStatus
    created_by: UUID
    completed_by: Optional[UUID] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    source_location: Optional[LocationResponse] = None
    destination_location: Optional[LocationResponse] = None
    items: List[InternalTransferItemResponse] = []
    total_items: int = 0
    total_quantity: Decimal = Decimal("0.0000")
    created_by_name: Optional[str] = None
    completed_by_name: Optional[str] = None
    has_sufficient_stock: bool = True

    model_config = ConfigDict(from_attributes=True)


class InternalTransferPaginationResponse(BaseModel):
    items: List[InternalTransferResponse]
    total: int
    page: int
    page_size: int
    pages: int
