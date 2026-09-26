import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { receiptService } from "@/services/receipt-service";
import { partnerService } from "@/services/partner-service";
import { warehouseService } from "@/services/warehouse-service";
import { productService } from "@/services/product-service";
import { useAuth } from "@/features/auth/AuthContext";
import { DocumentStatus, ReceiptCreatePayload } from "@/types/receipt";
import { ReceiptFilters } from "@/features/receipts/ReceiptFilters";
import { ReceiptListTable } from "@/features/receipts/ReceiptListTable";
import { CreateReceiptModal } from "@/features/receipts/CreateReceiptModal";
import { ReceiptDetailModal } from "@/features/receipts/ReceiptDetailModal";
import { Button } from "@/components/ui/button";
import { ArrowDownToLine, Plus, RefreshCw } from "lucide-react";

export const ReceiptsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);

  // Queries
  const {
    data: receiptsData,
    isLoading: isReceiptsLoading,
    refetch: refetchReceipts,
    isFetching,
  } = useQuery({
    queryKey: [
      "receipts",
      search,
      statusFilter,
      supplierFilter,
      warehouseFilter,
      page,
      pageSize,
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      receiptService.getReceipts({
        search: search || undefined,
        status: (statusFilter as DocumentStatus) || undefined,
        supplier_id: supplierFilter || undefined,
        warehouse_id: warehouseFilter || undefined,
        page,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
      }),
  });

  const { data: suppliers = [], refetch: refetchSuppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => partnerService.getSuppliers(),
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => warehouseService.getWarehouses(),
  });

  const { data: productsData } = useQuery({
    queryKey: ["products-for-receipts"],
    queryFn: () => productService.getProducts({ page: 1, page_size: 100 }),
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (payload: ReceiptCreatePayload) => receiptService.createReceipt(payload),
    onSuccess: (newReceipt) => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      setSelectedReceiptId(newReceipt.id);
    },
  });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setSupplierFilter("");
    setWarehouseFilter("");
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Incoming Goods & Receipts
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border">
              {receiptsData?.total || 0} Orders
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track vendor purchase receipts, verify shipment contents, and validate physical inventory intake.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchReceipts()}
            disabled={isFetching}
            className="h-9 px-3 text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="h-9 px-3 text-xs flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>New Receipt</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <ReceiptFilters
        search={search}
        onSearchChange={(val) => { setSearch(val); setPage(1); }}
        selectedStatus={statusFilter}
        onStatusChange={(val) => { setStatusFilter(val); setPage(1); }}
        selectedSupplier={supplierFilter}
        onSupplierChange={(val) => { setSupplierFilter(val); setPage(1); }}
        selectedWarehouse={warehouseFilter}
        onWarehouseChange={(val) => { setWarehouseFilter(val); setPage(1); }}
        suppliers={suppliers}
        warehouses={warehouses}
        onReset={handleResetFilters}
      />

      {/* Table */}
      <ReceiptListTable
        receipts={receiptsData?.items || []}
        total={receiptsData?.total || 0}
        page={page}
        pageSize={pageSize}
        pages={receiptsData?.pages || 1}
        isLoading={isReceiptsLoading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onPageChange={(p) => setPage(p)}
        onViewReceipt={(id) => setSelectedReceiptId(id)}
      />

      {/* Modals */}
      <CreateReceiptModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={async (payload) => { await createMutation.mutateAsync(payload); }}
        suppliers={suppliers}
        warehouses={warehouses}
        products={productsData?.items || []}
        onSupplierCreated={() => refetchSuppliers()}
      />

      <ReceiptDetailModal
        receiptId={selectedReceiptId}
        onClose={() => setSelectedReceiptId(null)}
        onReceiptUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ["receipts"] });
          queryClient.invalidateQueries({ queryKey: ["products"] });
        }}
      />
    </div>
  );
};
