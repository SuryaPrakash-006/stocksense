from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import DocumentStatus
from app.schemas.partner import SupplierResponse
from app.schemas.product import ProductResponse
from app.schemas.warehouse import LocationResponse


class ReceiptItemBase(BaseModel):
    product_id: UUID
    quantity: Decimal = Field(..., gt=0, description="Quantity must be strictly greater than zero")


class ReceiptItemCreate(ReceiptItemBase):
    pass


class ReceiptItemResponse(ReceiptItemBase):
    id: UUID
    receipt_id: UUID
    created_at: datetime
    updated_at: datetime
    product: Optional[ProductResponse] = None

    model_config = ConfigDict(from_attributes=True)


class ReceiptBase(BaseModel):
    supplier_id: UUID
    destination_location_id: UUID
    notes: Optional[str] = None


class ReceiptCreate(ReceiptBase):
    receipt_number: Optional[str] = Field(None, max_length=100)
    items: List[ReceiptItemCreate] = Field(..., min_length=1)


class ReceiptUpdate(BaseModel):
    supplier_id: Optional[UUID] = None
    destination_location_id: Optional[UUID] = None
    notes: Optional[str] = None
    status: Optional[DocumentStatus] = None
    items: Optional[List[ReceiptItemCreate]] = None


class ReceiptResponse(ReceiptBase):
    id: UUID
    receipt_number: str
    status: DocumentStatus
    created_by: UUID
    validated_by: Optional[UUID] = None
    validated_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    supplier: Optional[SupplierResponse] = None
    destination_location: Optional[LocationResponse] = None
    items: List[ReceiptItemResponse] = []
    total_items: int = 0
    total_quantity: Decimal = Decimal("0.0000")
    created_by_name: Optional[str] = None
    validated_by_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ReceiptPaginationResponse(BaseModel):
    items: List[ReceiptResponse]
    total: int
    page: int
    page_size: int
    pages: int
