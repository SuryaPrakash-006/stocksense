import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user, require_inventory_manager
from app.db.session import get_db
from app.models.user import User
from app.schemas.product import (
    ProductCreate,
    ProductDetailResponse,
    ProductPaginationResponse,
    ProductUpdate,
    StockStatus,
)
from app.services.product import ProductService

router = APIRouter()


@router.get(
    "",
    response_model=ProductPaginationResponse,
    status_code=status.HTTP_200_OK,
    summary="List products with filtering and pagination",
    description="Retrieves a paginated list of products with filters for SKU/name search, category, location, warehouse, and stock level status.",
)
async def list_products(
    search: Optional[str] = Query(None, description="Search query by name or SKU"),
    category_id: Optional[uuid.UUID] = Query(None, description="Filter by category ID"),
    warehouse_id: Optional[uuid.UUID] = Query(None, description="Filter by warehouse ID"),
    location_id: Optional[uuid.UUID] = Query(None, description="Filter by location ID"),
    stock_status: StockStatus = Query(StockStatus.ALL, description="Filter by stock status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("created_at", description="Field to sort by: name, sku, stock, reorder_level, created_at"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProductPaginationResponse:
    return await ProductService.list_products(
        db=db,
        search=search,
        category_id=category_id,
        warehouse_id=warehouse_id,
        location_id=location_id,
        stock_status=stock_status,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.post(
    "",
    response_model=ProductDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new product",
    description="Creates a product with optional initial stock and location allocation. Restricted to Inventory Managers.",
)
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_inventory_manager),
) -> ProductDetailResponse:
    return await ProductService.create_product(
        db=db, data=data, current_user=current_user
    )


@router.get(
    "/{product_id}",
    response_model=ProductDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get product details with location stock and movement history",
    description="Retrieves complete product specification, real-time stock balances across all warehouse locations, and chronological stock ledger audit trail.",
)
async def get_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProductDetailResponse:
    return await ProductService.get_product_detail(db=db, product_id=product_id)


@router.put(
    "/{product_id}",
    response_model=ProductDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Update product specification",
    description="Modifies product metadata, SKU, category, and reordering rules. Restricted to Inventory Managers.",
)
async def update_product(
    product_id: uuid.UUID,
    data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_inventory_manager),
) -> ProductDetailResponse:
    return await ProductService.update_product(
        db=db, product_id=product_id, data=data, current_user=current_user
    )


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_200_OK,
    summary="Deactivate product",
    description="Deactivates a product. Only permitted if active stock is zero. Restricted to Inventory Managers.",
)
async def delete_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_inventory_manager),
) -> dict:
    return await ProductService.delete_product(
        db=db, product_id=product_id, current_user=current_user
    )
