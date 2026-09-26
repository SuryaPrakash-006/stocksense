import React, { useState } from "react";
import { ProductListItem } from "@/types/product";
import { Warehouse, Location } from "@/types/warehouse";
import { InternalTransferCreatePayload } from "@/types/transfer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  ArrowRight,
  Plus,
  Trash2,
  X,
  Truck,
  Building2,
} from "lucide-react";

interface CreateTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: InternalTransferCreatePayload) => Promise<void>;
  products: ProductListItem[];
  warehouses: Warehouse[];
  locations: Location[];
  isSubmitting: boolean;
}

interface ItemRow {
  product_id: string;
  quantity: string;
}

export const CreateTransferModal: React.FC<CreateTransferModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  products,
  locations,
  isSubmitting,
}) => {
  const [sourceLocationId, setSourceLocationId] = useState("");
  const [destLocationId, setDestLocationId] = useState("");
  const [transferNumber, setTransferNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemRow[]>([{ product_id: "", quantity: "1" }]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([...items, { product_id: "", quantity: "1" }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ItemRow, value: string) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!sourceLocationId) {
      setError("Please select a source warehouse location.");
      return;
    }
    if (!destLocationId) {
      setError("Please select a destination warehouse location.");
      return;
    }
    if (sourceLocationId === destLocationId) {
      setError("Source location and destination location must be different.");
      return;
    }

    // Validate items
    const formattedItems = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.product_id) {
        setError(`Please select a product for item #${i + 1}.`);
        return;
      }
      const qty = parseFloat(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        setError(`Item #${i + 1} has an invalid quantity. Must be greater than 0.`);
        return;
      }
      formattedItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
      });
    }

    try {
      await onSubmit({
        transfer_number: transferNumber.trim() || undefined,
        source_location_id: sourceLocationId,
        destination_location_id: destLocationId,
        notes: notes.trim() || undefined,
        items: formattedItems,
      });
      // Reset form
      setSourceLocationId("");
      setDestLocationId("");
      setTransferNumber("");
      setNotes("");
      setItems([{ product_id: "", quantity: "1" }]);
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || "Failed to create internal transfer.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-2xl my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                New Internal Transfer
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Move stock between locations or warehouses
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Locations Routing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            {/* Source */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                Source Location *
              </Label>
              <select
                value={sourceLocationId}
                onChange={(e) => setSourceLocationId(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-white dark:bg-slate-900 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                <option value="">Select source location...</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Destination */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ArrowRight className="h-3.5 w-3.5 text-emerald-500" />
                Destination Location *
              </Label>
              <select
                value={destLocationId}
                onChange={(e) => setDestLocationId(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-white dark:bg-slate-900 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                <option value="">Select destination location...</option>
                {locations.map((loc) => (
                  <option
                    key={loc.id}
                    value={loc.id}
                    disabled={loc.id === sourceLocationId}
                  >
                    {loc.name} ({loc.code}) {loc.id === sourceLocationId ? "(Source)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Transfer Number & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Transfer Number (Optional)
              </Label>
              <Input
                placeholder="Auto-generated if blank (e.g. TRF-...)"
                value={transferNumber}
                onChange={(e) => setTransferNumber(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Notes / Reference
              </Label>
              <Input
                placeholder="e.g. Replenish retail showroom"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Products to Move ({items.length})
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="h-7 text-xs flex items-center gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Product</span>
              </Button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {items.map((row, idx) => {
                const selectedProd = products.find((p) => p.id === row.product_id);
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex-1">
                      <select
                        value={row.product_id}
                        onChange={(e) =>
                          handleItemChange(idx, "product_id", e.target.value)
                        }
                        className="w-full h-8 px-2 rounded border border-input bg-white dark:bg-slate-900 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        required
                      >
                        <option value="">Select product...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku}) - {p.unit_of_measure}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-28">
                      <Input
                        type="number"
                        min="0.0001"
                        step="any"
                        placeholder="Quantity"
                        value={row.quantity}
                        onChange={(e) =>
                          handleItemChange(idx, "quantity", e.target.value)
                        }
                        className="h-8 text-xs text-right"
                        required
                      />
                    </div>

                    {selectedProd && (
                      <span className="text-xs text-slate-400 w-12 truncate">
                        {selectedProd.unit_of_measure}
                      </span>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={items.length <= 1}
                      onClick={() => handleRemoveItem(idx)}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 disabled:opacity-30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
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
              className="text-xs h-9 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isSubmitting ? "Creating Transfer..." : "Create Transfer Request"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
