export type LocationType =
  | "INTERNAL"
  | "RECEIVING"
  | "SHIPPING"
  | "PRODUCTION"
  | "TRANSIT"
  | "SCRAP";

export interface Location {
  id: string;
  warehouse_id: string;
  name: string;
  code: string;
  location_type: LocationType | string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  locations: Location[];
}
