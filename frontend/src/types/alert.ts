export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
export type AlertSeverity = "CRITICAL" | "WARNING" | "INFO";

export interface StockAlertItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  category_id?: string | null;
  category_name?: string | null;
  unit_of_measure: string;
  location_id?: string | null;
  location_name?: string | null;
  location_code?: string | null;
  warehouse_id?: string | null;
  warehouse_name?: string | null;
  warehouse_code?: string | null;
  current_quantity: string | number;
  reorder_level: string | number;
  deficit_quantity: string | number;
  status: StockStatus;
  severity: AlertSeverity;
  message: string;
  last_updated?: string | null;
}

export interface StockAlertSummary {
  total_alerts: number;
  low_stock_count: number;
  out_of_stock_count: number;
  in_stock_count: number;
  critical_count: number;
  warning_count: number;
}

export interface StockAlertPaginationResponse {
  items: StockAlertItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
  summary?: StockAlertSummary | null;
}

export interface StockAlertFilterParams {
  status?: string;
  warehouse_id?: string;
  location_id?: string;
  category_id?: string;
  search?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}
