import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.dashboard import DashboardOverviewResponse
from app.services.dashboard import DashboardService

router = APIRouter()


@router.get(
    "/overview",
    response_model=DashboardOverviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Get real-time operational dashboard overview and KPIs",
)
async def get_dashboard_overview(
    warehouse_id: Optional[uuid.UUID] = Query(None, description="Filter by Warehouse ID"),
    location_id: Optional[uuid.UUID] = Query(None, description="Filter by Location ID"),
    category_id: Optional[uuid.UUID] = Query(None, description="Filter by Category ID"),
    start_date: Optional[datetime] = Query(None, description="Filter by start date"),
    end_date: Optional[datetime] = Query(None, description="Filter by end date"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardOverviewResponse:
    return await DashboardService.get_overview(
        db=db,
        warehouse_id=warehouse_id,
        location_id=location_id,
        category_id=category_id,
        start_date=start_date,
        end_date=end_date,
    )
