import { apiClient } from "@/lib/api-client";
import { Customer, Supplier, SupplierCreate } from "@/types/partner";

export const partnerService = {
  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    const response = await apiClient.get<Supplier[]>("/suppliers");
    return response.data;
  },

  async createSupplier(data: SupplierCreate): Promise<Supplier> {
    const response = await apiClient.post<Supplier>("/suppliers", data);
    return response.data;
  },

  // Customers
  async getCustomers(): Promise<Customer[]> {
    const response = await apiClient.get<Customer[]>("/customers");
    return response.data;
  },

  async createCustomer(data: {
    name: string;
    code?: string;
    contact_email?: string;
    phone?: string;
    address?: string;
  }): Promise<Customer> {
    const response = await apiClient.post<Customer>("/customers", data);
    return response.data;
  },
};
