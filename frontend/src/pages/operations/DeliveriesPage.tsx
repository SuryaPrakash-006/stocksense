import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { deliveryService } from "@/services/delivery-service";
import { partnerService } from "@/services/partner-service";
import { warehouseService } from "@/services/warehouse-service";
import { productService } from "@/services/product-service";
import { useAuth } from "@/features/auth/AuthContext";
import { DocumentStatus } from "@/types/receipt";
import { DeliveryOrderCreatePayload } from "@/types/delivery";
import { DeliveryFilters } from "@/features/deliveries/DeliveryFilters";
import { DeliveryListTable } from "@/features/deliveries/DeliveryListTable";
import { CreateDeliveryModal } from "@/features/deliveries/CreateDeliveryModal";
import { DeliveryDetailModal } from "@/features/deliveries/DeliveryDetailModal";
import { Button } from "@/components/ui/button";
import { ArrowUpFromLine, Plus, RefreshCw } from "lucide-react";

export const DeliveriesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);

  // Queries
  const {
    data: deliveriesData,
    isLoading: isDeliveriesLoading,
    refetch: refetchDeliveries,
    isFetching,
  } = useQuery({
    queryKey: [
      "deliveries",
      search,
      statusFilter,
      customerFilter,
      warehouseFilter,
      page,
      pageSize,
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      deliveryService.getDeliveries({
        search: search || undefined,
        status: (statusFilter as DocumentStatus) || undefined,
        customer_id: customerFilter || undefined,
        warehouse_id: warehouseFilter || undefined,
        page,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
      }),
  });

  const { data: customers = [], refetch: refetchCustomers } = useQuery({
    queryKey: ["customers"],
    queryFn: () => partnerService.getCustomers(),
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => warehouseService.getWarehouses(),
  });

  const { data: productsData } = useQuery({
    queryKey: ["products-for-deliveries"],
    queryFn: () => productService.getProducts({ page: 1, page_size: 100 }),
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (payload: DeliveryOrderCreatePayload) => deliveryService.createDelivery(payload),
    onSuccess: (newDelivery) => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      setSelectedDeliveryId(newDelivery.id);
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
    setCustomerFilter("");
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
              Outgoing Goods & Delivery Orders
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border">
              {deliveriesData?.total || 0} Orders
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pick, pack, and validate customer shipments. Stock balances decrease automatically upon shipment validation.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchDeliveries()}
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
            <span>New Delivery Order</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <DeliveryFilters
        search={search}
        onSearchChange={(val) => { setSearch(val); setPage(1); }}
        selectedStatus={statusFilter}
        onStatusChange={(val) => { setStatusFilter(val); setPage(1); }}
        selectedCustomer={customerFilter}
        onCustomerChange={(val) => { setCustomerFilter(val); setPage(1); }}
        selectedWarehouse={warehouseFilter}
        onWarehouseChange={(val) => { setWarehouseFilter(val); setPage(1); }}
        customers={customers}
        warehouses={warehouses}
        onReset={handleResetFilters}
      />

      {/* Table */}
      <DeliveryListTable
        deliveries={deliveriesData?.items || []}
        total={deliveriesData?.total || 0}
        page={page}
        pageSize={pageSize}
        pages={deliveriesData?.pages || 1}
        isLoading={isDeliveriesLoading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onPageChange={(p) => setPage(p)}
        onViewDelivery={(id) => setSelectedDeliveryId(id)}
      />

      {/* Modals */}
      <CreateDeliveryModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={async (payload) => { await createMutation.mutateAsync(payload); }}
        customers={customers}
        warehouses={warehouses}
        products={productsData?.items || []}
        onCustomerCreated={() => refetchCustomers()}
      />

      <DeliveryDetailModal
        deliveryId={selectedDeliveryId}
        onClose={() => setSelectedDeliveryId(null)}
        onDeliveryUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ["deliveries"] });
          queryClient.invalidateQueries({ queryKey: ["products"] });
        }}
      />
    </div>
  );
};
