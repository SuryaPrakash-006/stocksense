import React, { useEffect, useState } from "react";
import { ProductListItem } from "@/types/product";
import { Location } from "@/types/warehouse";
import { InventoryAdjustmentCreatePayload } from "@/types/adjustment";
import { adjustmentService } from "@/services/adjustment-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Package,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";

interface CreateAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: InventoryAdjustmentCreatePayload) => Promise<void>;
  products: ProductListItem[];
  locations: Location[];
  isSubmitting: boolean;
}

export const CreateAdjustmentModal: React.FC<CreateAdjustmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  products,
  locations,
  isSubmitting,
}) => {
  const [productId, setProductId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [recordedStock, setRecordedStock] = useState<number | null>(null);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [countedQty, setCountedQty] = useState("");
  const [reason, setReason] = useState("");
  const [adjustmentNumber, setAdjustmentNumber] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Fetch recorded stock at specific location when product and location are selected
  useEffect(() => {
    let active = true;
    if (productId && locationId) {
      setIsLoadingStock(true);
      adjustmentService
        .getRecordedStock(productId, locationId)
        .then((data) => {
          if (active) {
            setRecordedStock(parseFloat(String(data.recorded_quantity || 0)));
            setIsLoadingStock(false);
          }
        })
        .catch(() => {
          if (active) {
            setRecordedStock(0);
            setIsLoadingStock(false);
          }
        });
    } else {
      setRecordedStock(null);
    }
    return () => {
      active = false;
    };
  }, [productId, locationId]);

  if (!isOpen) return null;

  const selectedProduct = products.find((p) => p.id === productId);
  const parsedCounted = parseFloat(countedQty);
  const hasCount = !isNaN(parsedCounted) && parsedCounted >= 0;
  const calculatedDiff =
    hasCount && recordedStock !== null ? parsedCounted - recordedStock : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!productId) {
      setError("Please select a product.");
      return;
    }
    if (!locationId) {
      setError("Please select a warehouse location.");
      return;
    }
    if (!hasCount) {
      setError("Counted quantity must be a non-negative number (0 or higher).");
      return;
    }

    try {
      await onSubmit({
        adjustment_number: adjustmentNumber.trim() || undefined,
        product_id: productId,
        location_id: locationId,
        counted_quantity: countedQty,
        reason: reason.trim() || undefined,
      });

      // Reset
      setProductId("");
      setLocationId("");
      setCountedQty("");
      setReason("");
      setAdjustmentNumber("");
      setRecordedStock(null);
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || "Failed to create adjustment.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-lg my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-lg">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                New Stock Adjustment
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Reconcile recorded stock with physical count
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Product Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-purple-600" />
              Product to Adjust *
            </Label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-input bg-white dark:bg-slate-900 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              required
            >
              <option value="">Select product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Total stock: {parseFloat(String(p.total_stock)).toLocaleString()} {p.unit_of_measure}
                </option>
              ))}
            </select>
          </div>

          {/* Location Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-indigo-600" />
              Warehouse Location *
            </Label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-input bg-white dark:bg-slate-900 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              required
            >
              <option value="">Select location...</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.code})
                </option>
              ))}
            </select>
          </div>

          {/* Current Recorded Stock Box */}
          {productId && locationId && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500">Current Recorded Stock:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {isLoadingStock ? (
                  "Checking..."
                ) : (
                  `${(recordedStock ?? 0).toLocaleString()} ${selectedProduct?.unit_of_measure || "units"}`
                )}
              </span>
            </div>
          )}

          {/* Counted Quantity */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Physically Counted Quantity *
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                step="any"
                placeholder="Enter physical count"
                value={countedQty}
                onChange={(e) => setCountedQty(e.target.value)}
                className="h-9 text-sm"
                required
              />
              {selectedProduct && (
                <span className="text-xs font-medium text-slate-500 shrink-0">
                  {selectedProduct.unit_of_measure}
                </span>
              )}
            </div>
          </div>

          {/* Real-time Calculated Difference Preview */}
          {calculatedDiff !== null && (
            <div
              className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                calculatedDiff > 0
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-300"
                  : calculatedDiff < 0
                  ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-800 dark:text-rose-300"
                  : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 text-slate-700 dark:text-slate-300"
              }`}
            >
              <div className="flex items-center gap-1.5 font-medium">
                {calculatedDiff > 0 ? (
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                ) : calculatedDiff < 0 ? (
                  <TrendingDown className="h-4 w-4 text-rose-600" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-slate-500" />
                )}
                <span>Automatically Calculated Difference:</span>
              </div>
              <span className="font-bold text-sm">
                {calculatedDiff > 0 ? `+${calculatedDiff.toLocaleString()}` : calculatedDiff.toLocaleString()}{" "}
                {selectedProduct?.unit_of_measure}
              </span>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Reason / Audit Reference
            </Label>
            <Input
              placeholder="e.g. Quarterly physical stocktake / Damaged inventory write-off"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          {/* Custom Adjustment Number */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Adjustment Number (Optional)
            </Label>
            <Input
              placeholder="Auto-generated if blank (e.g. ADJ-...)"
              value={adjustmentNumber}
              onChange={(e) => setAdjustmentNumber(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="text-xs h-9 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isSubmitting ? "Creating..." : "Create Adjustment Draft"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
