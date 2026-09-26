export type StockStatus = "ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export interface ProductCategory {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  product_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ProductCategoryCreate {
  name: string;
  code?: string;
  description?: string;
}

export interface ProductCategoryUpdate {
  name?: string;
  code?: string;
  description?: string;
}

export interface ProductLocationStock {
  location_id: string;
  location_name: string;
  location_code: string;
  location_type: string;
  warehouse_id: string;
  warehouse_name: string;
  warehouse_code: string;
  quantity: string | number;
}

export interface ProductStockMovement {
  id: string;
  created_at: string;
  transaction_type: "RECEIPT" | "DELIVERY" | "TRANSFER_IN" | "TRANSFER_OUT" | "ADJUSTMENT";
  reference_type: string;
  reference_id: string;
  location_name: string;
  location_code: string;
  warehouse_name: string;
  quantity_before: string | number;
  quantity_change: string | number;
  quantity_after: string | number;
  created_by_name?: string | null;
}

export interface ProductListItem {
  id: string;
  name: string;
  sku: string;
  category_id?: string | null;
  unit_of_measure: string;
  reorder_level: string | number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: ProductCategory | null;
  total_stock: string | number;
  stock_status: StockStatus;
}

export interface ProductDetail extends ProductListItem {
  location_stocks: ProductLocationStock[];
  movements: ProductStockMovement[];
}

export interface ProductCreatePayload {
  name: string;
  sku: string;
  category_id?: string | null;
  category_name?: string | null;
  unit_of_measure: string;
  reorder_level: string | number;
  is_active?: boolean;
  initial_stock?: string | number | null;
  initial_location_id?: string | null;
}

export interface ProductUpdatePayload {
  name?: string;
  sku?: string;
  category_id?: string | null;
  category_name?: string | null;
  unit_of_measure?: string;
  reorder_level?: string | number;
  is_active?: boolean;
}

export interface ProductPagination {
  items: ProductListItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface ProductFilterParams {
  search?: string;
  category_id?: string;
  warehouse_id?: string;
  location_id?: string;
  stock_status?: StockStatus;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}
