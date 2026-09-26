import React from "react";
import { StockLedgerEntry } from "@/types/move";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  Building2,
  Calendar,
  FileText,
  History,
  Lock,
  MapPin,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  User as UserIcon,
  X,
} from "lucide-react";

interface MoveDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: StockLedgerEntry | null;
}

export const MoveDetailModal: React.FC<MoveDetailModalProps> = ({
  isOpen,
  onClose,
  entry,
}) => {
  if (!isOpen || !entry) return null;

  const change = parseFloat(String(entry.quantity_change));
  const isPositive = change > 0;

  const getTxTypeBadge = (type: string) => {
    switch (type) {
      case "RECEIPT":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200">
            <ArrowDownLeft className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Vendor Receipt (+Stock)
          </Badge>
        );
      case "DELIVERY":
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200">
            <ArrowUpRight className="h-3.5 w-3.5 mr-1 text-blue-600" /> Customer Delivery (-Stock)
          </Badge>
        );
      case "TRANSFER_OUT":
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200">
            <TrendingDown className="h-3.5 w-3.5 mr-1 text-amber-600" /> Internal Transfer Out (-Stock)
          </Badge>
        );
      case "TRANSFER_IN":
        return (
          <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200">
            <TrendingUp className="h-3.5 w-3.5 mr-1 text-indigo-600" /> Internal Transfer In (+Stock)
          </Badge>
        );
      case "ADJUSTMENT":
        return (
          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200">
            <SlidersHorizontal className="h-3.5 w-3.5 mr-1 text-purple-600" /> Physical Inventory Adjustment
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <History className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Audit Ledger Record
                </h3>
                <span className="inline-flex items-center gap-1 rounded-xs bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  <Lock className="h-2.5 w-2.5" /> Immutable
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                ID: {entry.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-5 space-y-6">
          {/* Top Summary Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-xs text-slate-500 font-medium">Transaction Classification</p>
              <div className="mt-1">{getTxTypeBadge(entry.transaction_type)}</div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 font-medium">Timestamp</p>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>{new Date(entry.created_at).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Mathematical Balance Delta */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Physical Stock Delta
            </p>
            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <div>
                <p className="text-xs text-slate-500">Recorded Before</p>
                <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                  {parseFloat(String(entry.quantity_before)).toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 4,
                  })}{" "}
                  <span className="text-xs text-slate-400">{entry.unit_of_measure}</span>
                </p>
              </div>
              <div className="border-x border-slate-100 dark:border-slate-800 px-3">
                <p className="text-xs text-slate-500">Quantity Delta (&Delta;Q)</p>
                <p
                  className={`text-lg font-black mt-0.5 ${
                    isPositive ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {isPositive ? `+${change.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })}` : change.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    {entry.unit_of_measure}
                  </span>
                </p>
              </div>
              <div className="pl-2">
                <p className="text-xs text-slate-500">Recorded After</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {parseFloat(String(entry.quantity_after)).toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 4,
                  })}{" "}
                  <span className="text-xs text-slate-400">{entry.unit_of_measure}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product & SKU */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <Boxes className="h-4 w-4 text-primary" />
                <span>Product Item</span>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">
                {entry.product_name || "Unspecified Product"}
              </p>
              <p className="text-xs font-mono text-primary mt-0.5">
                SKU: {entry.product_sku}
              </p>
            </div>

            {/* Location & Warehouse */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <MapPin className="h-4 w-4 text-indigo-500" />
                <span>Location / Facility</span>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">
                {entry.location_name || "Unallocated"}
                {entry.location_code && (
                  <span className="text-xs font-mono text-slate-400 font-normal ml-1.5">
                    ({entry.location_code})
                  </span>
                )}
              </p>
              {entry.warehouse_name && (
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  <span>{entry.warehouse_name}</span>
                </p>
              )}
            </div>

            {/* Source Document */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <FileText className="h-4 w-4 text-amber-500" />
                <span>Reference Document</span>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1.5 uppercase">
                {entry.reference_type}
              </p>
              <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5" title={entry.reference_id}>
                Ref ID: {entry.reference_id}
              </p>
            </div>

            {/* User Attribution */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <UserIcon className="h-4 w-4 text-emerald-500" />
                <span>Authorized User</span>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">
                {entry.created_by_name || "System Automated"}
              </p>
              {entry.created_by && (
                <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                  UID: {entry.created_by}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] text-slate-400 italic">
            Ledger records are permanently write-once and mathematically immutable.
          </p>
          <Button onClick={onClose} variant="outline" size="sm" className="px-4">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
