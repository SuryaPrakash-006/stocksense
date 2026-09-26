import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user, require_warehouse_staff
from app.db.session import get_db
from app.models.enums import AdjustmentStatus
from app.models.user import User
from app.schemas.adjustment import (
    InventoryAdjustmentCreate,
    InventoryAdjustmentPaginationResponse,
    InventoryAdjustmentResponse,
    InventoryAdjustmentUpdate,
)
from app.services.adjustment import AdjustmentService

router = APIRouter()


@router.get(
    "",
    response_model=InventoryAdjustmentPaginationResponse,
    status_code=status.HTTP_200_OK,
    summary="List inventory adjustments with filters and pagination",
)
async def list_adjustments(
    search: Optional[str] = Query(None, description="Search by adjustment #, SKU, product name, or reason"),
    status: Optional[AdjustmentStatus] = Query(None, description="Filter by status: DRAFT, APPLIED, CANCELED"),
    product_id: Optional[uuid.UUID] = Query(None, description="Filter by Product ID"),
    location_id: Optional[uuid.UUID] = Query(None, description="Filter by Location ID"),
    warehouse_id: Optional[uuid.UUID] = Query(None, description="Filter by Warehouse ID"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("created_at", description="Field to sort by: created_at, adjustment_number, difference"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InventoryAdjustmentPaginationResponse:
    return await AdjustmentService.list_adjustments(
        db=db,
        search=search,
        status_filter=status,
        product_id=product_id,
        location_id=location_id,
        warehouse_id=warehouse_id,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.post(
    "",
    response_model=InventoryAdjustmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new physical count inventory adjustment record",
)
async def create_adjustment(
    data: InventoryAdjustmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_warehouse_staff),
) -> InventoryAdjustmentResponse:
    return await AdjustmentService.create_adjustment(
        db=db, data=data, current_user=current_user
    )


@router.get(
    "/stock-lookup",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Get recorded stock quantity for product at location",
)
async def get_recorded_stock(
    product_id: uuid.UUID = Query(..., description="Product ID"),
    location_id: uuid.UUID = Query(..., description="Location ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await AdjustmentService.get_recorded_stock(
        db=db, product_id=product_id, location_id=location_id
    )


@router.get(
    "/{adjustment_id}",
    response_model=InventoryAdjustmentResponse,
    status_code=status.HTTP_200_OK,
    summary="Get detailed inventory adjustment record",
)
async def get_adjustment(
    adjustment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InventoryAdjustmentResponse:
    return await AdjustmentService.get_adjustment_detail(
        db=db, adjustment_id=adjustment_id
    )


@router.post(
    "/{adjustment_id}/validate",
    response_model=InventoryAdjustmentResponse,
    status_code=status.HTTP_200_OK,
    summary="Atomically validate and reconcile counted quantity to stock balance and record in immutable ledger",
)
async def validate_adjustment(
    adjustment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_warehouse_staff),
) -> InventoryAdjustmentResponse:
    return await AdjustmentService.apply_adjustment(
        db=db, adjustment_id=adjustment_id, current_user=current_user
    )


@router.post(
    "/{adjustment_id}/apply",
    response_model=InventoryAdjustmentResponse,
    status_code=status.HTTP_200_OK,
    summary="Alias for validate adjustment",
)
async def apply_adjustment(
    adjustment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_warehouse_staff),
) -> InventoryAdjustmentResponse:
    return await AdjustmentService.apply_adjustment(
        db=db, adjustment_id=adjustment_id, current_user=current_user
    )


@router.post(
    "/{adjustment_id}/cancel",
    response_model=InventoryAdjustmentResponse,
    status_code=status.HTTP_200_OK,
    summary="Cancel inventory adjustment record",
)
async def cancel_adjustment(
    adjustment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_warehouse_staff),
) -> InventoryAdjustmentResponse:
    return await AdjustmentService.cancel_adjustment(
        db=db, adjustment_id=adjustment_id, current_user=current_user
    )
