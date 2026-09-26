import React, { useState } from "react";
import { ProductCategory, ProductListItem, ProductUpdatePayload } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Edit2, Save, X } from "lucide-react";

interface EditProductModalProps {
  isOpen: boolean;
  product: ProductListItem | null;
  onClose: () => void;
  onSubmit: (id: string, payload: ProductUpdatePayload) => Promise<void>;
  categories: ProductCategory[];
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  product,
  onClose,
  onSubmit,
  categories,
}) => {
  if (!isOpen || !product) return null;

  const [name, setName] = useState(product.name);
  const [sku, setSku] = useState(product.sku);
  const [categoryName, setCategoryName] = useState(product.category?.name || "");
  const [unitOfMeasure, setUnitOfMeasure] = useState(product.unit_of_measure);
  const [reorderLevel, setReorderLevel] = useState(String(product.reorder_level));
  const [isActive, setIsActive] = useState(product.is_active);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setIsSubmitting(true);
    try {
      await onSubmit(product.id, {
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        category_name: categoryName.trim() || null,
        unit_of_measure: unitOfMeasure.trim(),
        reorder_level: reorderLevel,
        is_active: isActive,
      });
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Failed to update product details."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Edit2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Edit Product Specification
              </h2>
              <p className="text-xs text-slate-500">
                Updating SKU: <span className="font-mono font-semibold">{product.sku}</span>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="edit-prod-name">Product Name *</Label>
            <Input
              id="edit-prod-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-prod-sku">SKU / Code *</Label>
              <Input
                id="edit-prod-sku"
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                className="font-mono uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-prod-cat">Category</Label>
              <Input
                id="edit-prod-cat"
                type="text"
                list="edit-category-suggestions"
                placeholder="e.g. Raw Materials, Hardware"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
              <datalist id="edit-category-suggestions">
                {categories.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-prod-uom">Unit of Measure</Label>
              <select
                id="edit-prod-uom"
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
              <Label htmlFor="edit-prod-reorder">Reorder Threshold Level</Label>
              <Input
                id="edit-prod-reorder"
                type="number"
                min="0"
                step="any"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <span>Active Item (visible in operations & orders)</span>
            </label>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex items-center gap-1.5">
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? "Saving Changes..." : "Save Changes"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
