import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user, require_warehouse_staff
from app.db.session import get_db
from app.models.enums import DocumentStatus
from app.models.user import User
from app.schemas.delivery import (
    DeliveryOrderCreate,
    DeliveryOrderResponse,
    DeliveryOrderUpdate,
    DeliveryPaginationResponse,
)
from app.services.delivery import DeliveryService

router = APIRouter()


@router.get(
    "",
    response_model=DeliveryPaginationResponse,
    status_code=status.HTTP_200_OK,
    summary="List delivery orders with filters and pagination",
)
async def list_deliveries(
    search: Optional[str] = Query(None, description="Search by delivery number or customer name"),
    status: Optional[DocumentStatus] = Query(None, description="Filter by status: DRAFT, WAITING, READY, DONE, CANCELED"),
    customer_id: Optional[uuid.UUID] = Query(None, description="Filter by customer ID"),
    source_location_id: Optional[uuid.UUID] = Query(None, description="Filter by source location ID"),
    warehouse_id: Optional[uuid.UUID] = Query(None, description="Filter by warehouse ID"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("created_at", description="Field to sort by: created_at, delivery_number, status"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DeliveryPaginationResponse:
    return await DeliveryService.list_deliveries(
        db=db,
        search=search,
        status_filter=status,
        customer_id=customer_id,
        source_location_id=source_location_id,
        warehouse_id=warehouse_id,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.post(
    "",
    response_model=DeliveryOrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new outgoing delivery order",
)
async def create_delivery(
    data: DeliveryOrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_warehouse_staff),
) -> DeliveryOrderResponse:
    return await DeliveryService.create_delivery(
        db=db, data=data, current_user=current_user
    )


@router.get(
    "/{delivery_id}",
    response_model=DeliveryOrderResponse,
    status_code=status.HTTP_200_OK,
    summary="Get delivery order details with real-time stock availability",
)
async def get_delivery(
    delivery_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DeliveryOrderResponse:
    return await DeliveryService.get_delivery_detail(db=db, delivery_id=delivery_id)


@router.put(
    "/{delivery_id}",
    response_model=DeliveryOrderResponse,
    status_code=status.HTTP_200_OK,
    summary="Update delivery order details, lines, or status",
)
async def update_delivery(
    delivery_id: uuid.UUID,
    data: DeliveryOrderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_warehouse_staff),
) -> DeliveryOrderResponse:
    return await DeliveryService.update_delivery(
        db=db, delivery_id=delivery_id, data=data, current_user=current_user
    )


@router.post(
    "/{delivery_id}/validate",
    response_model=DeliveryOrderResponse,
    status_code=status.HTTP_200_OK,
    summary="Validate delivery order, deduct physical stock, and record ledger movement",
    description="Validates available on-hand stock and executes atomic deduction with immutable DELIVERY ledger entry.",
)
async def validate_delivery(
    delivery_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_warehouse_staff),
) -> DeliveryOrderResponse:
    return await DeliveryService.validate_delivery(
        db=db, delivery_id=delivery_id, current_user=current_user
    )


@router.post(
    "/{delivery_id}/cancel",
    response_model=DeliveryOrderResponse,
    status_code=status.HTTP_200_OK,
    summary="Cancel delivery order",
)
async def cancel_delivery(
    delivery_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_warehouse_staff),
) -> DeliveryOrderResponse:
    return await DeliveryService.cancel_delivery(
        db=db, delivery_id=delivery_id, current_user=current_user
    )
