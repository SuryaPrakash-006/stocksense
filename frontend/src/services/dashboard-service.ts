import { apiClient } from "@/lib/api-client";
import { DashboardFilterParams, DashboardOverview } from "@/types/dashboard";

export const dashboardService = {
  getOverview: async (params: DashboardFilterParams = {}): Promise<DashboardOverview> => {
    const response = await apiClient.get<DashboardOverview>("/dashboard/overview", {
      params,
    });
    return response.data;
  },
};
