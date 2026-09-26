from fastapi import APIRouter
from app.api.v1.endpoints import (
    adjustments,
    auth,
    categories,
    customers,
    dashboard,
    deliveries,
    health,
    moves,
    products,
    receipts,
    suppliers,
    transfers,
    warehouses,
    alerts,
    stock_ledger,
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["Stock Alerts"])
api_router.include_router(stock_ledger.router, prefix="/stock-ledger", tags=["Stock Ledger"])
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(suppliers.router, prefix="/suppliers", tags=["Suppliers"])
api_router.include_router(customers.router, prefix="/customers", tags=["Customers"])
api_router.include_router(receipts.router, prefix="/receipts", tags=["Receipts"])
api_router.include_router(deliveries.router, prefix="/deliveries", tags=["Delivery Orders"])
api_router.include_router(transfers.router, prefix="/transfers", tags=["Internal Transfers"])
api_router.include_router(adjustments.router, prefix="/adjustments", tags=["Inventory Adjustments"])
api_router.include_router(moves.router, prefix="/moves", tags=["Move History"])
api_router.include_router(warehouses.router, prefix="/warehouses", tags=["Warehouses"])



