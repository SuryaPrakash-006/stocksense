import React from "react";
import { DocumentStatus } from "@/types/receipt";
import { DeliveryOrder } from "@/types/delivery";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { Button } from "@/components/ui/button";
import {
  ArrowUpFromLine,
  ChevronLeft,
  ChevronRight,
  Eye,
  ArrowUpDown,
  Printer,
} from "lucide-react";
import { printDeliveryDocument } from "@/lib/print-document";
import { deliveryService } from "@/services/delivery-service";

interface DeliveryListTableProps {
  deliveries: DeliveryOrder[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
  isLoading: boolean;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
  onPageChange: (newPage: number) => void;
  onViewDelivery: (deliveryId: string) => void;
}

export const DeliveryListTable: React.FC<DeliveryListTableProps> = ({
  deliveries,
  total,
  page,
  pageSize,
  pages,
  isLoading,
  sortBy,
  sortOrder,
  onSort,
  onPageChange,
  onViewDelivery,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] uppercase font-semibold text-slate-500 tracking-wider">
              <th
                onClick={() => onSort("delivery_number")}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Delivery #</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3.5 px-4">Customer</th>
              <th className="py-3.5 px-4">Source Location</th>
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
            ) : deliveries.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                    <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <ArrowUpFromLine className="h-6 w-6" />
                    </div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      No delivery orders found
                    </p>
                    <p className="text-xs text-slate-500">
                      No outgoing shipments match the current filters.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              deliveries.map((del) => (
                <tr
                  key={del.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                    {del.delivery_number}
                  </td>
                  <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-medium">
                    {del.customer?.name || "Unassigned"}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {del.source_location ? (
                      <span>
                        <strong className="text-slate-800 dark:text-slate-200">
                          {del.source_location.name}
                        </strong>{" "}
                        <span className="font-mono text-[10px]">({del.source_location.code})</span>
                      </span>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-700 dark:text-slate-300">
                    {del.total_items}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                    {Number(del.total_quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                    {new Date(del.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={del.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            if (!del.items || del.items.length === 0) {
                              const full = await deliveryService.getDeliveryById(del.id);
                              printDeliveryDocument(full);
                            } else {
                              printDeliveryDocument(del);
                            }
                          } catch {
                            printDeliveryDocument(del);
                          }
                        }}
                        className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        title="Print / PDF Delivery Packing Slip"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDelivery(del.id)}
                        className="h-7 px-2.5 text-xs text-primary hover:bg-primary/10 flex items-center gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Inspect</span>
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
            <strong className="text-slate-800 dark:text-slate-200">{total}</strong> orders
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
