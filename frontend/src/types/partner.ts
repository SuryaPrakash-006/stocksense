export interface Supplier {
  id: string;
  name: string;
  code?: string | null;
  contact_email?: string | null;
  phone?: string | null;
  address?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierCreate {
  name: string;
  code?: string;
  contact_email?: string;
  phone?: string;
  address?: string;
}

export interface Customer {
  id: string;
  name: string;
  code?: string | null;
  contact_email?: string | null;
  phone?: string | null;
  address?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
