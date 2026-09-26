import React from "react";
import { AdjustmentStatus } from "@/types/adjustment";
import { Warehouse, Location } from "@/types/warehouse";
import { ProductListItem } from "@/types/product";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RotateCcw, Search } from "lucide-react";

interface AdjustmentFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedStatus: string;
  onStatusChange: (val: string) => void;
  selectedLocation: string;
  onLocationChange: (val: string) => void;
  selectedWarehouse: string;
  onWarehouseChange: (val: string) => void;
  warehouses: Warehouse[];
  locations: Location[];
  onReset: () => void;
}

export const AdjustmentFilters: React.FC<AdjustmentFiltersProps> = ({
  search,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedLocation,
  onLocationChange,
  selectedWarehouse,
  onWarehouseChange,
  warehouses,
  locations,
  onReset,
}) => {
  const hasActiveFilters =
    Boolean(search) ||
    Boolean(selectedStatus) ||
    Boolean(selectedLocation) ||
    Boolean(selectedWarehouse);

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search adjustment #, SKU, reason..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Status */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="" className="dark:bg-slate-900">All Statuses</option>
            <option value="DRAFT" className="dark:bg-slate-900">Draft (Pending Audit)</option>
            <option value="DONE" className="dark:bg-slate-900">Applied (Completed)</option>
            <option value="CANCELED" className="dark:bg-slate-900">Canceled</option>
          </select>
        </div>

        {/* Location Filter */}
        <div>
          <select
            value={selectedLocation}
            onChange={(e) => onLocationChange(e.target.value)}
            className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="" className="dark:bg-slate-900">All Locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id} className="dark:bg-slate-900">
                {loc.name} ({loc.code})
              </option>
            ))}
          </select>
        </div>

        {/* Warehouse Filter */}
        <div>
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

        {/* Reset button */}
        <div className="flex justify-end">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1.5 h-9"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Filters</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
