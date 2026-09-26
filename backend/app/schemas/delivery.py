from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import DocumentStatus
from app.schemas.partner import CustomerResponse
from app.schemas.product import ProductResponse
from app.schemas.warehouse import LocationResponse


class DeliveryItemBase(BaseModel):
    product_id: UUID
    quantity: Decimal = Field(..., gt=0, description="Quantity must be strictly greater than zero")


class DeliveryItemCreate(DeliveryItemBase):
    pass


class DeliveryItemResponse(DeliveryItemBase):
    id: UUID
    delivery_id: UUID
    created_at: datetime
    updated_at: datetime
    product: Optional[ProductResponse] = None
    available_stock: Decimal = Field(default=Decimal("0.0000"), description="Live on-hand balance at source location")
    is_sufficient: bool = Field(default=True, description="Whether available stock >= requested quantity")

    model_config = ConfigDict(from_attributes=True)


class DeliveryOrderBase(BaseModel):
    customer_id: UUID
    source_location_id: UUID
    notes: Optional[str] = None


class DeliveryOrderCreate(DeliveryOrderBase):
    delivery_number: Optional[str] = Field(None, max_length=100)
    items: List[DeliveryItemCreate] = Field(..., min_length=1)


class DeliveryOrderUpdate(BaseModel):
    customer_id: Optional[UUID] = None
    source_location_id: Optional[UUID] = None
    notes: Optional[str] = None
    status: Optional[DocumentStatus] = None
    items: Optional[List[DeliveryItemCreate]] = None


class DeliveryOrderResponse(DeliveryOrderBase):
    id: UUID
    delivery_number: str
    status: DocumentStatus
    created_by: UUID
    validated_by: Optional[UUID] = None
    validated_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    customer: Optional[CustomerResponse] = None
    source_location: Optional[LocationResponse] = None
    items: List[DeliveryItemResponse] = []
    total_items: int = 0
    total_quantity: Decimal = Decimal("0.0000")
    created_by_name: Optional[str] = None
    validated_by_name: Optional[str] = None
    has_sufficient_stock: bool = True

    model_config = ConfigDict(from_attributes=True)


class DeliveryPaginationResponse(BaseModel):
    items: List[DeliveryOrderResponse]
    total: int
    page: int
    page_size: int
    pages: int
