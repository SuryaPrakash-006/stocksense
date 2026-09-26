import React, { useState } from "react";
import { AdjustmentStatus, InventoryAdjustment } from "@/types/adjustment";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  FileText,
  MapPin,
  Package,
  ShieldCheck,
  SlidersHorizontal,
  X,
  XCircle,
} from "lucide-react";

interface AdjustmentDetailModalProps {
  adjustment: InventoryAdjustment | null;
  isOpen: boolean;
  onClose: () => void;
  onApply: (id: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
  isApplying: boolean;
  isCanceling: boolean;
}

export const AdjustmentDetailModal: React.FC<AdjustmentDetailModalProps> = ({
  adjustment,
  isOpen,
  onClose,
  onApply,
  onCancel,
  isApplying,
  isCanceling,
}) => {
  const [actionError, setActionError] = useState<string | null>(null);

  if (!isOpen || !adjustment) return null;

  const getStatusBadge = (status: AdjustmentStatus) => {
    switch (status) {
      case "DRAFT":
        return (
          <Badge variant="outline" className="border-slate-300 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800">
            <FileText className="w-3 h-3 mr-1" /> Draft (Pending Audit)
          </Badge>
        );
      case "DONE":
        return (
          <Badge variant="default" className="bg-emerald-600 text-white">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Applied (Stock Updated)
          </Badge>
        );
      case "CANCELED":
        return (
          <Badge variant="destructive" className="bg-rose-600 text-white">
            <XCircle className="w-3 h-3 mr-1" /> Canceled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleApply = async () => {
    setActionError(null);
    try {
      await onApply(adjustment.id);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || "Failed to apply adjustment.";
      setActionError(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  };

  const handleCancel = async () => {
    setActionError(null);
    try {
      await onCancel(adjustment.id);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || "Failed to cancel adjustment.";
      setActionError(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  };

  const isCompleted = adjustment.status === "DONE";
  const isCanceled = adjustment.status === "CANCELED";
  const canModify = !isCompleted && !isCanceled;

  const diff = parseFloat(String(adjustment.difference));
  const isPositive = diff > 0;
  const isZero = diff === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-2xl my-8 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-lg">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {adjustment.adjustment_number}
                </h2>
                {getStatusBadge(adjustment.status)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Created on {new Date(adjustment.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {actionError && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Operation Error: </span>
                {actionError}
              </div>
            </div>
          )}

          {/* Product & Location Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <Package className="h-3.5 w-3.5 text-purple-600" />
                Product
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {adjustment.product?.name || "Product"}
              </div>
              <div className="text-xs text-slate-500">
                SKU: <span className="font-mono">{adjustment.product?.sku}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                Location
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {adjustment.location?.name || "Location"}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <MapPin className="h-3 w-3" />
                <span>Code: {adjustment.location?.code}</span>
              </div>
            </div>
          </div>

          {/* Stock Reconciliation Comparison */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Stock Reconciliation Analysis
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-400">System (Before)</span>
                <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                  {parseFloat(String(adjustment.previous_quantity)).toLocaleString()}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    {adjustment.product?.unit_of_measure}
                  </span>
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-400">Counted (Physical)</span>
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                  {parseFloat(String(adjustment.counted_quantity)).toLocaleString()}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    {adjustment.product?.unit_of_measure}
                  </span>
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-400">Discrepancy</span>
                <p
                  className={`text-lg font-bold mt-0.5 ${
                    isZero
                      ? "text-slate-400"
                      : isPositive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {isPositive ? `+${diff.toLocaleString()}` : diff.toLocaleString()}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    {adjustment.product?.unit_of_measure}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Audit Notes & Users */}
          {adjustment.reason && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Reason / Audit Reference:{" "}
              </span>
              {adjustment.reason}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-slate-400">Counted / Created By:</span>
              <p className="font-medium text-slate-700 dark:text-slate-200">
                {adjustment.created_by_name || "User"}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Applied / Validated By:</span>
              <p className="font-medium text-slate-700 dark:text-slate-200">
                {adjustment.validated_by_name ? (
                  `${adjustment.validated_by_name} (${new Date(adjustment.validated_at!).toLocaleDateString()})`
                ) : (
                  "—"
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            {canModify && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isCanceling || isApplying}
                className="text-xs text-rose-600 hover:bg-rose-50 border-rose-200 dark:border-rose-900 h-9"
              >
                {isCanceling ? "Canceling..." : "Cancel Adjustment"}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs h-9"
            >
              Close
            </Button>

            {canModify && (
              <Button
                type="button"
                size="sm"
                onClick={handleApply}
                disabled={isApplying || isCanceling}
                className="text-xs h-9 bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>
                  {isApplying ? "Applying..." : "Apply & Reconcile Stock"}
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
