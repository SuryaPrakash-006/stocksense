from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import TransactionType
from app.schemas.product import ProductResponse
from app.schemas.warehouse import LocationResponse


class StockBalanceBase(BaseModel):
    product_id: UUID
    location_id: UUID
    quantity: Decimal = Field(default=Decimal("0.0000"), ge=0)


class StockBalanceCreate(StockBalanceBase):
    pass


class StockBalanceUpdate(BaseModel):
    quantity: Decimal = Field(..., ge=0)


class StockBalanceResponse(StockBalanceBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    product: Optional[ProductResponse] = None
    location: Optional[LocationResponse] = None

    model_config = ConfigDict(from_attributes=True)


class StockLedgerResponse(BaseModel):
    id: UUID
    product_id: UUID
    location_id: UUID
    transaction_type: TransactionType
    reference_type: str
    reference_id: UUID
    quantity_before: Decimal
    quantity_change: Decimal
    quantity_after: Decimal
    created_by: Optional[UUID] = None
    created_at: datetime
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    unit_of_measure: Optional[str] = None
    location_name: Optional[str] = None
    location_code: Optional[str] = None
    warehouse_name: Optional[str] = None
    created_by_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class StockLedgerPaginationResponse(BaseModel):
    items: List[StockLedgerResponse]
    total: int
    page: int
    page_size: int
    pages: int


class StockMovesStatsResponse(BaseModel):
    total_moves: int = 0
    receipts_count: int = 0
    deliveries_count: int = 0
    transfers_count: int = 0
    adjustments_count: int = 0

