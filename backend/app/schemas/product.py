from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import TransactionType


class StockStatus(str, Enum):
    ALL = "ALL"
    IN_STOCK = "IN_STOCK"
    LOW_STOCK = "LOW_STOCK"
    OUT_OF_STOCK = "OUT_OF_STOCK"


class ProductCategoryBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    code: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None


class ProductCategoryCreate(ProductCategoryBase):
    pass


class ProductCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    code: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None


class ProductCategoryResponse(ProductCategoryBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    product_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


class ProductBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    sku: str = Field(..., min_length=2, max_length=100)
    category_id: Optional[UUID] = None
    category_name: Optional[str] = Field(None, max_length=255, description="Category name to find or auto-create")
    unit_of_measure: str = Field("Units", max_length=50)
    reorder_level: Decimal = Field(default=Decimal("0.0000"), ge=0)
    is_active: bool = True


class ProductCreate(ProductBase):
    initial_stock: Optional[Decimal] = Field(
        default=None,
        ge=0,
        description="Optional initial stock quantity to allocate upon creation",
    )
    initial_location_id: Optional[UUID] = Field(
        default=None,
        description="Target warehouse location for initial stock allocation",
    )


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    sku: Optional[str] = Field(None, min_length=2, max_length=100)
    category_id: Optional[UUID] = None
    category_name: Optional[str] = Field(None, max_length=255, description="Category name to find or auto-create")
    unit_of_measure: Optional[str] = Field(None, max_length=50)
    reorder_level: Optional[Decimal] = Field(None, ge=0)
    is_active: Optional[bool] = None


class ProductListItemResponse(ProductBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    category: Optional[ProductCategoryResponse] = None
    total_stock: Decimal = Field(default=Decimal("0.0000"))
    stock_status: StockStatus = StockStatus.OUT_OF_STOCK

    model_config = ConfigDict(from_attributes=True)


class ProductLocationStock(BaseModel):
    location_id: UUID
    location_name: str
    location_code: str
    location_type: str
    warehouse_id: UUID
    warehouse_name: str
    warehouse_code: str
    quantity: Decimal


class ProductStockMovement(BaseModel):
    id: UUID
    created_at: datetime
    transaction_type: TransactionType
    reference_type: str
    reference_id: UUID
    location_name: str
    location_code: str
    warehouse_name: str
    quantity_before: Decimal
    quantity_change: Decimal
    quantity_after: Decimal
    created_by_name: Optional[str] = None


class ProductDetailResponse(ProductBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    category: Optional[ProductCategoryResponse] = None
    total_stock: Decimal = Field(default=Decimal("0.0000"))
    stock_status: StockStatus = StockStatus.OUT_OF_STOCK
    location_stocks: List[ProductLocationStock] = []
    movements: List[ProductStockMovement] = []

    model_config = ConfigDict(from_attributes=True)


class ProductPaginationResponse(BaseModel):
    items: List[ProductListItemResponse]
    total: int
    page: int
    page_size: int
    pages: int


ProductResponse = ProductListItemResponse

