import React from "react";
import { DocumentStatus } from "@/types/receipt";
import { Customer } from "@/types/partner";
import { Warehouse } from "@/types/warehouse";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RotateCcw, Search } from "lucide-react";

interface DeliveryFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedStatus: string;
  onStatusChange: (val: string) => void;
  selectedCustomer: string;
  onCustomerChange: (val: string) => void;
  selectedWarehouse: string;
  onWarehouseChange: (val: string) => void;
  customers: Customer[];
  warehouses: Warehouse[];
  onReset: () => void;
}

export const DeliveryFilters: React.FC<DeliveryFiltersProps> = ({
  search,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedCustomer,
  onCustomerChange,
  selectedWarehouse,
  onWarehouseChange,
  customers,
  warehouses,
  onReset,
}) => {
  const hasActiveFilters =
    Boolean(search) ||
    Boolean(selectedStatus) ||
    Boolean(selectedCustomer) ||
    Boolean(selectedWarehouse);

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search delivery # or customer..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-44">
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="" className="dark:bg-slate-900">All Statuses</option>
            <option value="DRAFT" className="dark:bg-slate-900">Draft</option>
            <option value="WAITING" className="dark:bg-slate-900">Picking (Waiting)</option>
            <option value="READY" className="dark:bg-slate-900">Packed (Ready)</option>
            <option value="DONE" className="dark:bg-slate-900">Done (Shipped)</option>
            <option value="CANCELED" className="dark:bg-slate-900">Canceled</option>
          </select>
        </div>

        {/* Customer Filter */}
        <div className="w-full md:w-52">
          <select
            value={selectedCustomer}
            onChange={(e) => onCustomerChange(e.target.value)}
            className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="" className="dark:bg-slate-900">All Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id} className="dark:bg-slate-900">
                {c.name}
              </option>
            ))}
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

        {/* Reset */}
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
