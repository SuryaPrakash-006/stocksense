import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional
from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import UUIDModel
from app.models.enums import AdjustmentStatus


class InventoryAdjustment(UUIDModel):
    __tablename__ = "inventory_adjustments"
    __table_args__ = (
        CheckConstraint("counted_quantity >= 0", name="chk_adjustment_counted_non_negative"),
    )

    adjustment_number: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    location_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("locations.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    previous_quantity: Mapped[Decimal] = mapped_column(
        Numeric(15, 4),
        nullable=False,
    )
    counted_quantity: Mapped[Decimal] = mapped_column(
        Numeric(15, 4),
        nullable=False,
    )
    difference: Mapped[Decimal] = mapped_column(
        Numeric(15, 4),
        nullable=False,
    )
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[AdjustmentStatus] = mapped_column(
        Enum(AdjustmentStatus, name="adjustment_status_enum", native_enum=False),
        default=AdjustmentStatus.DRAFT,
        index=True,
        nullable=False,
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    validated_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    validated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    product: Mapped["Product"] = relationship("Product")
    location: Mapped["Location"] = relationship("Location")
    creator: Mapped["User"] = relationship("User", foreign_keys=[created_by])
    validator: Mapped[Optional["User"]] = relationship("User", foreign_keys=[validated_by])
