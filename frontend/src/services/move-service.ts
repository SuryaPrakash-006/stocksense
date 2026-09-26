import { apiClient } from "@/lib/api-client";
import {
  MoveFilterParams,
  StockLedgerEntry,
  StockLedgerPagination,
  StockMovesStats,
} from "@/types/move";

export const moveService = {
  listMoves: async (params: MoveFilterParams = {}): Promise<StockLedgerPagination> => {
    const response = await apiClient.get<StockLedgerPagination>("/stock-ledger", {
      params,
    });
    return response.data;
  },

  getLedgerEntry: async (id: string): Promise<StockLedgerEntry> => {
    const response = await apiClient.get<StockLedgerEntry>(`/stock-ledger/${id}`);
    return response.data;
  },

  getStats: async (): Promise<StockMovesStats> => {
    const response = await apiClient.get<StockMovesStats>("/stock-ledger/stats");
    return response.data;
  },
};
