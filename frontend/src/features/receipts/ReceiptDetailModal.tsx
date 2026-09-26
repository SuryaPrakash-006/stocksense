import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { receiptService } from "@/services/receipt-service";
import { DocumentStatus } from "@/types/receipt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  ArrowDownToLine,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileEdit,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Truck,
  User,
  X,
  XCircle,
  Printer,
} from "lucide-react";
import { printReceiptDocument } from "@/lib/print-document";

interface ReceiptDetailModalProps {
  receiptId: string | null;
  onClose: () => void;
  onReceiptUpdated: () => void;
}

export const ReceiptDetailModal: React.FC<ReceiptDetailModalProps> = ({
  receiptId,
  onClose,
  onReceiptUpdated,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showValidateConfirm, setShowValidateConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const {
    data: receipt,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["receipt-detail", receiptId],
    queryFn: () => (receiptId ? receiptService.getReceiptById(receiptId) : null),
    enabled: !!receiptId,
  });

  if (!receiptId) return null;

  const handleUpdateStatus = async (newStatus: DocumentStatus) => {
    setActionError(null);
    setIsProcessing(true);
    try {
      await receiptService.updateReceipt(receiptId, { status: newStatus });
      await refetch();
      onReceiptUpdated();
    } catch (err: any) {
      setActionError(err.response?.data?.detail || "Failed to update receipt status.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleValidate = async () => {
    setActionError(null);
    setIsProcessing(true);
    try {
      await receiptService.validateReceipt(receiptId);
      setShowValidateConfirm(false);
      await refetch();
      onReceiptUpdated();
    } catch (err: any) {
      setActionError(err.response?.data?.detail || "Failed to validate receipt.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    setActionError(null);
    setIsProcessing(true);
    try {
      await receiptService.cancelReceipt(receiptId);
      setShowCancelConfirm(false);
      await refetch();
      onReceiptUpdated();
    } catch (err: any) {
      setActionError(err.response?.data?.detail || "Failed to cancel receipt.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ArrowDownToLine className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white font-mono">
                  {receipt?.receipt_number || "Incoming Receipt"}
                </h2>
                {receipt && (
                  <Badge
                    variant={
                      receipt.status === "DONE"
                        ? "success"
                        : receipt.status === "CANCELED"
                        ? "destructive"
                        : receipt.status === "READY"
                        ? "default"
                        : "warning"
                    }
                    className="text-[11px]"
                  >
                    {receipt.status}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Supplier inbound shipment & stock intake voucher
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {receipt && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => printReceiptDocument(receipt)}
                className="h-8 px-2.5 text-xs flex items-center gap-1.5 border-slate-300 dark:border-slate-700 shadow-sm"
                title="Print unformatted PDF Goods Receipt Note"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print PDF</span>
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {actionError && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{actionError}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500">
              <RefreshCw className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-xs">Loading receipt voucher details...</p>
            </div>
          ) : error || !receipt ? (
            <div className="p-4 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-xs">
              Failed to load receipt details.
            </div>
          ) : (
            <>
              {/* Receipt Progress Tracker */}
              <div className="p-4 rounded-lg border bg-slate-50/50 dark:bg-slate-800/30">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Workflow Lifecycle Status
                </p>
                <div className="flex items-center justify-between relative">
                  {["DRAFT", "WAITING", "READY", "DONE"].map((st, i, arr) => {
                    const isPassed =
                      (receipt.status === "DONE" && true) ||
                      (receipt.status === "READY" && ["DRAFT", "WAITING", "READY"].includes(st)) ||
                      (receipt.status === "WAITING" && ["DRAFT", "WAITING"].includes(st)) ||
                      (receipt.status === "DRAFT" && st === "DRAFT");
                    const isCurrent = receipt.status === st;

                    return (
                      <div key={st} className="flex flex-col items-center z-10">
                        <div
                          className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            receipt.status === "CANCELED"
                              ? "bg-slate-200 text-slate-400 dark:bg-slate-800"
                              : isPassed
                              ? "bg-primary text-white shadow-sm ring-2 ring-primary/20"
                              : "bg-slate-200 text-slate-500 dark:bg-slate-800"
                          }`}
                        >
                          {i + 1}
                        </div>
                        <span
                          className={`text-[11px] font-semibold mt-1.5 ${
                            isCurrent
                              ? "text-primary dark:text-primary-foreground"
                              : "text-slate-500"
                          }`}
                        >
                          {st}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Receipt Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-white dark:bg-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Truck className="h-4 w-4 text-primary" />
                    <span>Vendor Supplier</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {receipt.supplier?.name || "Unassigned"}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500">
                    {receipt.supplier?.code ? `Code: ${receipt.supplier.code}` : ""}
                  </p>
                </div>

                <div className="p-4 rounded-lg border bg-white dark:bg-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>Destination Warehouse Location</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {receipt.destination_location?.name || "N/A"}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500">
                    Location Code: {receipt.destination_location?.code}
                  </p>
                </div>

                <div className="p-4 rounded-lg border bg-white dark:bg-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>Audit & Creation Record</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    Created by: <strong>{receipt.created_by_name || "Staff"}</strong>
                  </p>
                  <p className="text-[11px] font-mono text-slate-500">
                    {new Date(receipt.created_at).toLocaleString()}
                  </p>
                  {receipt.validated_at && (
                    <div className="pt-1 border-t text-[11px] text-emerald-600 dark:text-emerald-400">
                      Validated by: <strong>{receipt.validated_by_name || "Manager"}</strong> on{" "}
                      {new Date(receipt.validated_at).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Received Product Lines ({receipt.items.length})
                  </h3>
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Total: {Number(receipt.total_quantity).toLocaleString()} Units
                  </span>
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b text-[11px] uppercase font-semibold text-slate-500">
                        <th className="py-2.5 px-4">SKU / Code</th>
                        <th className="py-2.5 px-4">Product Name</th>
                        <th className="py-2.5 px-4">Unit of Measure</th>
                        <th className="py-2.5 px-4 text-right">Received Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {receipt.items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-2.5 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                            {item.product?.sku || "N/A"}
                          </td>
                          <td className="py-2.5 px-4 text-slate-800 dark:text-slate-200 font-medium">
                            {item.product?.name || "Unassigned"}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                            {item.product?.unit_of_measure || "Units"}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white text-sm">
                            +{Number(item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {receipt.notes && (
                <div className="p-3 rounded-lg border bg-slate-50/50 dark:bg-slate-800/30 text-xs">
                  <strong className="text-slate-600 dark:text-slate-400">Delivery Notes:</strong>{" "}
                  <span className="text-slate-800 dark:text-slate-200">{receipt.notes}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {receipt && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              {receipt.status === "DRAFT" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isProcessing}
                    onClick={() => handleUpdateStatus("WAITING")}
                    className="text-xs"
                  >
                    Move to Waiting
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isProcessing}
                    onClick={() => handleUpdateStatus("READY")}
                    className="text-xs"
                  >
                    Mark Ready
                  </Button>
                </>
              )}

              {receipt.status === "WAITING" && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => handleUpdateStatus("READY")}
                  className="text-xs"
                >
                  Mark Ready
                </Button>
              )}

              {receipt.status !== "DONE" && receipt.status !== "CANCELED" && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => setShowCancelConfirm(true)}
                  className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  Cancel Receipt
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => printReceiptDocument(receipt)}
                className="text-xs flex items-center gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Document</span>
              </Button>

              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>

              {receipt.status !== "DONE" && receipt.status !== "CANCELED" && (
                <Button
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => setShowValidateConfirm(true)}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Validate & Receive Stock</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Validation */}
      {showValidateConfirm && (
        <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Confirm Stock Intake Validation
                </h3>
                <p className="text-xs text-slate-500">
                  This action will permanently increase inventory at{" "}
                  <strong>{receipt?.destination_location?.name}</strong> and create immutable ledger records.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs space-y-1">
              <p>Receipt: <strong className="font-mono">{receipt?.receipt_number}</strong></p>
              <p>Total Items: <strong>{receipt?.total_items}</strong></p>
              <p>Total Units to Add: <strong>+{Number(receipt?.total_quantity).toLocaleString()}</strong></p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowValidateConfirm(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleValidate}
                disabled={isProcessing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isProcessing ? "Validating..." : "Confirm & Receive Stock"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Cancellation */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center shrink-0">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Cancel Incoming Receipt?
                </h3>
                <p className="text-xs text-slate-500">
                  The receipt will be marked as CANCELED and cannot be modified or validated later.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelConfirm(false)}
                disabled={isProcessing}
              >
                Go Back
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCancel}
                disabled={isProcessing}
              >
                {isProcessing ? "Canceling..." : "Confirm Cancellation"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
