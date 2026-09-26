import React from "react";
import { ProductListItem } from "@/types/product";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  PackageOpen,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
} from "lucide-react";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { TableSkeleton } from "@/components/ui/TableSkeleton";

interface ProductListTableProps {
  products: ProductListItem[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
  isLoading: boolean;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
  onPageChange: (newPage: number) => void;
  onViewProduct: (productId: string) => void;
  onEditProduct: (product: ProductListItem) => void;
  onDeleteProduct: (product: ProductListItem) => void;
  onAddProduct?: () => void;
  isManager: boolean;
}

export const ProductListTable: React.FC<ProductListTableProps> = ({
  products,
  total,
  page,
  pageSize,
  pages,
  isLoading,
  sortBy,
  sortOrder,
  onSort,
  onPageChange,
  onViewProduct,
  onEditProduct,
  onDeleteProduct,
  onAddProduct,
  isManager,
}) => {
  const getProductStockStatus = (totalStock: string | number, reorderLevel: string | number) => {
    const qty = Number(totalStock);
    const reorder = Number(reorderLevel);
    if (qty <= 0) return "OUT_OF_STOCK";
    if (qty <= reorder) return "LOW_STOCK";
    return "IN_STOCK";
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] uppercase font-semibold text-slate-500 tracking-wider">
              <th
                onClick={() => onSort("sku")}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>SKU / Code</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => onSort("name")}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Product Name</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Unit</th>
              <th
                onClick={() => onSort("stock")}
                className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>On-Hand Stock</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => onSort("reorder_level")}
                className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Reorder Level</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3.5 px-4">Stock Health</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-4 px-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                  <td className="py-4 px-4 text-right"><div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded ml-auto" /></td>
                  <td className="py-4 px-4 text-right"><div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded ml-auto" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                  <td className="py-4 px-4 text-right"><div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded ml-auto" /></td>
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                    <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <PackageOpen className="h-6 w-6" />
                    </div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      No products found
                    </p>
                    <p className="text-xs text-slate-500">
                      No inventory items match the specified filters or database catalog is empty.
                    </p>
                    {onAddProduct && (
                      <Button
                        size="sm"
                        onClick={onAddProduct}
                        className="mt-2 text-xs flex items-center gap-1.5 shadow-sm"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Product to Catalog</span>
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              products.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                >
                  <td className="py-3 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      {item.sku}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                    {item.name}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {item.category?.name || <span className="text-slate-400 italic">Unassigned</span>}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {item.unit_of_measure}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                    {Number(item.total_stock).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                    {Number(item.reorder_level).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={getProductStockStatus(item.total_stock, item.reorder_level)} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewProduct(item.id)}
                        className="h-7 w-7 p-0 text-slate-500 hover:text-primary"
                        title="View Product Stock & Ledger"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {isManager && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditProduct(item)}
                            className="h-7 w-7 p-0 text-slate-500 hover:text-amber-600"
                            title="Edit Product"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteProduct(item)}
                            className="h-7 w-7 p-0 text-slate-500 hover:text-rose-600"
                            title="Deactivate Product"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
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
            <strong className="text-slate-800 dark:text-slate-200">{total}</strong> products
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
