import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { deliveryService } from "@/services/delivery-service";
import { DocumentStatus } from "@/types/receipt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpFromLine,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileEdit,
  MapPin,
  PackageCheck,
  RefreshCw,
  Truck,
  User,
  X,
  XCircle,
  Printer,
} from "lucide-react";
import { printDeliveryDocument } from "@/lib/print-document";

interface DeliveryDetailModalProps {
  deliveryId: string | null;
  onClose: () => void;
  onDeliveryUpdated: () => void;
}

export const DeliveryDetailModal: React.FC<DeliveryDetailModalProps> = ({
  deliveryId,
  onClose,
  onDeliveryUpdated,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showValidateConfirm, setShowValidateConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const {
    data: delivery,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["delivery-detail", deliveryId],
    queryFn: () => (deliveryId ? deliveryService.getDeliveryById(deliveryId) : null),
    enabled: !!deliveryId,
  });

  if (!deliveryId) return null;

  const handleUpdateStatus = async (newStatus: DocumentStatus) => {
    setActionError(null);
    setIsProcessing(true);
    try {
      await deliveryService.updateDelivery(deliveryId, { status: newStatus });
      await refetch();
      onDeliveryUpdated();
    } catch (err: any) {
      setActionError(err.response?.data?.detail || "Failed to update delivery order status.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleValidate = async () => {
    setActionError(null);
    setIsProcessing(true);
    try {
      await deliveryService.validateDelivery(deliveryId);
      setShowValidateConfirm(false);
      await refetch();
      onDeliveryUpdated();
    } catch (err: any) {
      setActionError(err.response?.data?.detail || "Failed to validate delivery order.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    setActionError(null);
    setIsProcessing(true);
    try {
      await deliveryService.cancelDelivery(deliveryId);
      setShowCancelConfirm(false);
      await refetch();
      onDeliveryUpdated();
    } catch (err: any) {
      setActionError(err.response?.data?.detail || "Failed to cancel delivery order.");
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
              <ArrowUpFromLine className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white font-mono">
                  {delivery?.delivery_number || "Delivery Order"}
                </h2>
                {delivery && (
                  <Badge
                    variant={
                      delivery.status === "DONE"
                        ? "success"
                        : delivery.status === "CANCELED"
                        ? "destructive"
                        : delivery.status === "READY"
                        ? "default"
                        : "warning"
                    }
                    className="text-[11px]"
                  >
                    {delivery.status === "WAITING"
                      ? "Picking (Waiting)"
                      : delivery.status === "READY"
                      ? "Packed (Ready)"
                      : delivery.status}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Customer fulfillment shipment & dispatch voucher
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {delivery && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => printDeliveryDocument(delivery)}
                className="h-8 px-2.5 text-xs flex items-center gap-1.5 border-slate-300 dark:border-slate-700 shadow-sm"
                title="Print unformatted PDF Delivery Packing Slip"
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
              <p className="text-xs">Loading delivery order details & stock verification...</p>
            </div>
          ) : error || !delivery ? (
            <div className="p-4 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-xs">
              Failed to load delivery order details.
            </div>
          ) : (
            <>
              {/* Workflow Lifecycle Progress */}
              <div className="p-4 rounded-lg border bg-slate-50/50 dark:bg-slate-800/30">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Fulfillment Lifecycle
                </p>
                <div className="flex items-center justify-between relative">
                  {[
                    { id: "DRAFT", label: "Draft" },
                    { id: "WAITING", label: "1. Picking" },
                    { id: "READY", label: "2. Packed" },
                    { id: "DONE", label: "3. Shipped" },
                  ].map((step, i) => {
                    const isPassed =
                      (delivery.status === "DONE" && true) ||
                      (delivery.status === "READY" && ["DRAFT", "WAITING", "READY"].includes(step.id)) ||
                      (delivery.status === "WAITING" && ["DRAFT", "WAITING"].includes(step.id)) ||
                      (delivery.status === "DRAFT" && step.id === "DRAFT");
                    const isCurrent = delivery.status === step.id;

                    return (
                      <div key={step.id} className="flex flex-col items-center z-10">
                        <div
                          className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            delivery.status === "CANCELED"
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
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Overview Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-white dark:bg-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <User className="h-4 w-4 text-primary" />
                    <span>Customer Account</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {delivery.customer?.name || "Unassigned"}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500">
                    {delivery.customer?.code ? `Code: ${delivery.customer.code}` : ""}
                  </p>
                </div>

                <div className="p-4 rounded-lg border bg-white dark:bg-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>Fulfillment Location</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {delivery.source_location?.name || "N/A"}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500">
                    Code: {delivery.source_location?.code}
                  </p>
                </div>

                <div className="p-4 rounded-lg border bg-white dark:bg-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>Audit & Dispatch Record</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    Created by: <strong>{delivery.created_by_name || "Staff"}</strong>
                  </p>
                  <p className="text-[11px] font-mono text-slate-500">
                    {new Date(delivery.created_at).toLocaleString()}
                  </p>
                  {delivery.validated_at && (
                    <div className="pt-1 border-t text-[11px] text-emerald-600 dark:text-emerald-400">
                      Shipped & Validated by: <strong>{delivery.validated_by_name || "Staff"}</strong> on{" "}
                      {new Date(delivery.validated_at).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Items & Live Stock Verification Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Order Lines & Stock Availability ({delivery.items.length})
                  </h3>
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Total: {Number(delivery.total_quantity).toLocaleString()} Units
                  </span>
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b text-[11px] uppercase font-semibold text-slate-500">
                        <th className="py-2.5 px-4">SKU / Code</th>
                        <th className="py-2.5 px-4">Product Name</th>
                        <th className="py-2.5 px-4">Unit</th>
                        <th className="py-2.5 px-4 text-right">Order Qty</th>
                        <th className="py-2.5 px-4 text-right">Location Stock</th>
                        <th className="py-2.5 px-4 text-center">Availability</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {delivery.items.map((item) => {
                        const reqQty = Number(item.quantity);
                        const availQty = Number(item.available_stock || 0);
                        const isDone = delivery.status === "DONE";

                        return (
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
                              {reqQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                              {isDone ? "-" : availQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              {isDone ? (
                                <Badge variant="success" className="text-[10px]">Deducted</Badge>
                              ) : item.is_sufficient ? (
                                <Badge variant="success" className="text-[10px] flex items-center justify-center gap-1 mx-auto w-fit">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>In Stock</span>
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="text-[10px] flex items-center justify-center gap-1 mx-auto w-fit">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span>Shortage ({availQty} left)</span>
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

              {delivery.notes && (
                <div className="p-3 rounded-lg border bg-slate-50/50 dark:bg-slate-800/30 text-xs">
                  <strong className="text-slate-600 dark:text-slate-400">Shipping Notes:</strong>{" "}
                  <span className="text-slate-800 dark:text-slate-200">{delivery.notes}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {delivery && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              {delivery.status === "DRAFT" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isProcessing}
                    onClick={() => handleUpdateStatus("WAITING")}
                    className="text-xs"
                  >
                    Start Picking (Waiting)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isProcessing}
                    onClick={() => handleUpdateStatus("READY")}
                    className="text-xs"
                  >
                    Mark Packed & Ready
                  </Button>
                </>
              )}

              {delivery.status === "WAITING" && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => handleUpdateStatus("READY")}
                  className="text-xs"
                >
                  Mark Packed & Ready
                </Button>
              )}

              {delivery.status !== "DONE" && delivery.status !== "CANCELED" && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => setShowCancelConfirm(true)}
                  className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  Cancel Order
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => printDeliveryDocument(delivery)}
                className="text-xs flex items-center gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Document</span>
              </Button>

              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>

              {delivery.status !== "DONE" && delivery.status !== "CANCELED" && (
                <Button
                  size="sm"
                  disabled={isProcessing || !delivery.has_sufficient_stock}
                  onClick={() => setShowValidateConfirm(true)}
                  className="text-xs bg-primary hover:bg-primary/90 text-white flex items-center gap-1.5 disabled:opacity-50"
                  title={!delivery.has_sufficient_stock ? "Cannot validate order due to insufficient stock at source location" : ""}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Validate & Ship (-Stock)</span>
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
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center shrink-0">
                <ArrowUpFromLine className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Confirm Shipment & Stock Deduction
                </h3>
                <p className="text-xs text-slate-500">
                  This will deduct <strong>-{Number(delivery?.total_quantity).toLocaleString()} units</strong> from{" "}
                  <strong>{delivery?.source_location?.name}</strong> and write immutable DELIVERY ledger records.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs space-y-1">
              <p>Delivery Order: <strong className="font-mono">{delivery?.delivery_number}</strong></p>
              <p>Customer: <strong>{delivery?.customer?.name}</strong></p>
              <p>Items to dispatch: <strong>{delivery?.total_items}</strong></p>
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
                className="bg-primary hover:bg-primary/90 text-white"
              >
                {isProcessing ? "Deducting..." : "Confirm & Ship Stock"}
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
                  Cancel Delivery Order?
                </h3>
                <p className="text-xs text-slate-500">
                  The delivery order will be marked as CANCELED. Stock balances will not be altered.
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
