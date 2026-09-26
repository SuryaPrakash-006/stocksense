import React, { useState } from "react";
import { ProductCategory, ProductCreatePayload } from "@/types/product";
import { Warehouse } from "@/types/warehouse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { AlertCircle, Boxes, Plus, X } from "lucide-react";

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: ProductCreatePayload) => Promise<void>;
  categories: ProductCategory[];
  warehouses: Warehouse[];
}

export const CreateProductModal: React.FC<CreateProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  categories,
  warehouses,
}) => {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [unitOfMeasure, setUnitOfMeasure] = useState("Units");
  const [reorderLevel, setReorderLevel] = useState("0");
  const [hasInitialStock, setHasInitialStock] = useState(false);
  const [initialStock, setInitialStock] = useState("0");
  const [initialLocationId, setInitialLocationId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName("");
    setSku("");
    setCategoryName("");
    setUnitOfMeasure("Units");
    setReorderLevel("0");
    setHasInitialStock(false);
    setInitialStock("0");
    setInitialLocationId(warehouses[0]?.locations[0]?.id || "");
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Product name is required.");
      return;
    }
    if (!sku.trim()) {
      setError("SKU is required.");
      return;
    }

    if (hasInitialStock) {
      if (Number(initialStock) <= 0) {
        setError("Initial stock quantity must be greater than zero.");
        return;
      }
      if (!initialLocationId) {
        setError("Please select a target warehouse location for initial stock.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        category_name: categoryName.trim() || null,
        unit_of_measure: unitOfMeasure.trim(),
        reorder_level: reorderLevel,
        initial_stock: hasInitialStock ? initialStock : null,
        initial_location_id: hasInitialStock ? initialLocationId : null,
      });
      resetForm();
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Failed to create product. Check SKU uniqueness."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Boxes className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Create New Product
              </h2>
              <p className="text-xs text-slate-500">
                Register a new inventory item with reordering rules and location allocation.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Product Name */}
          <div className="space-y-1.5">
            <Label htmlFor="prod-name">Product Name *</Label>
            <Input
              id="prod-name"
              type="text"
              required
              placeholder="e.g. Stainless Steel Rod 10mm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* SKU & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="prod-sku">SKU / Code *</Label>
              <Input
                id="prod-sku"
                type="text"
                required
                placeholder="e.g. STL-ROD-010"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                className="font-mono uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prod-cat">Category</Label>
              <Input
                id="prod-cat"
                type="text"
                list="category-suggestions"
                placeholder="e.g. Raw Materials, Hardware"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
              <datalist id="category-suggestions">
                {categories.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Unit of Measure & Reorder Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="prod-uom">Unit of Measure</Label>
              <select
                id="prod-uom"
                value={unitOfMeasure}
                onChange={(e) => setUnitOfMeasure(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="Units">Units (pcs)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="Meters">Meters (m)</option>
                <option value="Liters">Liters (L)</option>
                <option value="Box">Box (box)</option>
                <option value="Set">Set (set)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prod-reorder">Reorder Threshold Level</Label>
              <Input
                id="prod-reorder"
                type="number"
                min="0"
                step="any"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
              />
            </div>
          </div>

          {/* Initial Stock Section */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200">
              <input
                type="checkbox"
                checked={hasInitialStock}
                onChange={(e) => setHasInitialStock(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <span>Allocate Initial Physical Stock</span>
            </label>

            {hasInitialStock && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <div className="space-y-1.5">
                  <Label htmlFor="init-qty">Initial Quantity *</Label>
                  <Input
                    id="init-qty"
                    type="number"
                    min="0.0001"
                    step="any"
                    value={initialStock}
                    onChange={(e) => setInitialStock(e.target.value)}
                    placeholder="e.g. 50"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="init-loc">Target Location *</Label>
                  <select
                    id="init-loc"
                    value={initialLocationId}
                    onChange={(e) => setInitialLocationId(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="" className="dark:bg-slate-900">Select Warehouse Location</option>
                    {warehouses.map((wh) => (
                      <optgroup key={wh.id} label={`${wh.name} (${wh.code})`}>
                        {wh.locations.map((loc) => (
                          <option key={loc.id} value={loc.id} className="dark:bg-slate-900">
                            {loc.name} ({loc.code})
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              <span>{isSubmitting ? "Creating Product..." : "Create Product"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
