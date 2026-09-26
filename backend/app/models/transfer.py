import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
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
from app.models.enums import DocumentStatus


class InternalTransfer(UUIDModel):
    __tablename__ = "internal_transfers"
    __table_args__ = (
        CheckConstraint(
            "source_location_id != destination_location_id",
            name="chk_transfer_different_locations",
        ),
    )

    transfer_number: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False
    )
    source_location_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("locations.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    destination_location_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("locations.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    status: Mapped[DocumentStatus] = mapped_column(
        Enum(DocumentStatus, name="transfer_status_enum", native_enum=False),
        default=DocumentStatus.DRAFT,
        index=True,
        nullable=False,
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    completed_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    source_location: Mapped["Location"] = relationship(
        "Location", foreign_keys=[source_location_id]
    )
    destination_location: Mapped["Location"] = relationship(
        "Location", foreign_keys=[destination_location_id]
    )
    creator: Mapped["User"] = relationship("User", foreign_keys=[created_by])
    completer: Mapped[Optional["User"]] = relationship("User", foreign_keys=[completed_by])
    items: Mapped[List["InternalTransferItem"]] = relationship(
        "InternalTransferItem",
        back_populates="transfer",
        cascade="all, delete-orphan",
    )


class InternalTransferItem(UUIDModel):
    __tablename__ = "internal_transfer_items"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="chk_transfer_item_quantity_positive"),
    )

    transfer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("internal_transfers.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    quantity: Mapped[Decimal] = mapped_column(
        Numeric(15, 4),
        nullable=False,
    )

    # Relationships
    transfer: Mapped["InternalTransfer"] = relationship("InternalTransfer", back_populates="items")
    product: Mapped["Product"] = relationship("Product")
