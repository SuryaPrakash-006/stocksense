import React from "react";
import { ProductCategory, StockStatus } from "@/types/product";
import { Warehouse } from "@/types/warehouse";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter, RotateCcw, Search } from "lucide-react";

interface ProductFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedCategory: string;
  onCategoryChange: (val: string) => void;
  selectedStockStatus: StockStatus;
  onStockStatusChange: (val: StockStatus) => void;
  selectedWarehouse: string;
  onWarehouseChange: (val: string) => void;
  categories: ProductCategory[];
  warehouses: Warehouse[];
  onReset: () => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStockStatus,
  onStockStatusChange,
  selectedWarehouse,
  onWarehouseChange,
  categories,
  warehouses,
  onReset,
}) => {
  const hasActiveFilters =
    Boolean(search) ||
    Boolean(selectedCategory) ||
    selectedStockStatus !== "ALL" ||
    Boolean(selectedWarehouse);

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by product name or SKU..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Category Filter */}
        <div className="w-full md:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="" className="dark:bg-slate-900">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id} className="dark:bg-slate-900">
                {cat.name} ({cat.product_count || 0})
              </option>
            ))}
          </select>
        </div>

        {/* Stock Status Filter */}
        <div className="w-full md:w-44">
          <select
            value={selectedStockStatus}
            onChange={(e) => onStockStatusChange(e.target.value as StockStatus)}
            className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="ALL" className="dark:bg-slate-900">All Stock Levels</option>
            <option value="IN_STOCK" className="dark:bg-slate-900">In Stock (&gt; Reorder)</option>
            <option value="LOW_STOCK" className="dark:bg-slate-900">Low Stock (≤ Reorder)</option>
            <option value="OUT_OF_STOCK" className="dark:bg-slate-900">Out of Stock (0)</option>
          </select>
        </div>

        {/* Warehouse Filter */}
        <div className="w-full md:w-48">
          <select
            value={selectedWarehouse}
            onChange={(e) => onWarehouseChange(e.target.value)}
            className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="" className="dark:bg-slate-900">All Warehouses</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id} className="dark:bg-slate-900">
                {wh.name} ({wh.code})
              </option>
            ))}
          </select>
        </div>

        {/* Reset Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1.5 shrink-0 h-9 px-3"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </Button>
        )}
      </div>
    </div>
  );
};
