import React, { useState } from "react";
import { InternalTransfer } from "@/types/transfer";
import { DocumentStatus } from "@/types/receipt";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  ShieldCheck,
  Truck,
  X,
  XCircle,
} from "lucide-react";

interface TransferDetailModalProps {
  transfer: InternalTransfer | null;
  isOpen: boolean;
  onClose: () => void;
  onValidate: (id: string) => Promise<void>;
  onMarkReady?: (id: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
  isValidating: boolean;
  isCanceling: boolean;
}

export const TransferDetailModal: React.FC<TransferDetailModalProps> = ({
  transfer,
  isOpen,
  onClose,
  onValidate,
  onMarkReady,
  onCancel,
  isValidating,
  isCanceling,
}) => {
  const [actionError, setActionError] = useState<string | null>(null);

  if (!isOpen || !transfer) return null;

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case "DRAFT":
        return (
          <Badge variant="outline" className="border-slate-300 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800">
            <FileText className="w-3 h-3 mr-1" /> Draft
          </Badge>
        );
      case "READY":
        return (
          <Badge variant="default" className="bg-blue-600 text-white">
            <Clock className="w-3 h-3 mr-1" /> Ready for Transfer
          </Badge>
        );
      case "DONE":
        return (
          <Badge variant="default" className="bg-emerald-600 text-white">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Completed (Stock Relocated)
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

  const handleValidate = async () => {
    setActionError(null);
    try {
      await onValidate(transfer.id);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || "Failed to validate transfer.";
      setActionError(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  };

  const handleMarkReady = async () => {
    if (!onMarkReady) return;
    setActionError(null);
    try {
      await onMarkReady(transfer.id);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || "Failed to update transfer status.";
      setActionError(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  };

  const handleCancel = async () => {
    setActionError(null);
    try {
      await onCancel(transfer.id);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || "Failed to cancel transfer.";
      setActionError(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  };

  const isCompleted = transfer.status === "DONE";
  const isCanceled = transfer.status === "CANCELED";
  const canModify = !isCompleted && !isCanceled;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-3xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {transfer.transfer_number}
                </h2>
                {getStatusBadge(transfer.status)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Created on {new Date(transfer.created_at).toLocaleString()}
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

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {actionError && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Operation Error: </span>
                {actionError}
              </div>
            </div>
          )}

          {/* Location Flow Visualizer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            {/* Source */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                Source Location (Stock Out)
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {transfer.source_location?.name || "Unknown Location"}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <MapPin className="h-3 w-3" />
                <span>Code: {transfer.source_location?.code}</span>
              </div>
            </div>

            {/* Destination */}
            <div className="space-y-1 md:border-l md:border-slate-200 dark:md:border-slate-800 md:pl-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <ArrowRight className="h-3.5 w-3.5 text-emerald-500" />
                Destination Location (Stock In)
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {transfer.destination_location?.name || "Unknown Location"}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <MapPin className="h-3 w-3" />
                <span>Code: {transfer.destination_location?.code}</span>
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-slate-400">Initiated By:</span>
              <p className="font-medium text-slate-700 dark:text-slate-200">
                {transfer.created_by_name || "User"}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Total Lines:</span>
              <p className="font-medium text-slate-700 dark:text-slate-200">
                {transfer.total_items} items
              </p>
            </div>
            <div>
              <span className="text-slate-400">Total Units:</span>
              <p className="font-medium text-slate-700 dark:text-slate-200">
                {parseFloat(String(transfer.total_quantity)).toLocaleString()} units
              </p>
            </div>
            <div>
              <span className="text-slate-400">Completed By:</span>
              <p className="font-medium text-slate-700 dark:text-slate-200">
                {transfer.completed_by_name ? (
                  `${transfer.completed_by_name} (${new Date(transfer.completed_at!).toLocaleDateString()})`
                ) : (
                  "—"
                )}
              </p>
            </div>
          </div>

          {transfer.notes && (
            <div className="text-xs p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Notes: </span>
              {transfer.notes}
            </div>
          )}

          {/* Stock Shortage Warning */}
          {canModify && !transfer.has_sufficient_stock && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 rounded-lg flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>
                One or more products exceed currently available stock at the source location. Validation will fail until stock is replenished.
              </span>
            </div>
          )}

          {/* Line Items Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Transfer Line Items
            </h3>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Product / SKU</th>
                    <th className="py-2.5 px-3 text-right">Transfer Qty</th>
                    <th className="py-2.5 px-3 text-right">Source Available</th>
                    <th className="py-2.5 px-3 text-center">Stock Check</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {transfer.items.map((item, idx) => {
                    const reqQty = parseFloat(String(item.quantity));
                    const avail = parseFloat(String(item.available_stock || 0));
                    const isSufficient = item.is_sufficient ?? (avail >= reqQty);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {item.product?.name || "Product"}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            SKU: {item.product?.sku}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                          {reqQty.toLocaleString()}{" "}
                          <span className="font-normal text-slate-400">
                            {item.product?.unit_of_measure}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">
                          {isCompleted ? "—" : avail.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {isCompleted ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] py-0">
                              Transferred
                            </Badge>
                          ) : isSufficient ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] py-0">
                              In Stock
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[10px] py-0">
                              Shortage
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
          <div>
            {canModify && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isCanceling || isValidating}
                className="text-xs text-rose-600 hover:bg-rose-50 border-rose-200 dark:border-rose-900 h-9"
              >
                {isCanceling ? "Canceling..." : "Cancel Transfer"}
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

            {transfer.status === "DRAFT" && onMarkReady && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleMarkReady}
                disabled={isValidating || isCanceling}
                className="text-xs h-9 text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                Mark as Ready
              </Button>
            )}

            {canModify && (
              <Button
                type="button"
                size="sm"
                onClick={handleValidate}
                disabled={isValidating || isCanceling}
                className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>
                  {isValidating ? "Validating..." : "Validate & Complete Transfer"}
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
