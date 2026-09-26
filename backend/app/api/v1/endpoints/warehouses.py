import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.api.deps import get_current_user, require_inventory_manager
from app.db.session import get_db
from app.models.user import User
from app.models.warehouse import Location, Warehouse
from app.schemas.warehouse import (
    LocationCreate,
    LocationResponse,
    WarehouseCreate,
    WarehouseResponse,
)

router = APIRouter()


@router.get(
    "",
    response_model=List[WarehouseResponse],
    status_code=status.HTTP_200_OK,
    summary="List all warehouses with locations",
)
async def list_warehouses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[WarehouseResponse]:
    stmt = (
        select(Warehouse)
        .where(Warehouse.is_active == True)
        .options(selectinload(Warehouse.locations))
        .order_by(Warehouse.name.asc())
    )
    result = await db.execute(stmt)
    return [WarehouseResponse.model_validate(w) for w in result.scalars().all()]


@router.post(
    "",
    response_model=WarehouseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create warehouse",
)
async def create_warehouse(
    data: WarehouseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_inventory_manager),
) -> WarehouseResponse:
    wh = Warehouse(
        name=data.name.strip(),
        code=data.code.strip().upper(),
        address=data.address,
        is_active=True,
    )
    db.add(wh)
    await db.commit()
    await db.refresh(wh)

    # Automatically create a default internal location for the warehouse
    default_loc = Location(
        warehouse_id=wh.id,
        name=f"{wh.code} Main Stock",
        code=f"{wh.code}-STOCK",
        location_type="INTERNAL",
        is_active=True,
    )
    db.add(default_loc)
    await db.commit()
    await db.refresh(wh)

    stmt = select(Warehouse).where(Warehouse.id == wh.id).options(selectinload(Warehouse.locations))
    res = await db.execute(stmt)
    return WarehouseResponse.model_validate(res.scalars().first())


@router.get(
    "/locations",
    response_model=List[LocationResponse],
    status_code=status.HTTP_200_OK,
    summary="List all locations",
)
async def list_locations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[LocationResponse]:
    stmt = (
        select(Location)
        .where(Location.is_active == True)
        .order_by(Location.name.asc())
    )
    result = await db.execute(stmt)
    return [LocationResponse.model_validate(l) for l in result.scalars().all()]


@router.post(
    "/locations",
    response_model=LocationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create location inside warehouse",
)
async def create_location(
    data: LocationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_inventory_manager),
) -> LocationResponse:
    loc = Location(
        warehouse_id=data.warehouse_id,
        name=data.name.strip(),
        code=data.code.strip().upper(),
        location_type=data.location_type,
        is_active=True,
    )
    db.add(loc)
    await db.commit()
    await db.refresh(loc)
    return LocationResponse.model_validate(loc)
