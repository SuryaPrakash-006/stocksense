import { apiClient } from "@/lib/api-client";
import {
  StockAlertFilterParams,
  StockAlertPaginationResponse,
  StockAlertSummary,
} from "@/types/alert";

export const alertService = {
  getSummary: async (params: {
    warehouse_id?: string;
    location_id?: string;
    category_id?: string;
  } = {}): Promise<StockAlertSummary> => {
    const response = await apiClient.get<StockAlertSummary>("/alerts/summary", {
      params,
    });
    return response.data;
  },

  getAlerts: async (
    params: StockAlertFilterParams = {}
  ): Promise<StockAlertPaginationResponse> => {
    const response = await apiClient.get<StockAlertPaginationResponse>("/alerts", {
      params,
    });
    return response.data;
  },

  getLowStock: async (
    params: StockAlertFilterParams = {}
  ): Promise<StockAlertPaginationResponse> => {
    const response = await apiClient.get<StockAlertPaginationResponse>(
      "/alerts/low-stock",
      {
        params,
      }
    );
    return response.data;
  },

  getOutOfStock: async (
    params: StockAlertFilterParams = {}
  ): Promise<StockAlertPaginationResponse> => {
    const response = await apiClient.get<StockAlertPaginationResponse>(
      "/alerts/out-of-stock",
      {
        params,
      }
    );
    return response.data;
  },
};
