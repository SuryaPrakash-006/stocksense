import time
from datetime import datetime, timezone
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.schemas.health import HealthResponse, DatabaseStatus
from app import __version__


class HealthService:
    @staticmethod
    async def check_health(db: AsyncSession) -> HealthResponse:
        start_time = time.perf_counter()
        db_connected = False
        db_error = None
        latency_ms = 0.0

        try:
            result = await db.execute(text("SELECT 1"))
            if result.scalar() == 1:
                db_connected = True
                latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        except Exception as exc:
            db_connected = False
            db_error = str(exc)
            latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

        overall_status = "healthy" if db_connected else "degraded"

        return HealthResponse(
            status=overall_status,
            project_name=settings.PROJECT_NAME,
            environment=settings.ENVIRONMENT,
            version=__version__,
            timestamp=datetime.now(timezone.utc),
            database=DatabaseStatus(
                connected=db_connected,
                latency_ms=latency_ms,
                error=db_error,
            ),
        )
