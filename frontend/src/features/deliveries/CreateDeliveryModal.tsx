import React, { useState } from "react";
import { Customer } from "@/types/partner";
import { ProductListItem } from "@/types/product";
import { Warehouse } from "@/types/warehouse";
import { DeliveryItemInput, DeliveryOrderCreatePayload } from "@/types/delivery";
import { partnerService } from "@/services/partner-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  ArrowUpFromLine,
  Building2,
  Plus,
  Trash2,
  X,
} from "lucide-react";

interface CreateDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: DeliveryOrderCreatePayload) => Promise<void>;
  customers: Customer[];
  warehouses: Warehouse[];
  products: ProductListItem[];
  onCustomerCreated?: () => void;
}

export const CreateDeliveryModal: React.FC<CreateDeliveryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  customers,
  warehouses,
  products,
  onCustomerCreated,
}) => {
  const [deliveryNumber, setDeliveryNumber] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [sourceLocationId, setSourceLocationId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<DeliveryItemInput[]>([
    { product_id: "", quantity: "1" },
  ]);

  // Quick-create Customer State
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerCode, setNewCustomerCode] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([...items, { product_id: "", quantity: "1" }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof DeliveryItemInput,
    value: string
  ) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleQuickCreateCustomer = async () => {
    if (!newCustomerName.trim()) return;
    try {
      const created = await partnerService.createCustomer({
        name: newCustomerName.trim(),
        code: newCustomerCode.trim().toUpperCase() || undefined,
      });
      setCustomerId(created.id);
      setIsAddingCustomer(false);
      setNewCustomerName("");
      setNewCustomerCode("");
      if (onCustomerCreated) onCustomerCreated();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create customer.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError("Please select or create a customer.");
      return;
    }
    if (!sourceLocationId) {
      setError("Please select a source warehouse location.");
      return;
    }

    const validItems: DeliveryItemInput[] = [];
    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      if (!row.product_id) {
        setError(`Row #${i + 1}: Please select a product.`);
        return;
      }
      if (Number(row.quantity) <= 0) {
        setError(`Row #${i + 1}: Quantity must be greater than zero.`);
        return;
      }
      validItems.push({
        product_id: row.product_id,
        quantity: row.quantity,
      });
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        delivery_number: deliveryNumber.trim() || undefined,
        customer_id: customerId,
        source_location_id: sourceLocationId,
        notes: notes.trim() || undefined,
        items: validItems,
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create delivery order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ArrowUpFromLine className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                New Outgoing Delivery Order
              </h2>
              <p className="text-xs text-slate-500">
                Create a delivery order for customer shipment. Stock is verified and deducted upon validation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer & Source Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Selection */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="del-cust">Customer *</Label>
                <button
                  type="button"
                  onClick={() => setIsAddingCustomer(!isAddingCustomer)}
                  className="text-[11px] text-primary hover:underline font-semibold"
                >
                  {isAddingCustomer ? "Cancel New" : "+ Add New Customer"}
                </button>
              </div>

              {isAddingCustomer ? (
                <div className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-800/50 space-y-2">
                  <Input
                    type="text"
                    placeholder="Customer / Company Name"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Customer Code"
                      value={newCustomerCode}
                      onChange={(e) => setNewCustomerCode(e.target.value.toUpperCase())}
                      className="h-8 text-xs font-mono"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleQuickCreateCustomer}
                      className="h-8 text-xs shrink-0"
                    >
                      Save Customer
                    </Button>
                  </div>
                </div>
              ) : (
                <select
                  id="del-cust"
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="" className="dark:bg-slate-900">Select Customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id} className="dark:bg-slate-900">
                      {c.name} {c.code ? `(${c.code})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Source Location */}
            <div className="space-y-1.5">
              <Label htmlFor="del-loc">Source Warehouse Location (Fulfillment) *</Label>
              <select
                id="del-loc"
                required
                value={sourceLocationId}
                onChange={(e) => setSourceLocationId(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="" className="dark:bg-slate-900">Select Source Location...</option>
                {warehouses.map((wh) => (
                  <optgroup key={wh.id} label={`${wh.name} (${wh.code})`}>
                    {wh.locations.map((loc) => (
                      <option key={loc.id} value={loc.id} className="dark:bg-slate-900">
                        {loc.name} ({loc.code})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {/* Reference & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="del-num">Delivery Order # (Optional)</Label>
              <Input
                id="del-num"
                type="text"
                placeholder="Auto-generated if left blank"
                value={deliveryNumber}
                onChange={(e) => setDeliveryNumber(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="del-notes">Dispatch / Shipping Notes</Label>
              <Input
                id="del-notes"
                type="text"
                placeholder="e.g. Courier tracking # / destination site"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-xs uppercase tracking-wider">
                Products to Pick & Dispatch
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="h-7 text-xs flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Item Line</span>
              </Button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {items.map((row, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
                >
                  <div className="flex-1">
                    <select
                      required
                      value={row.product_id}
                      onChange={(e) => handleItemChange(idx, "product_id", e.target.value)}
                      className="w-full h-8 px-2 rounded border border-input bg-transparent text-xs text-slate-800 dark:text-slate-200"
                    >
                      <option value="" className="dark:bg-slate-900">Select Product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id} className="dark:bg-slate-900">
                          {p.sku} — {p.name} (Total on hand: {Number(p.total_stock).toLocaleString()} {p.unit_of_measure})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-32">
                    <Input
                      type="number"
                      min="0.0001"
                      step="any"
                      required
                      placeholder="Qty"
                      value={row.quantity}
                      onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                      className="h-8 text-xs font-mono text-right"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length <= 1}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 disabled:opacity-30 shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              <span>{isSubmitting ? "Creating Order..." : "Create Draft Delivery Order"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
