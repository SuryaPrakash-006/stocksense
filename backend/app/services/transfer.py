import math
import secrets
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.enums import DocumentStatus, TransactionType
from app.models.product import Product
from app.models.stock import StockBalance, StockLedger
from app.models.transfer import InternalTransfer, InternalTransferItem
from app.models.warehouse import Location
from app.models.user import User
from app.repositories.stock import StockRepository
from app.repositories.transfer import TransferRepository
from app.schemas.product import ProductCategoryResponse, ProductResponse
from app.schemas.stock import StockLedgerPaginationResponse, StockLedgerResponse
from app.schemas.transfer import (
    InternalTransferCreate,
    InternalTransferItemResponse,
    InternalTransferPaginationResponse,
    InternalTransferResponse,
    InternalTransferUpdate,
)
from app.schemas.warehouse import LocationResponse


async def format_transfer_response(
    db: AsyncSession, transfer: InternalTransfer
) -> InternalTransferResponse:
    # Fetch live stock balances for all items at source_location
    product_ids = [it.product_id for it in transfer.items]
    stock_map: Dict[uuid.UUID, Decimal] = {}

    if product_ids:
        bal_stmt = select(StockBalance).where(
            StockBalance.location_id == transfer.source_location_id,
            StockBalance.product_id.in_(product_ids),
        )
        bal_res = await db.execute(bal_stmt)
        for bal in bal_res.scalars().all():
            stock_map[bal.product_id] = Decimal(str(bal.quantity))

    items_response = []
    total_qty = Decimal("0.0000")
    all_sufficient = True

    for item in transfer.items:
        prod_resp = None
        if item.product:
            cat_resp = (
                ProductCategoryResponse.model_validate(item.product.category)
                if item.product.category
                else None
            )
            prod_resp = ProductResponse(
                id=item.product.id,
                name=item.product.name,
                sku=item.product.sku,
                category_id=item.product.category_id,
                unit_of_measure=item.product.unit_of_measure,
                reorder_level=item.product.reorder_level,
                is_active=item.product.is_active,
                created_at=item.product.created_at,
                updated_at=item.product.updated_at,
                category=cat_resp,
            )

        avail_stock = stock_map.get(item.product_id, Decimal("0.0000"))
        req_qty = Decimal(str(item.quantity))
        is_suff = (transfer.status == DocumentStatus.DONE) or (avail_stock >= req_qty)
        if not is_suff:
            all_sufficient = False

        total_qty += req_qty
        items_response.append(
            InternalTransferItemResponse(
                id=item.id,
                transfer_id=item.transfer_id,
                product_id=item.product_id,
                quantity=item.quantity,
                created_at=item.created_at,
                updated_at=item.updated_at,
                product=prod_resp,
                available_stock=avail_stock,
                is_sufficient=is_suff,
            )
        )

    source_loc_resp = (
        LocationResponse.model_validate(transfer.source_location)
        if transfer.source_location
        else None
    )
    dest_loc_resp = (
        LocationResponse.model_validate(transfer.destination_location)
        if transfer.destination_location
        else None
    )

    return InternalTransferResponse(
        id=transfer.id,
        transfer_number=transfer.transfer_number,
        source_location_id=transfer.source_location_id,
        destination_location_id=transfer.destination_location_id,
        status=transfer.status,
        notes=transfer.notes,
        created_by=transfer.created_by,
        completed_by=transfer.completed_by,
        completed_at=transfer.completed_at,
        created_at=transfer.created_at,
        updated_at=transfer.updated_at,
        source_location=source_loc_resp,
        destination_location=dest_loc_resp,
        items=items_response,
        total_items=len(transfer.items),
        total_quantity=total_qty,
        created_by_name=transfer.creator.name if transfer.creator else None,
        completed_by_name=transfer.completer.name if transfer.completer else None,
        has_sufficient_stock=all_sufficient,
    )


class TransferService:
    @staticmethod
    async def create_transfer(
        db: AsyncSession, data: InternalTransferCreate, current_user: User
    ) -> InternalTransferResponse:
        repo = TransferRepository(db)

        if data.source_location_id == data.destination_location_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Source and destination locations cannot be identical.",
            )

        # Source Location Check
        src_res = await db.execute(
            select(Location).where(Location.id == data.source_location_id)
        )
        if not src_res.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Source warehouse location not found.",
            )

        # Dest Location Check
        dst_res = await db.execute(
            select(Location).where(Location.id == data.destination_location_id)
        )
        if not dst_res.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Destination warehouse location not found.",
            )

        transfer_number = data.transfer_number
        if not transfer_number or not transfer_number.strip():
            date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
            random_suffix = secrets.token_hex(2).upper()
            transfer_number = f"TRF-{date_str}-{random_suffix}"
        else:
            existing_num = await repo.get_by_number(transfer_number)
            if existing_num:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Transfer number '{transfer_number}' already exists.",
                )

        # Header
        transfer = InternalTransfer(
            transfer_number=transfer_number.strip().upper(),
            source_location_id=data.source_location_id,
            destination_location_id=data.destination_location_id,
            status=DocumentStatus.DRAFT,
            notes=data.notes,
            created_by=current_user.id,
        )
        db.add(transfer)
        await db.flush()

        # Items
        for item_in in data.items:
            prod_res = await db.execute(
                select(Product).where(Product.id == item_in.product_id)
            )
            if not prod_res.scalars().first():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with ID '{item_in.product_id}' not found.",
                )
            if item_in.quantity <= Decimal("0.0000"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Item quantity must be strictly greater than zero.",
                )

            item = InternalTransferItem(
                transfer_id=transfer.id,
                product_id=item_in.product_id,
                quantity=item_in.quantity,
            )
            db.add(item)

        await db.commit()
        return await TransferService.get_transfer_detail(db, transfer.id)

    @staticmethod
    async def get_transfer_detail(
        db: AsyncSession, transfer_id: uuid.UUID
    ) -> InternalTransferResponse:
        repo = TransferRepository(db)
        transfer = await repo.get_by_id_with_relations(transfer_id)
        if not transfer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Internal transfer order not found.",
            )
        return await format_transfer_response(db, transfer)

    @staticmethod
    async def list_transfers(
        db: AsyncSession,
        search: Optional[str] = None,
        status_filter: Optional[DocumentStatus] = None,
        source_location_id: Optional[uuid.UUID] = None,
        destination_location_id: Optional[uuid.UUID] = None,
        warehouse_id: Optional[uuid.UUID] = None,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> InternalTransferPaginationResponse:
        repo = TransferRepository(db)
        transfers, total_count = await repo.list_transfers(
            search=search,
            status=status_filter,
            source_location_id=source_location_id,
            destination_location_id=destination_location_id,
            warehouse_id=warehouse_id,
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            sort_order=sort_order,
        )

        items_resp = [await format_transfer_response(db, t) for t in transfers]
        pages = math.ceil(total_count / page_size) if total_count > 0 else 1

        return InternalTransferPaginationResponse(
            items=items_resp,
            total=total_count,
            page=page,
            page_size=page_size,
            pages=pages,
        )

    @staticmethod
    async def update_transfer(
        db: AsyncSession,
        transfer_id: uuid.UUID,
        data: InternalTransferUpdate,
        current_user: User,
    ) -> InternalTransferResponse:
        repo = TransferRepository(db)
        transfer = await repo.get_by_id_with_relations(transfer_id)
        if not transfer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Internal transfer not found.",
            )

        if transfer.status == DocumentStatus.DONE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot modify a completed transfer.",
            )
        if transfer.status == DocumentStatus.CANCELED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot modify a canceled transfer.",
            )

        if data.source_location_id is not None:
            transfer.source_location_id = data.source_location_id
        if data.destination_location_id is not None:
            transfer.destination_location_id = data.destination_location_id
        if data.notes is not None:
            transfer.notes = data.notes
        if data.status is not None:
            if data.status not in [DocumentStatus.DRAFT, DocumentStatus.WAITING, DocumentStatus.READY]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Use /validate or /cancel endpoints to finalize transfer status.",
                )
            transfer.status = data.status

        if data.items is not None:
            if len(data.items) == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Transfer order must contain at least one item.",
                )
            await db.execute(
                delete(InternalTransferItem).where(
                    InternalTransferItem.transfer_id == transfer_id
                )
            )
            for item_in in data.items:
                if item_in.quantity <= Decimal("0.0000"):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Quantity must be strictly positive.",
                    )
                new_item = InternalTransferItem(
                    transfer_id=transfer_id,
                    product_id=item_in.product_id,
                    quantity=item_in.quantity,
                )
                db.add(new_item)

        await db.commit()
        return await TransferService.get_transfer_detail(db, transfer_id)

    @staticmethod
    async def validate_transfer(
        db: AsyncSession, transfer_id: uuid.UUID, current_user: User
    ) -> InternalTransferResponse:
        repo = TransferRepository(db)
        transfer = await repo.get_by_id_with_relations(transfer_id)
        if not transfer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Internal transfer not found.",
            )

        if transfer.status == DocumentStatus.DONE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Transfer order has already been completed.",
            )
        if transfer.status == DocumentStatus.CANCELED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot complete a canceled transfer.",
            )
        if len(transfer.items) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot complete transfer with no line items.",
            )

        # ATOMIC TRANSFER EXECUTION
        for item in transfer.items:
            # 1. Lock Source Balance
            src_stmt = (
                select(StockBalance)
                .where(
                    StockBalance.product_id == item.product_id,
                    StockBalance.location_id == transfer.source_location_id,
                )
                .with_for_update()
            )
            src_res = await db.execute(src_stmt)
            src_balance = src_res.scalars().first()

            avail_src = Decimal(str(src_balance.quantity)) if src_balance else Decimal("0.0000")
            req_qty = Decimal(str(item.quantity))

            if avail_src < req_qty:
                sku_str = item.product.sku if item.product else str(item.product_id)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for product '{sku_str}' at source location. Required: {req_qty}, Available: {avail_src}.",
                )

            # 2. Lock Destination Balance
            dst_stmt = (
                select(StockBalance)
                .where(
                    StockBalance.product_id == item.product_id,
                    StockBalance.location_id == transfer.destination_location_id,
                )
                .with_for_update()
            )
            dst_res = await db.execute(dst_stmt)
            dst_balance = dst_res.scalars().first()

            # Deduct from Source
            src_qty_before = avail_src
            src_qty_change = -req_qty
            src_qty_after = src_qty_before - req_qty
            src_balance.quantity = src_qty_after

            # Add to Destination
            if not dst_balance:
                dst_qty_before = Decimal("0.0000")
                dst_qty_change = req_qty
                dst_qty_after = req_qty

                new_dst = StockBalance(
                    product_id=item.product_id,
                    location_id=transfer.destination_location_id,
                    quantity=dst_qty_after,
                )
                db.add(new_dst)
            else:
                dst_qty_before = Decimal(str(dst_balance.quantity))
                dst_qty_change = req_qty
                dst_qty_after = dst_qty_before + req_qty
                dst_balance.quantity = dst_qty_after

            # Ledger: TRANSFER_OUT from Source
            ledger_out = StockLedger(
                product_id=item.product_id,
                location_id=transfer.source_location_id,
                transaction_type=TransactionType.TRANSFER_OUT,
                reference_type="internal_transfer",
                reference_id=transfer.id,
                quantity_before=src_qty_before,
                quantity_change=src_qty_change,
                quantity_after=src_qty_after,
                created_by=current_user.id,
            )
            db.add(ledger_out)

            # Ledger: TRANSFER_IN to Destination
            ledger_in = StockLedger(
                product_id=item.product_id,
                location_id=transfer.destination_location_id,
                transaction_type=TransactionType.TRANSFER_IN,
                reference_type="internal_transfer",
                reference_id=transfer.id,
                quantity_before=dst_qty_before,
                quantity_change=dst_qty_change,
                quantity_after=dst_qty_after,
                created_by=current_user.id,
            )
            db.add(ledger_in)

        transfer.status = DocumentStatus.DONE
        transfer.completed_by = current_user.id
        transfer.completed_at = datetime.now(timezone.utc)

        await db.commit()
        return await TransferService.get_transfer_detail(db, transfer.id)

    @staticmethod
    async def cancel_transfer(
        db: AsyncSession, transfer_id: uuid.UUID, current_user: User
    ) -> InternalTransferResponse:
        repo = TransferRepository(db)
        transfer = await repo.get_by_id_with_relations(transfer_id)
        if not transfer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Internal transfer not found.",
            )

        if transfer.status == DocumentStatus.DONE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot cancel a completed transfer order.",
            )
        if transfer.status == DocumentStatus.CANCELED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Transfer order is already canceled.",
            )

        transfer.status = DocumentStatus.CANCELED
        await db.commit()
        return await TransferService.get_transfer_detail(db, transfer.id)


class StockLedgerService:
    @staticmethod
    async def get_ledger_item(
        db: AsyncSession, ledger_id: uuid.UUID
    ) -> Optional[StockLedgerResponse]:
        repo = StockRepository(db)
        return await repo.get_ledger_by_id(ledger_id)

    @staticmethod
    async def list_moves(
        db: AsyncSession,
        product_id: Optional[uuid.UUID] = None,
        sku: Optional[str] = None,
        location_id: Optional[uuid.UUID] = None,
        warehouse_id: Optional[uuid.UUID] = None,
        transaction_type: Optional[TransactionType] = None,
        created_by: Optional[uuid.UUID] = None,
        search: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        page: int = 1,
        page_size: int = 25,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> StockLedgerPaginationResponse:
        repo = StockRepository(db)
        items, total_count = await repo.list_ledger(
            product_id=product_id,
            sku=sku,
            location_id=location_id,
            warehouse_id=warehouse_id,
            transaction_type=transaction_type,
            created_by=created_by,
            search=search,
            start_date=start_date,
            end_date=end_date,
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            sort_order=sort_order,
        )

        pages = math.ceil(total_count / page_size) if total_count > 0 else 1

        return StockLedgerPaginationResponse(
            items=items,
            total=total_count,
            page=page,
            page_size=page_size,
            pages=pages,
        )

    @staticmethod
    async def get_moves_stats(db: AsyncSession):
        from sqlalchemy import func
        from app.models.stock import StockLedger
        from app.schemas.stock import StockMovesStatsResponse

        stmt = select(
            StockLedger.transaction_type,
            func.count(StockLedger.id).label("count"),
        ).group_by(StockLedger.transaction_type)
        res = await db.execute(stmt)
        rows = res.all()

        counts = {r[0]: r[1] for r in rows}
        total = sum(counts.values())

        receipts_count = counts.get(TransactionType.RECEIPT, 0)
        deliveries_count = counts.get(TransactionType.DELIVERY, 0)
        transfers_count = counts.get(TransactionType.TRANSFER_IN, 0) + counts.get(TransactionType.TRANSFER_OUT, 0)
        adjustments_count = counts.get(TransactionType.ADJUSTMENT, 0)

        return StockMovesStatsResponse(
            total_moves=total,
            receipts_count=receipts_count,
            deliveries_count=deliveries_count,
            transfers_count=transfers_count,
            adjustments_count=adjustments_count,
        )

