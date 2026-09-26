import { Receipt } from "@/types/receipt";
import { DeliveryOrder } from "@/types/delivery";

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function formatQuantity(qty?: string | number | null): string {
  if (qty === null || qty === undefined) return "0.00";
  const num = Number(qty);
  if (isNaN(num)) return String(qty);
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

function printHtmlContent(title: string, htmlContent: string) {
  const printWindow = window.open("", "_blank", "width=850,height=900");
  if (!printWindow) {
    alert("Please allow popups for this site to print documents.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #1e293b;
        }
        body {
          background-color: #ffffff;
          padding: 32px;
          font-size: 13px;
          line-height: 1.5;
        }
        @media print {
          body {
            padding: 0;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
          .no-print {
            display: none !important;
          }
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        .logo-box {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .logo-badge {
          background: #0f172a;
          color: #ffffff;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 16px;
          letter-spacing: 0.5px;
        }
        .doc-title {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          text-align: right;
          letter-spacing: -0.5px;
        }
        .doc-number {
          font-family: monospace;
          font-size: 14px;
          font-weight: 700;
          color: #475569;
          text-align: right;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }
        .info-card {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 14px;
          background: #f8fafc;
        }
        .card-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748b;
          margin-bottom: 8px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 4px;
        }
        .info-row {
          display: flex;
          margin-bottom: 4px;
          font-size: 12px;
        }
        .info-label {
          width: 120px;
          font-weight: 600;
          color: #475569;
        }
        .info-val {
          flex: 1;
          color: #0f172a;
          font-weight: 500;
        }
        .status-pill {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .status-DONE { background: #dcfce7; color: #166534; }
        .status-READY { background: #e0e7ff; color: #3730a3; }
        .status-WAITING { background: #fef3c7; color: #92400e; }
        .status-DRAFT { background: #f1f5f9; color: #475569; }
        .status-CANCELED { background: #fee2e2; color: #991b1b; }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
        }
        th {
          background: #0f172a;
          color: #ffffff;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 700;
          padding: 8px 12px;
          text-align: left;
        }
        th.text-right, td.text-right {
          text-align: right;
        }
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 12px;
        }
        tr:nth-child(even) {
          background-color: #f8fafc;
        }
        .total-row td {
          background-color: #f1f5f9;
          font-weight: 700;
          font-size: 13px;
          border-top: 2px solid #cbd5e1;
          border-bottom: 2px solid #cbd5e1;
        }
        .notes-box {
          border: 1px dashed #cbd5e1;
          border-radius: 6px;
          padding: 10px 14px;
          margin-bottom: 24px;
          background: #fafafa;
          font-size: 12px;
        }
        .notes-label {
          font-weight: 700;
          color: #475569;
          margin-bottom: 2px;
        }
        .signature-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 24px;
          margin-top: 48px;
        }
        .sig-block {
          border-top: 1px solid #94a3b8;
          padding-top: 8px;
          text-align: center;
          font-size: 11px;
          color: #475569;
        }
        .sig-title {
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 2px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #94a3b8;
        }
        .print-btn {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: #0f172a;
          color: #fff;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
      </style>
    </head>
    <body>
      <button class="print-btn no-print" onclick="window.print()">Print / Save PDF</button>
      ${htmlContent}
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 400);
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

export function printReceiptDocument(receipt: Receipt) {
  const supplierName = receipt.supplier?.name || "Unassigned Supplier";
  const supplierCode = receipt.supplier?.code || "N/A";
  const email = receipt.supplier?.contact_email || "N/A";
  const phone = receipt.supplier?.phone || "N/A";
  const address = receipt.supplier?.address || "N/A";

  const locationName = receipt.destination_location?.name || "Goods Receiving Bay";
  const locationCode = receipt.destination_location?.code || "LOC-RCV-01";

  const itemsHtml = receipt.items.map((item, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td style="font-family: monospace; font-weight: 600;">${item.product?.sku || "SKU-N/A"}</td>
      <td style="font-weight: 600;">${item.product?.name || "Product Item"}</td>
      <td>${item.product?.unit_of_measure || "Units"}</td>
      <td class="text-right" style="font-family: monospace; font-weight: 700;">${formatQuantity(item.quantity)}</td>
    </tr>
  `).join("");

  const html = `
    <div class="header">
      <div class="logo-box">
        <div class="logo-badge">StockSense</div>
        <div>
          <div style="font-weight: 700; font-size: 14px;">Inventory Management System</div>
          <div style="font-size: 11px; color: #64748b;">Enterprise Inbound Operations</div>
        </div>
      </div>
      <div>
        <div class="doc-title">GOODS RECEIPT NOTE</div>
        <div class="doc-number">${receipt.receipt_number}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="info-card">
        <div class="card-title">Supplier / Vendor Details</div>
        <div class="info-row"><span class="info-label">Supplier Name:</span><span class="info-val">${supplierName} (${supplierCode})</span></div>
        <div class="info-row"><span class="info-label">Contact Email:</span><span class="info-val">${email}</span></div>
        <div class="info-row"><span class="info-label">Phone:</span><span class="info-val">${phone}</span></div>
        <div class="info-row"><span class="info-label">Address:</span><span class="info-val">${address}</span></div>
      </div>

      <div class="info-card">
        <div class="card-title">Intake & Logistics Specifications</div>
        <div class="info-row"><span class="info-label">Status:</span><span class="info-val"><span class="status-pill status-${receipt.status}">${receipt.status}</span></span></div>
        <div class="info-row"><span class="info-label">Target Location:</span><span class="info-val">${locationName} (${locationCode})</span></div>
        <div class="info-row"><span class="info-label">Date Created:</span><span class="info-val">${formatDate(receipt.created_at)}</span></div>
        <div class="info-row"><span class="info-label">Validated Date:</span><span class="info-val">${formatDate(receipt.validated_at)}</span></div>
        <div class="info-row"><span class="info-label">Created By:</span><span class="info-val">${receipt.created_by_name || "System Administrator"}</span></div>
        ${receipt.validated_by_name ? `<div class="info-row"><span class="info-label">Validated By:</span><span class="info-val">${receipt.validated_by_name}</span></div>` : ""}
      </div>
    </div>

    ${receipt.notes ? `
      <div class="notes-box">
        <div class="notes-label">Operational Notes & Shipment Remarks:</div>
        <div>${receipt.notes}</div>
      </div>
    ` : ""}

    <table>
      <thead>
        <tr>
          <th style="width: 40px;">#</th>
          <th style="width: 140px;">SKU Code</th>
          <th>Product Description</th>
          <th style="width: 80px;">UoM</th>
          <th class="text-right" style="width: 120px;">Received Quantity</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml || `<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 20px;">No items listed on this receipt</td></tr>`}
        <tr class="total-row">
          <td colspan="4" style="text-align: right;">TOTAL RECEIVED QUANTITY:</td>
          <td class="text-right" style="font-family: monospace;">${formatQuantity(receipt.total_quantity)}</td>
        </tr>
      </tbody>
    </table>

    <div class="signature-grid">
      <div class="sig-block">
        <div class="sig-title">Warehouse Receiving Officer</div>
        <div>Inspected & Counted</div>
      </div>
      <div class="sig-block">
        <div class="sig-title">Supplier Courier / Carrier</div>
        <div>Delivered in Good Condition</div>
      </div>
      <div class="sig-block">
        <div class="sig-title">Inventory Manager Approval</div>
        <div>System Stock Updated</div>
      </div>
    </div>

    <div class="footer">
      <span>StockSense IMS • Official Inbound Stock Record</span>
      <span>Document Ref: ${receipt.receipt_number} • Unhashed System Audit Copy</span>
      <span>Printed: ${formatDate(new Date().toISOString())}</span>
    </div>
  `;

  printHtmlContent(`Goods Receipt Note - ${receipt.receipt_number}`, html);
}

export function printDeliveryDocument(delivery: DeliveryOrder) {
  const customerName = delivery.customer?.name || "Unassigned Customer";
  const customerCode = delivery.customer?.code || "N/A";
  const email = delivery.customer?.contact_email || "N/A";
  const phone = delivery.customer?.phone || "N/A";
  const address = delivery.customer?.address || "N/A";

  const locationName = delivery.source_location?.name || "Outbound Dispatch Dock";
  const locationCode = delivery.source_location?.code || "LOC-SHP-01";

  const itemsHtml = delivery.items.map((item, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td style="font-family: monospace; font-weight: 600;">${item.product?.sku || "SKU-N/A"}</td>
      <td style="font-weight: 600;">${item.product?.name || "Product Item"}</td>
      <td>${item.product?.unit_of_measure || "Units"}</td>
      <td class="text-right" style="font-family: monospace; font-weight: 700;">${formatQuantity(item.quantity)}</td>
    </tr>
  `).join("");

  const html = `
    <div class="header">
      <div class="logo-box">
        <div class="logo-badge">StockSense</div>
        <div>
          <div style="font-weight: 700; font-size: 14px;">Inventory Management System</div>
          <div style="font-size: 11px; color: #64748b;">Outbound Dispatch & Delivery Slip</div>
        </div>
      </div>
      <div>
        <div class="doc-title">DELIVERY PACKING SLIP</div>
        <div class="doc-number">${delivery.delivery_number}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="info-card">
        <div class="card-title">Customer & Consignee Information</div>
        <div class="info-row"><span class="info-label">Customer Name:</span><span class="info-val">${customerName} (${customerCode})</span></div>
        <div class="info-row"><span class="info-label">Contact Email:</span><span class="info-val">${email}</span></div>
        <div class="info-row"><span class="info-label">Phone:</span><span class="info-val">${phone}</span></div>
        <div class="info-row"><span class="info-label">Shipping Address:</span><span class="info-val">${address}</span></div>
      </div>

      <div class="info-card">
        <div class="card-title">Dispatch & Warehouse Parameters</div>
        <div class="info-row"><span class="info-label">Order Status:</span><span class="info-val"><span class="status-pill status-${delivery.status}">${delivery.status}</span></span></div>
        <div class="info-row"><span class="info-label">Picking Location:</span><span class="info-val">${locationName} (${locationCode})</span></div>
        <div class="info-row"><span class="info-label">Order Date:</span><span class="info-val">${formatDate(delivery.created_at)}</span></div>
        <div class="info-row"><span class="info-label">Dispatched Date:</span><span class="info-val">${formatDate(delivery.validated_at)}</span></div>
        <div class="info-row"><span class="info-label">Created By:</span><span class="info-val">${delivery.created_by_name || "System Administrator"}</span></div>
        ${delivery.validated_by_name ? `<div class="info-row"><span class="info-label">Dispatched By:</span><span class="info-val">${delivery.validated_by_name}</span></div>` : ""}
      </div>
    </div>

    ${delivery.notes ? `
      <div class="notes-box">
        <div class="notes-label">Delivery Instructions & Shipping Notes:</div>
        <div>${delivery.notes}</div>
      </div>
    ` : ""}

    <table>
      <thead>
        <tr>
          <th style="width: 40px;">#</th>
          <th style="width: 140px;">SKU Code</th>
          <th>Product Description</th>
          <th style="width: 80px;">UoM</th>
          <th class="text-right" style="width: 120px;">Dispatched Quantity</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml || `<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 20px;">No items listed on this delivery order</td></tr>`}
        <tr class="total-row">
          <td colspan="4" style="text-align: right;">TOTAL DISPATCHED QUANTITY:</td>
          <td class="text-right" style="font-family: monospace;">${formatQuantity(delivery.total_quantity)}</td>
        </tr>
      </tbody>
    </table>

    <div class="signature-grid">
      <div class="sig-block">
        <div class="sig-title">Picker & Packing Officer</div>
        <div>Picked from Shelf & Packed</div>
      </div>
      <div class="sig-block">
        <div class="sig-title">Courier / Logistics Handler</div>
        <div>Received for Transit</div>
      </div>
      <div class="sig-block">
        <div class="sig-title">Customer Acknowledgment</div>
        <div>Received Full Quantity & Verified</div>
      </div>
    </div>

    <div class="footer">
      <span>StockSense IMS • Official Outbound Delivery Order</span>
      <span>Document Ref: ${delivery.delivery_number} • Unhashed Audit Certificate</span>
      <span>Printed: ${formatDate(new Date().toISOString())}</span>
    </div>
  `;

  printHtmlContent(`Delivery Note - ${delivery.delivery_number}`, html);
}
