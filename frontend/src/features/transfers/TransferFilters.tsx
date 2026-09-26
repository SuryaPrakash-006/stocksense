import React from "react";
import { Warehouse, Location } from "@/types/warehouse";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RotateCcw, Search } from "lucide-react";

interface TransferFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedStatus: string;
  onStatusChange: (val: string) => void;
  selectedSourceLocation: string;
  onSourceLocationChange: (val: string) => void;
  selectedDestLocation: string;
  onDestLocationChange: (val: string) => void;
  selectedWarehouse: string;
  onWarehouseChange: (val: string) => void;
  warehouses: Warehouse[];
  locations: Location[];
  onReset: () => void;
}

export const TransferFilters: React.FC<TransferFiltersProps> = ({
  search,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedSourceLocation,
  onSourceLocationChange,
  selectedDestLocation,
  onDestLocationChange,
  selectedWarehouse,
  onWarehouseChange,
  warehouses,
  locations,
  onReset,
}) => {
  const hasActiveFilters =
    Boolean(search) ||
    Boolean(selectedStatus) ||
    Boolean(selectedSourceLocation) ||
    Boolean(selectedDestLocation) ||
    Boolean(selectedWarehouse);

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search transfer #..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="" className="dark:bg-slate-900">All Statuses</option>
            <option value="DRAFT" className="dark:bg-slate-900">Draft</option>
            <option value="READY" className="dark:bg-slate-900">Ready</option>
            <option value="DONE" className="dark:bg-slate-900">Done (Completed)</option>
            <option value="CANCELED" className="dark:bg-slate-900">Canceled</option>
          </select>
        </div>

        {/* Source Location Filter */}
        <div>
          <select
            value={selectedSourceLocation}
            onChange={(e) => onSourceLocationChange(e.target.value)}
            className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="" className="dark:bg-slate-900">All Source Locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id} className="dark:bg-slate-900">
                Src: {loc.name} ({loc.code})
              </option>
            ))}
          </select>
        </div>

        {/* Destination Location Filter */}
        <div>
          <select
            value={selectedDestLocation}
            onChange={(e) => onDestLocationChange(e.target.value)}
            className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="" className="dark:bg-slate-900">All Dest Locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id} className="dark:bg-slate-900">
                Dst: {loc.name} ({loc.code})
              </option>
            ))}
          </select>
        </div>

        {/* Warehouse Filter / Reset */}
        <div className="flex gap-2 items-center">
          <div className="flex-1">
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
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1.5 shrink-0 h-9 px-2.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
