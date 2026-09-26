import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adjustmentService } from "@/services/adjustment-service";
import { productService } from "@/services/product-service";
import { warehouseService } from "@/services/warehouse-service";
import {
  AdjustmentFilterParams,
  AdjustmentStatus,
  InventoryAdjustmentCreatePayload,
} from "@/types/adjustment";
import { AdjustmentFilters } from "@/features/adjustments/AdjustmentFilters";
import { AdjustmentListTable } from "@/features/adjustments/AdjustmentListTable";
import { CreateAdjustmentModal } from "@/features/adjustments/CreateAdjustmentModal";
import { AdjustmentDetailModal } from "@/features/adjustments/AdjustmentDetailModal";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, SlidersHorizontal } from "lucide-react";

export const AdjustmentsPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Filters State
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [locationId, setLocationId] = useState<string>("");
  const [warehouseId, setWarehouseId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedAdjustmentId, setSelectedAdjustmentId] = useState<string | null>(null);

  const filterParams: AdjustmentFilterParams = {
    search: search.trim() || undefined,
    status: (status as AdjustmentStatus) || undefined,
    location_id: locationId || undefined,
    warehouse_id: warehouseId || undefined,
    page,
    page_size: 15,
    sort_by: sortBy,
    sort_order: sortOrder,
  };

  const {
    data: adjustmentData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["adjustments", filterParams],
    queryFn: () => adjustmentService.listAdjustments(filterParams),
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

  const { data: selectedAdjustment } = useQuery({
    queryKey: ["adjustment-detail", selectedAdjustmentId],
    queryFn: () =>
      selectedAdjustmentId
        ? adjustmentService.getAdjustmentById(selectedAdjustmentId)
        : null,
    enabled: Boolean(selectedAdjustmentId),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: InventoryAdjustmentCreatePayload) =>
      adjustmentService.createAdjustment(payload),
    onSuccess: (newAdj) => {
      queryClient.invalidateQueries({ queryKey: ["adjustments"] });
      setIsCreateOpen(false);
      setSelectedAdjustmentId(newAdj.id);
    },
  });

  const applyMutation = useMutation({
    mutationFn: (id: string) => adjustmentService.validateAdjustment(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["adjustments"] });
      queryClient.invalidateQueries({ queryKey: ["adjustment-detail", updated.id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["moves"] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => adjustmentService.cancelAdjustment(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["adjustments"] });
      queryClient.invalidateQueries({ queryKey: ["adjustment-detail", updated.id] });
    },
  });

  const handleResetFilters = () => {
    setSearch("");
    setStatus("");
    setLocationId("");
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
            <SlidersHorizontal className="h-6 w-6 text-purple-600" />
            <span>Stock Adjustments</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Perform physical count reconciliations and adjust stock levels with full auditability.
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
            className="h-9 px-3 text-xs bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>New Adjustment</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <AdjustmentFilters
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
        selectedLocation={locationId}
        onLocationChange={(val) => {
          setLocationId(val);
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
      <AdjustmentListTable
        adjustments={adjustmentData?.items || []}
        isLoading={isLoading}
        total={adjustmentData?.total || 0}
        page={page}
        pageSize={15}
        pages={adjustmentData?.pages || 1}
        onPageChange={(newPage) => setPage(newPage)}
        onSelectAdjustment={(adj) => setSelectedAdjustmentId(adj.id)}
        onSort={handleSort}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />

      {/* Create Modal */}
      <CreateAdjustmentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={async (payload) => {
          await createMutation.mutateAsync(payload);
        }}
        products={productsData?.items || []}
        locations={locations}
        isSubmitting={createMutation.isPending}
      />

      {/* Detail Modal */}
      <AdjustmentDetailModal
        adjustment={selectedAdjustment || null}
        isOpen={Boolean(selectedAdjustmentId)}
        onClose={() => setSelectedAdjustmentId(null)}
        onApply={async (id) => {
          await applyMutation.mutateAsync(id);
        }}
        onCancel={async (id) => {
          await cancelMutation.mutateAsync(id);
        }}
        isApplying={applyMutation.isPending}
        isCanceling={cancelMutation.isPending}
      />
    </div>
  );
};
