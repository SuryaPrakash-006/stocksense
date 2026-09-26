from datetime import datetime
from pydantic import BaseModel, Field


class DatabaseStatus(BaseModel):
    connected: bool = Field(..., description="PostgreSQL database connectivity status")
    latency_ms: float = Field(..., description="Database round-trip query latency in milliseconds")
    error: str | None = Field(default=None, description="Error message if database connection failed")


class HealthResponse(BaseModel):
    status: str = Field(..., example="healthy")
    project_name: str = Field(..., example="StockSense")
    environment: str = Field(..., example="development")
    version: str = Field(..., example="0.1.0")
    timestamp: datetime = Field(..., description="Server current UTC timestamp")
    database: DatabaseStatus
