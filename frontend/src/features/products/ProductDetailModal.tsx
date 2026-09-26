import React from "react";
import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Boxes,
  Building2,
  Calendar,
  History,
  MapPin,
  RefreshCw,
  X,
  TrendingDown,
  TrendingUp,
  SlidersHorizontal,
  ArrowRightLeft,
} from "lucide-react";

interface ProductDetailModalProps {
  productId: string | null;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  productId,
  onClose,
}) => {
  const { data: product, isLoading, error, refetch } = useQuery({
    queryKey: ["product-detail", productId],
    queryFn: () => (productId ? productService.getProductById(productId) : null),
    enabled: !!productId,
  });

  if (!productId) return null;

  const renderMovementIcon = (type: string) => {
    switch (type) {
      case "RECEIPT":
        return <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />;
      case "DELIVERY":
        return <TrendingDown className="h-3.5 w-3.5 text-rose-600" />;
      case "TRANSFER_IN":
      case "TRANSFER_OUT":
        return <ArrowRightLeft className="h-3.5 w-3.5 text-blue-600" />;
      case "ADJUSTMENT":
        return <SlidersHorizontal className="h-3.5 w-3.5 text-amber-600" />;
      default:
        return <History className="h-3.5 w-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {product?.name || "Product Master Details"}
                </h2>
                {product && (
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 border">
                    {product.sku}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Detailed location stock balances and complete movement ledger
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500">
              <RefreshCw className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-xs">Loading product specification and stock balances...</p>
            </div>
          ) : error || !product ? (
            <div className="p-4 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-xs">
              Failed to load product details.
            </div>
          ) : (
            <>
              {/* Top Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg border bg-slate-50/50 dark:bg-slate-800/30">
                  <p className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                    Total On-Hand Stock
                  </p>
                  <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                    {Number(product.total_stock).toLocaleString()} <span className="text-xs font-normal text-slate-500">{product.unit_of_measure}</span>
                  </p>
                </div>

                <div className="p-4 rounded-lg border bg-slate-50/50 dark:bg-slate-800/30">
                  <p className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                    Reorder Threshold
                  </p>
                  <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                    {Number(product.reorder_level).toLocaleString()} <span className="text-xs font-normal text-slate-500">{product.unit_of_measure}</span>
                  </p>
                </div>

                <div className="p-4 rounded-lg border bg-slate-50/50 dark:bg-slate-800/30">
                  <p className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                    Category
                  </p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mt-2">
                    {product.category?.name || "Unassigned"}
                  </p>
                </div>

                <div className="p-4 rounded-lg border bg-slate-50/50 dark:bg-slate-800/30">
                  <p className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                    Stock Health
                  </p>
                  <div className="mt-2">
                    {Number(product.total_stock) <= 0 ? (
                      <Badge variant="destructive">Out of Stock</Badge>
                    ) : Number(product.total_stock) <= Number(product.reorder_level) ? (
                      <Badge variant="warning">Low Stock</Badge>
                    ) : (
                      <Badge variant="success">Healthy Stock</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Location Balances Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>Stock Availability by Warehouse Location</span>
                  </h3>
                  <span className="text-xs text-slate-500">
                    {product.location_stocks.length} storage location(s)
                  </span>
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b text-[11px] uppercase font-semibold text-slate-500">
                        <th className="py-2.5 px-4">Warehouse</th>
                        <th className="py-2.5 px-4">Location Name</th>
                        <th className="py-2.5 px-4">Location Code</th>
                        <th className="py-2.5 px-4">Type</th>
                        <th className="py-2.5 px-4 text-right">Available Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {product.location_stocks.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-500">
                            No physical stock recorded in any location yet.
                          </td>
                        </tr>
                      ) : (
                        product.location_stocks.map((loc) => (
                          <tr key={loc.location_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                              {loc.warehouse_name} ({loc.warehouse_code})
                            </td>
                            <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">
                              {loc.location_name}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                              {loc.location_code}
                            </td>
                            <td className="py-2.5 px-4">
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                                {loc.location_type}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                              {Number(loc.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {product.unit_of_measure}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Movement History / Audit Ledger */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <History className="h-4 w-4 text-primary" />
                    <span>Stock Movement Ledger Audit Trail</span>
                  </h3>
                  <span className="text-xs text-slate-500">
                    Latest {product.movements.length} transactions
                  </span>
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b text-[11px] uppercase font-semibold text-slate-500">
                        <th className="py-2.5 px-4">Timestamp (UTC)</th>
                        <th className="py-2.5 px-4">Transaction</th>
                        <th className="py-2.5 px-4">Location</th>
                        <th className="py-2.5 px-4 text-right">Quantity Change</th>
                        <th className="py-2.5 px-4 text-right">Balance After</th>
                        <th className="py-2.5 px-4">Performed By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {product.movements.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-500">
                            No ledger movements recorded for this product yet.
                          </td>
                        </tr>
                      ) : (
                        product.movements.map((mov) => {
                          const delta = Number(mov.quantity_change);
                          return (
                            <tr key={mov.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                              <td className="py-2.5 px-4 font-mono text-slate-500">
                                {new Date(mov.created_at).toLocaleString()}
                              </td>
                              <td className="py-2.5 px-4 font-semibold">
                                <div className="flex items-center gap-1.5">
                                  {renderMovementIcon(mov.transaction_type)}
                                  <span>{mov.transaction_type}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">
                                {mov.warehouse_name} · {mov.location_name}
                              </td>
                              <td
                                className={`py-2.5 px-4 text-right font-mono font-bold ${
                                  delta > 0
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : delta < 0
                                    ? "text-rose-600 dark:text-rose-400"
                                    : "text-slate-600"
                                }`}
                              >
                                {delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white">
                                {Number(mov.quantity_after).toFixed(2)}
                              </td>
                              <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                                {mov.created_by_name || "System"}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end shrink-0">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
