import React from "react";
import { DocumentStatus, Receipt } from "@/types/receipt";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { Button } from "@/components/ui/button";
import {
  ArrowDownToLine,
  ChevronLeft,
  ChevronRight,
  Eye,
  ArrowUpDown,
  PackageOpen,
  Printer,
} from "lucide-react";
import { printReceiptDocument } from "@/lib/print-document";
import { receiptService } from "@/services/receipt-service";

interface ReceiptListTableProps {
  receipts: Receipt[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
  isLoading: boolean;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
  onPageChange: (newPage: number) => void;
  onViewReceipt: (receiptId: string) => void;
}

export const ReceiptListTable: React.FC<ReceiptListTableProps> = ({
  receipts,
  total,
  page,
  pageSize,
  pages,
  isLoading,
  sortBy,
  sortOrder,
  onSort,
  onPageChange,
  onViewReceipt,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] uppercase font-semibold text-slate-500 tracking-wider">
              <th
                onClick={() => onSort("receipt_number")}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Receipt #</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3.5 px-4">Supplier</th>
              <th className="py-3.5 px-4">Destination Location</th>
              <th className="py-3.5 px-4 text-center">Items</th>
              <th className="py-3.5 px-4 text-right">Total Units</th>
              <th
                onClick={() => onSort("created_at")}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Date Created</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-4 px-4"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                  <td className="py-4 px-4 text-center"><div className="h-4 w-8 bg-slate-200 dark:bg-slate-800 rounded mx-auto" /></td>
                  <td className="py-4 px-4 text-right"><div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded ml-auto" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                  <td className="py-4 px-4 text-right"><div className="h-4 w-8 bg-slate-200 dark:bg-slate-800 rounded ml-auto" /></td>
                </tr>
              ))
            ) : receipts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                    <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <ArrowDownToLine className="h-6 w-6" />
                    </div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      No receipts found
                    </p>
                    <p className="text-xs text-slate-500">
                      No incoming stock orders match the selected filters.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              receipts.map((rec) => (
                <tr
                  key={rec.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                    {rec.receipt_number}
                  </td>
                  <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-medium">
                    {rec.supplier?.name || "Unassigned"}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {rec.destination_location ? (
                      <span>
                        <strong className="text-slate-800 dark:text-slate-200">
                          {rec.destination_location.name}
                        </strong>{" "}
                        <span className="font-mono text-[10px]">({rec.destination_location.code})</span>
                      </span>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-700 dark:text-slate-300">
                    {rec.total_items}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                    {Number(rec.total_quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                    {new Date(rec.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={rec.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            if (!rec.items || rec.items.length === 0) {
                              const full = await receiptService.getReceiptById(rec.id);
                              printReceiptDocument(full);
                            } else {
                              printReceiptDocument(rec);
                            }
                          } catch {
                            printReceiptDocument(rec);
                          }
                        }}
                        className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        title="Print / PDF Goods Receipt Note"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewReceipt(rec.id)}
                        className="h-7 px-2.5 text-xs text-primary hover:bg-primary/10 flex items-center gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Details</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-800/20">
          <div>
            Showing <strong className="text-slate-800 dark:text-slate-200">{(page - 1) * pageSize + 1}</strong> to{" "}
            <strong className="text-slate-800 dark:text-slate-200">{Math.min(page * pageSize, total)}</strong> of{" "}
            <strong className="text-slate-800 dark:text-slate-200">{total}</strong> receipts
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="h-7 px-2.5 text-xs flex items-center gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </Button>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Page {page} of {pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= pages}
              className="h-7 px-2.5 text-xs flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
