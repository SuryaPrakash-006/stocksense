import React, { useState } from "react";
import { ProductCategory, ProductCategoryCreate } from "@/types/product";
import { productService } from "@/services/product-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Edit2, FolderTree, Plus, Trash2, X } from "lucide-react";

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ProductCategory[];
  onCategoriesChanged: () => void;
}

export const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({
  isOpen,
  onClose,
  categories,
  onCategoriesChanged,
}) => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await productService.createCategory({
        name: name.trim(),
        code: code.trim().toUpperCase() || undefined,
        description: description.trim() || undefined,
      });
      setName("");
      setCode("");
      setDescription("");
      onCategoriesChanged();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (cat: ProductCategory) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditCode(cat.code || "");
  };

  const handleSaveEdit = async (catId: string) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await productService.updateCategory(catId, {
        name: editName.trim(),
        code: editCode.trim().toUpperCase() || undefined,
      });
      setEditingId(null);
      onCategoriesChanged();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (catId: string) => {
    setError(null);
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      await productService.deleteCategory(catId);
      onCategoriesChanged();
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Cannot delete category with assigned products."
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <FolderTree className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Product Category Hierarchy
              </h2>
              <p className="text-xs text-slate-500">
                Organize inventory classification and group taxonomy
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

        <div className="p-6 space-y-6">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Add Category Form */}
          <form onSubmit={handleCreate} className="p-4 rounded-lg border bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Create New Category
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="cat-name" className="text-xs">Category Name *</Label>
                <Input
                  id="cat-name"
                  type="text"
                  required
                  placeholder="e.g. Raw Metals"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label htmlFor="cat-code" className="text-xs">Code / Prefix</Label>
                <Input
                  id="cat-code"
                  type="text"
                  placeholder="e.g. RAW-MET"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="h-8 text-xs font-mono uppercase mt-1"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="w-full h-8 text-xs flex items-center justify-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Category</span>
                </Button>
              </div>
            </div>
          </form>

          {/* Category List */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Existing Categories ({categories.length})
            </h3>
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {categories.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No categories created yet. Add one above.
                </div>
              ) : (
                categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 text-xs"
                  >
                    {editingId === cat.id ? (
                      <div className="flex items-center gap-2 flex-1 mr-3">
                        <Input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-7 text-xs flex-1"
                        />
                        <Input
                          type="text"
                          value={editCode}
                          onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                          className="h-7 text-xs w-28 font-mono"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(cat.id)}
                          className="h-7 text-xs px-2"
                        >
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(null)}
                          className="h-7 text-xs px-2"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {cat.name}
                            </span>
                            {cat.code && (
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 border">
                                {cat.code}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {cat.product_count || 0} active product(s) assigned
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartEdit(cat)}
                            className="h-7 w-7 p-0 text-slate-500 hover:text-amber-600"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(cat.id)}
                            className="h-7 w-7 p-0 text-slate-500 hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
