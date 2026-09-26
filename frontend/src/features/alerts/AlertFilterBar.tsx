import React from "react";
import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product-service";
import { warehouseService } from "@/services/warehouse-service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RotateCcw, Filter } from "lucide-react";

interface AlertFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedWarehouse: string;
  onWarehouseChange: (val: string) => void;
  selectedCategory: string;
  onCategoryChange: (val: string) => void;
  selectedStatus?: string;
  onStatusChange?: (val: string) => void;
  showStatusFilter?: boolean;
  onReset: () => void;
}

export const AlertFilterBar: React.FC<AlertFilterBarProps> = ({
  search,
  onSearchChange,
  selectedWarehouse,
  onWarehouseChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  showStatusFilter = false,
  onReset,
}) => {
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => productService.getCategories(),
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => warehouseService.getWarehouses(),
  });

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(selectedWarehouse) ||
    Boolean(selectedCategory) ||
    (Boolean(selectedStatus) && selectedStatus !== "ALL");

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by SKU, product name, or location..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Warehouse Filter */}
        <div className="w-full md:w-48">
          <select
            value={selectedWarehouse}
            onChange={(e) => onWarehouseChange(e.target.value)}
            className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-xs transition-colors dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name} ({wh.code})
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="w-full md:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-xs transition-colors dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Optional Status Filter */}
        {showStatusFilter && onStatusChange && (
          <div className="w-full md:w-44">
            <select
              value={selectedStatus || "ALL"}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-xs transition-colors dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Statuses</option>
              <option value="LOW_STOCK">Low Stock Only</option>
              <option value="OUT_OF_STOCK">Out of Stock Only</option>
              <option value="IN_STOCK">Healthy / In Stock</option>
            </select>
          </div>
        )}

        {/* Reset Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-9 px-3 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
};
