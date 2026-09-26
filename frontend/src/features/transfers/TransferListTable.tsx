import React from "react";
import { InternalTransfer } from "@/types/transfer";
import { DocumentStatus } from "@/types/receipt";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Truck,
} from "lucide-react";

interface TransferListTableProps {
  transfers: InternalTransfer[];
  isLoading: boolean;
  total: number;
  page: number;
  pageSize: number;
  pages: number;
  onPageChange: (newPage: number) => void;
  onSelectTransfer: (transfer: InternalTransfer) => void;
  onSort: (field: string) => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export const TransferListTable: React.FC<TransferListTableProps> = ({
  transfers,
  isLoading,
  total,
  page,
  pageSize,
  pages,
  onPageChange,
  onSelectTransfer,
  onSort,
  sortBy,
  sortOrder,
}) => {

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading transfers...</p>
      </div>
    );
  }

  if (transfers.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
        <Truck className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No Transfers Found</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          No internal transfer requests match your active filters or exist in the database yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-medium">
              <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => onSort("transfer_number")}>
                <div className="flex items-center gap-1.5">
                  <span>Transfer #</span>
                  <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                </div>
              </th>
              <th className="py-3.5 px-4">Source Location</th>
              <th className="py-3.5 px-4"></th>
              <th className="py-3.5 px-4">Destination Location</th>
              <th className="py-3.5 px-4">Items / Qty</th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => onSort("status")}>
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => onSort("created_at")}>
                <div className="flex items-center gap-1.5">
                  <span>Created</span>
                  <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                </div>
              </th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {transfers.map((t) => (
              <tr
                key={t.id}
                onClick={() => onSelectTransfer(t)}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
              >
                <td className="py-3.5 px-4 font-semibold text-indigo-600 dark:text-indigo-400">
                  {t.transfer_number}
                </td>
                <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200">
                  <div className="font-medium text-xs">{t.source_location?.name || "Unknown"}</div>
                  <div className="text-xs text-slate-400">{t.source_location?.code}</div>
                </td>
                <td className="py-3.5 px-2 text-slate-400">
                  <ArrowRight className="h-4 w-4" />
                </td>
                <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200">
                  <div className="font-medium text-xs">{t.destination_location?.name || "Unknown"}</div>
                  <div className="text-xs text-slate-400">{t.destination_location?.code}</div>
                </td>
                <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                  <span className="font-medium">{t.total_items}</span> items (
                  <span className="font-medium">{parseFloat(String(t.total_quantity)).toLocaleString()}</span> units)
                </td>
                <td className="py-3.5 px-4"><StatusBadge status={t.status} /></td>
                <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                  <div>{new Date(t.created_at).toLocaleDateString()}</div>
                  <div className="text-[11px] text-slate-400">by {t.created_by_name || "User"}</div>
                </td>
                <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectTransfer(t)}
                    className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 gap-3">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Showing <span className="font-medium">{transfers.length}</span> of{" "}
          <span className="font-medium">{total}</span> transfers
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="h-8 px-2 text-xs"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <span className="text-xs px-2 text-slate-600 dark:text-slate-300">
            Page {page} of {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pages}
            onClick={() => onPageChange(page + 1)}
            className="h-8 px-2 text-xs"
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};
