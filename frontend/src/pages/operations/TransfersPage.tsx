import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { transferService } from "@/services/transfer-service";
import { productService } from "@/services/product-service";
import { warehouseService } from "@/services/warehouse-service";
import {
  InternalTransfer,
  InternalTransferCreatePayload,
  TransferFilterParams,
} from "@/types/transfer";
import { DocumentStatus } from "@/types/receipt";
import { TransferFilters } from "@/features/transfers/TransferFilters";
import { TransferListTable } from "@/features/transfers/TransferListTable";
import { CreateTransferModal } from "@/features/transfers/CreateTransferModal";
import { TransferDetailModal } from "@/features/transfers/TransferDetailModal";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Truck } from "lucide-react";

export const TransfersPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Filters State
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [sourceLocationId, setSourceLocationId] = useState<string>("");
  const [destLocationId, setDestLocationId] = useState<string>("");
  const [warehouseId, setWarehouseId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modals State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTransferId, setSelectedTransferId] = useState<string | null>(null);

  // Filter params
  const filterParams: TransferFilterParams = {
    search: search.trim() || undefined,
    status: (status as DocumentStatus) || undefined,
    source_location_id: sourceLocationId || undefined,
    destination_location_id: destLocationId || undefined,
    warehouse_id: warehouseId || undefined,
    page,
    page_size: 15,
    sort_by: sortBy,
    sort_order: sortOrder,
  };

  // Queries
  const {
    data: transferData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["transfers", filterParams],
    queryFn: () => transferService.listTransfers(filterParams),
  });

  const { data: productsData } = useQuery({
    queryKey: ["products-lookup"],
    queryFn: () => productService.listProducts({ page_size: 100 }),
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => warehouseService.listWarehouses(),
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: () => warehouseService.listLocations(),
  });

  // Selected Transfer Detail Query
  const { data: selectedTransfer } = useQuery({
    queryKey: ["transfer-detail", selectedTransferId],
    queryFn: () =>
      selectedTransferId
        ? transferService.getTransferById(selectedTransferId)
        : null,
    enabled: Boolean(selectedTransferId),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: InternalTransferCreatePayload) =>
      transferService.createTransfer(payload),
    onSuccess: (newTransfer) => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsCreateOpen(false);
      setSelectedTransferId(newTransfer.id);
    },
  });

  const validateMutation = useMutation({
    mutationFn: (id: string) => transferService.validateTransfer(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      queryClient.invalidateQueries({ queryKey: ["transfer-detail", updated.id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["moves"] });
    },
  });

  const markReadyMutation = useMutation({
    mutationFn: (id: string) =>
      transferService.updateTransfer(id, { status: "READY" }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      queryClient.invalidateQueries({ queryKey: ["transfer-detail", updated.id] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => transferService.cancelTransfer(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      queryClient.invalidateQueries({ queryKey: ["transfer-detail", updated.id] });
    },
  });

  const handleResetFilters = () => {
    setSearch("");
    setStatus("");
    setSourceLocationId("");
    setDestLocationId("");
    setWarehouseId("");
    setPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Truck className="h-6 w-6 text-indigo-600" />
            <span>Internal Transfers</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Reallocate stock between locations and warehouses with full audit trails.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-9 px-3 text-xs"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-1.5 ${isRefetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="h-9 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>New Transfer</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <TransferFilters
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        selectedStatus={status}
        onStatusChange={(val) => {
          setStatus(val);
          setPage(1);
        }}
        selectedSourceLocation={sourceLocationId}
        onSourceLocationChange={(val) => {
          setSourceLocationId(val);
          setPage(1);
        }}
        selectedDestLocation={destLocationId}
        onDestLocationChange={(val) => {
          setDestLocationId(val);
          setPage(1);
        }}
        selectedWarehouse={warehouseId}
        onWarehouseChange={(val) => {
          setWarehouseId(val);
          setPage(1);
        }}
        warehouses={warehouses}
        locations={locations}
        onReset={handleResetFilters}
      />

      {/* Table */}
      <TransferListTable
        transfers={transferData?.items || []}
        isLoading={isLoading}
        total={transferData?.total || 0}
        page={page}
        pageSize={15}
        pages={transferData?.pages || 1}
        onPageChange={(newPage) => setPage(newPage)}
        onSelectTransfer={(t) => setSelectedTransferId(t.id)}
        onSort={handleSort}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />

      {/* Create Modal */}
      <CreateTransferModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={async (payload) => {
          await createMutation.mutateAsync(payload);
        }}
        products={productsData?.items || []}
        warehouses={warehouses}
        locations={locations}
        isSubmitting={createMutation.isPending}
      />

      {/* Detail Modal */}
      <TransferDetailModal
        transfer={selectedTransfer || null}
        isOpen={Boolean(selectedTransferId)}
        onClose={() => setSelectedTransferId(null)}
        onValidate={async (id) => {
          await validateMutation.mutateAsync(id);
        }}
        onMarkReady={async (id) => {
          await markReadyMutation.mutateAsync(id);
        }}
        onCancel={async (id) => {
          await cancelMutation.mutateAsync(id);
        }}
        isValidating={validateMutation.isPending}
        isCanceling={cancelMutation.isPending}
      />
    </div>
  );
};
