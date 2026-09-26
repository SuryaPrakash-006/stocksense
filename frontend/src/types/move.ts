export type TransactionType =
  | "RECEIPT"
  | "DELIVERY"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "ADJUSTMENT";

export interface StockLedgerEntry {
  id: string;
  product_id: string;
  location_id: string;
  transaction_type: TransactionType;
  reference_type: string;
  reference_id: string;
  quantity_before: string | number;
  quantity_change: string | number;
  quantity_after: string | number;
  created_by?: string | null;
  created_at: string;
  product_name?: string | null;
  product_sku?: string | null;
  unit_of_measure?: string | null;
  location_name?: string | null;
  location_code?: string | null;
  warehouse_name?: string | null;
  created_by_name?: string | null;
}

export interface StockLedgerPagination {
  items: StockLedgerEntry[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface StockMovesStats {
  total_moves: number;
  receipts_count: number;
  deliveries_count: number;
  transfers_count: number;
  adjustments_count: number;
}

export interface MoveFilterParams {
  product?: string;
  product_id?: string;
  sku?: string;
  location_id?: string;
  warehouse_id?: string;
  transaction_type?: TransactionType | string;
  user_id?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}
