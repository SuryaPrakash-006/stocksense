from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.health import HealthResponse
from app.services.health import HealthService

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="System Health & Database Connectivity Check",
    description="Validates FastAPI backend liveness and active PostgreSQL database connectivity.",
)
async def check_health(db: AsyncSession = Depends(get_db)) -> HealthResponse:
    return await HealthService.check_health(db=db)
