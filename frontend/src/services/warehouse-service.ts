import { apiClient } from "@/lib/api-client";
import { Location, Warehouse } from "@/types/warehouse";

export const warehouseService = {
  async getWarehouses(): Promise<Warehouse[]> {
    const response = await apiClient.get<Warehouse[]>("/warehouses");
    return response.data;
  },

  listWarehouses(): Promise<Warehouse[]> {
    return this.getWarehouses();
  },

  async getLocations(): Promise<Location[]> {
    const response = await apiClient.get<Location[]>("/warehouses/locations");
    return response.data;
  },

  listLocations(): Promise<Location[]> {
    return this.getLocations();
  },

  async createWarehouse(data: { name: string; code: string; address?: string }): Promise<Warehouse> {
    const response = await apiClient.post<Warehouse>("/warehouses", data);
    return response.data;
  },
};
