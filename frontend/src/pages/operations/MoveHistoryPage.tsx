import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { moveService } from "@/services/move-service";
import { warehouseService } from "@/services/warehouse-service";
import { MoveFilterParams, StockLedgerEntry, TransactionType } from "@/types/move";
import { Location, Warehouse } from "@/types/warehouse";
import { MoveDetailModal } from "@/features/moves/MoveDetailModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  History,
  Layers,
  Lock,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const MoveHistoryPage: React.FC = () => {
  // Filters
  const [search, setSearch] = useState("");
  const [txType, setTxType] = useState<string>("");
  const [locationId, setLocationId] = useState<string>("");
  const [warehouseId, setWarehouseId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Selected entry for modal view
  const [selectedEntry, setSelectedEntry] = useState<StockLedgerEntry | null>(null);

  const filterParams: MoveFilterParams = {
    search: search.trim() || undefined,
    transaction_type: (txType as TransactionType) || undefined,
    location_id: locationId || undefined,
    warehouse_id: warehouseId || undefined,
    start_date: startDate ? new Date(startDate).toISOString() : undefined,
    end_date: endDate ? new Date(endDate + "T23:59:59").toISOString() : undefined,
    page,
    page_size: pageSize,
    sort_by: sortBy,
    sort_order: sortOrder,
  };

  const {
    data: ledgerData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["stockLedger", filterParams],
    queryFn: () => moveService.listMoves(filterParams),
  });

  const { data: statsData } = useQuery({
    queryKey: ["stockLedgerStats"],
    queryFn: () => moveService.getStats(),
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => warehouseService.getWarehouses(),
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: () => warehouseService.getLocations(),
  });

  const getTxTypeBadge = (type: TransactionType) => {
    switch (type) {
      case "RECEIPT":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200">
            <ArrowDownLeft className="h-3 w-3 mr-1 text-emerald-600" /> Receipt
          </Badge>
        );
      case "DELIVERY":
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200">
            <ArrowUpRight className="h-3 w-3 mr-1 text-blue-600" /> Delivery
          </Badge>
        );
      case "TRANSFER_OUT":
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200">
            <TrendingDown className="h-3 w-3 mr-1 text-amber-600" /> Transfer Out
          </Badge>
        );
      case "TRANSFER_IN":
        return (
          <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200">
            <TrendingUp className="h-3 w-3 mr-1 text-indigo-600" /> Transfer In
          </Badge>
        );
      case "ADJUSTMENT":
        return (
          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200">
            <SlidersHorizontal className="h-3 w-3 mr-1 text-purple-600" /> Adjustment
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const handleReset = () => {
    setSearch("");
    setTxType("");
    setLocationId("");
    setWarehouseId("");
    setStartDate("");
    setEndDate("");
    setSortBy("created_at");
    setSortOrder("desc");
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    search || txType || locationId || warehouseId || startDate || endDate
  );

  const renderSortHeader = (label: string, field: string, align: "left" | "right" = "left") => (
    <th
      onClick={() => handleSort(field)}
      className={cn(
        "py-3.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors select-none",
        align === "right" ? "text-right" : "text-left"
      )}
    >
      <div className={cn("flex items-center gap-1.5", align === "right" && "justify-end")}>
        <span>{label}</span>
        <ArrowUpDown
          className={cn(
            "h-3.5 w-3.5 transition-colors",
            sortBy === field ? "text-primary font-bold" : "text-slate-400"
          )}
        />
      </div>
    </th>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <History className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Stock Ledger & Move History
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  <Lock className="h-3 w-3 text-slate-400" /> Immutable Audit Trail
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Cryptographic write-once log of all stock receipts, deliveries, internal transfers, and reconciliations
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="h-9 px-3 text-xs gap-1.5 shadow-2xs"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isRefetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total Logged Moves</span>
            <Layers className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {statsData?.total_moves ?? 0}
          </p>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-emerald-600 font-medium">
            <span>Receipts (In)</span>
            <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {statsData?.receipts_count ?? 0}
          </p>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-blue-600 font-medium">
            <span>Deliveries (Out)</span>
            <ArrowUpRight className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {statsData?.deliveries_count ?? 0}
          </p>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-indigo-600 font-medium">
            <span>Transfers</span>
            <Truck className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-indigo-600 mt-1">
            {statsData?.transfers_count ?? 0}
          </p>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-purple-600 font-medium">
            <span>Adjustments</span>
            <SlidersHorizontal className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {statsData?.adjustments_count ?? 0}
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-center">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search product, SKU, user, doc..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* Transaction Type */}
          <div>
            <select
              value={txType}
              onChange={(e) => {
                setTxType(e.target.value);
                setPage(1);
              }}
              className="w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-xs dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Transaction Types</option>
              <option value="RECEIPT">Receipts (Stock In)</option>
              <option value="DELIVERY">Deliveries (Stock Out)</option>
              <option value="TRANSFER_OUT">Transfer Out</option>
              <option value="TRANSFER_IN">Transfer In</option>
              <option value="ADJUSTMENT">Adjustments</option>
            </select>
          </div>

          {/* Warehouse Filter */}
          <div>
            <select
              value={warehouseId}
              onChange={(e) => {
                setWarehouseId(e.target.value);
                setPage(1);
              }}
              className="w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-xs dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((w: Warehouse) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="h-9 text-xs"
              placeholder="From Date"
              title="Filter from Date"
            />
          </div>

          {/* End Date */}
          <div>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="h-9 text-xs"
              placeholder="To Date"
              title="Filter to Date"
            />
          </div>
        </div>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1.5 h-8 px-2"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Filters</span>
            </Button>
          </div>
        )}
      </div>

      {/* Ledger Table */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-3 text-sm text-slate-500">Querying immutable stock ledger...</p>
        </div>
      ) : (ledgerData?.items || []).length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto mb-3">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Stock Movement Records Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Stock ledger entries are created permanently upon validating Receipts, Delivery Orders, Internal Transfers, or Physical Inventory Adjustments.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50">
                  {renderSortHeader("Date / Time", "created_at")}
                  {renderSortHeader("Type", "transaction_type")}
                  {renderSortHeader("Product & SKU", "product_name")}
                  <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Location / Warehouse
                  </th>
                  {renderSortHeader("Qty Before", "quantity_before", "right")}
                  {renderSortHeader("Delta Change", "quantity_change", "right")}
                  {renderSortHeader("Qty After", "quantity_after", "right")}
                  <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="py-3.5 px-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Audit
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {(ledgerData?.items || []).map((entry) => {
                  const change = parseFloat(String(entry.quantity_change));
                  const isPositive = change > 0;

                  return (
                    <tr
                      key={entry.id}
                      onClick={() => setSelectedEntry(entry)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(entry.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Transaction Type */}
                      <td className="py-3.5 px-4">
                        {getTxTypeBadge(entry.transaction_type)}
                      </td>

                      {/* Product */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                          {entry.product_name || "Product"}
                        </div>
                        <div className="text-[11px] font-mono text-primary font-medium">
                          {entry.product_sku}
                        </div>
                      </td>

                      {/* Location & Warehouse */}
                      <td className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300">
                        <div className="font-medium">{entry.location_name}</div>
                        <div className="text-[11px] text-slate-400">{entry.warehouse_name}</div>
                      </td>

                      {/* Qty Before */}
                      <td className="py-3.5 px-4 text-right text-xs text-slate-500 font-mono">
                        {parseFloat(String(entry.quantity_before)).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      {/* Qty Change */}
                      <td className="py-3.5 px-4 text-right text-xs font-mono font-bold">
                        <span
                          className={
                            isPositive
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }
                        >
                          {isPositive
                            ? `+${change.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                            : change.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </span>{" "}
                        <span className="text-[10px] font-normal text-slate-400">
                          {entry.unit_of_measure}
                        </span>
                      </td>

                      {/* Qty After */}
                      <td className="py-3.5 px-4 text-right text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                        {parseFloat(String(entry.quantity_after)).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      {/* User */}
                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          {entry.created_by_name || "System"}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-slate-400 group-hover:text-primary"
                          title="View Ledger Audit Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 gap-3">
            <div className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {(ledgerData?.total || 0) === 0 ? 0 : (page - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {Math.min(page * pageSize, ledgerData?.total || 0)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {ledgerData?.total || 0}
              </span>{" "}
              immutable entries
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="h-8 px-2.5 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
              </Button>
              <span className="text-xs px-2 font-medium text-slate-600 dark:text-slate-300">
                Page {page} of {ledgerData?.pages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= (ledgerData?.pages || 1)}
                onClick={() => setPage(page + 1)}
                className="h-8 px-2.5 text-xs"
              >
                Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      <MoveDetailModal
        isOpen={Boolean(selectedEntry)}
        onClose={() => setSelectedEntry(null)}
        entry={selectedEntry}
      />
    </div>
  );
};
