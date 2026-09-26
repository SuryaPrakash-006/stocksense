export interface DashboardKPICards {
  total_products_in_stock: number;
  total_units_in_stock: string | number;
  low_stock_items: number;
  out_of_stock_items: number;
  pending_receipts: number;
  pending_deliveries: number;
  scheduled_transfers: number;
  pending_adjustments: number;
}

export interface LowStockItem {
  product_id: string;
  product_name: string;
  sku: string;
  category_name?: string | null;
  unit_of_measure: string;
  current_stock: string | number;
  reorder_level: string | number;
  deficit: string | number;
  status: "OUT_OF_STOCK" | "LOW_STOCK";
}

export interface PendingOperationsSummary {
  receipts_draft: number;
  receipts_waiting: number;
  receipts_ready: number;
  deliveries_draft: number;
  deliveries_waiting: number;
  deliveries_ready: number;
  transfers_draft: number;
  transfers_ready: number;
}

export interface CategoryStockBreakdown {
  category_id?: string | null;
  category_name: string;
  product_count: number;
  total_stock: string | number;
}

export interface WarehouseStockBreakdown {
  warehouse_id: string;
  warehouse_name: string;
  warehouse_code: string;
  total_locations: number;
  total_stock: string | number;
}

export interface RecentActivityItem {
  id: string;
  type: "RECEIPT" | "DELIVERY" | "TRANSFER" | "ADJUSTMENT" | string;
  document_number: string;
  status: string;
  summary: string;
  created_at: string;
  created_by_name?: string | null;
}

export interface DashboardFilterParams {
  warehouse_id?: string;
  location_id?: string;
  category_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface DashboardOverview {
  kpis: DashboardKPICards;
  pending_operations: PendingOperationsSummary;
  low_stock_list: LowStockItem[];
  category_breakdown: CategoryStockBreakdown[];
  warehouse_breakdown: WarehouseStockBreakdown[];
  recent_activity: RecentActivityItem[];
}
