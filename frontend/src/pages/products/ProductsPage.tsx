import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productService } from "@/services/product-service";
import { warehouseService } from "@/services/warehouse-service";
import { useAuth } from "@/features/auth/AuthContext";
import { ProductListItem, ProductCreatePayload, ProductUpdatePayload, StockStatus } from "@/types/product";
import { ProductFilters } from "@/features/products/ProductFilters";
import { ProductListTable } from "@/features/products/ProductListTable";
import { CreateProductModal } from "@/features/products/CreateProductModal";
import { EditProductModal } from "@/features/products/EditProductModal";
import { ProductDetailModal } from "@/features/products/ProductDetailModal";
import { CategoryManagementModal } from "@/features/products/CategoryManagementModal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/ToastContext";
import { Boxes, FolderTree, Plus, RefreshCw, Database } from "lucide-react";

export const ProductsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const isManager = user?.role === "INVENTORY_MANAGER" || user?.role === "ADMIN" || !user?.role;

  // Filter States
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [stockStatusFilter, setStockStatusFilter] = useState<StockStatus>("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductListItem | null>(null);

  // Queries
  const {
    data: productsData,
    isLoading: isProductsLoading,
    refetch: refetchProducts,
    isFetching,
  } = useQuery({
    queryKey: [
      "products",
      search,
      categoryFilter,
      warehouseFilter,
      stockStatusFilter,
      page,
      pageSize,
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      productService.getProducts({
        search: search || undefined,
        category_id: categoryFilter || undefined,
        warehouse_id: warehouseFilter || undefined,
        stock_status: stockStatusFilter,
        page,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
      }),
  });

  const { data: categories = [], refetch: refetchCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => productService.getCategories(),
  });

  const { data: warehouses = [], refetch: refetchWarehouses } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => warehouseService.getWarehouses(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: ProductCreatePayload) => productService.createProduct(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      toast.success(
        `Product '${data.name}' (${data.sku}) successfully added and synced with database.`
      );
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.detail || "Failed to create product. Check SKU uniqueness."
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ProductUpdatePayload }) =>
      productService.updateProduct(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      toast.success(`Product '${data.name}' updated successfully.`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to update product.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      toast.success("Product deactivated successfully.");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to deactivate product.");
    },
  });

  // Handlers
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
    setCategoryFilter("");
    setWarehouseFilter("");
    setStockStatusFilter("ALL");
    setPage(1);
  };

  const handleSyncWithDb = async () => {
    try {
      await Promise.all([
        refetchProducts(),
        refetchCategories(),
        refetchWarehouses(),
      ]);
      toast.info("Product catalog synchronized with PostgreSQL database.");
    } catch {
      toast.error("Failed to sync product data with database.");
    }
  };

  const handleDelete = async (product: ProductListItem) => {
    if (Number(product.total_stock) > 0) {
      toast.warning(
        `Cannot delete '${product.name}' because it currently has ${product.total_stock} ${product.unit_of_measure} on hand.`
      );
      return;
    }
    if (confirm(`Are you sure you want to deactivate product '${product.name}' (${product.sku})?`)) {
      try {
        await deleteMutation.mutateAsync(product.id);
      } catch (err: any) {
        // Handled in mutation onError
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Product Master Catalog
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border">
              {productsData?.total || 0} Products
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage product SKU codes, stock levels, reorder parameters, and multi-location availability.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Sync / Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncWithDb}
            disabled={isFetching}
            className="h-9 px-3 text-xs flex items-center gap-1.5 shadow-sm"
            title="Sync products table with latest PostgreSQL database records"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            <span>{isFetching ? "Syncing..." : "Sync with DB"}</span>
          </Button>

          {/* Categories Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCategoryOpen(true)}
            className="h-9 px-3 text-xs flex items-center gap-1.5"
          >
            <FolderTree className="h-3.5 w-3.5" />
            <span>Categories ({categories.length})</span>
          </Button>

          {/* Primary Add Product Button */}
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="h-9 px-3.5 text-xs flex items-center gap-1.5 shadow font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <ProductFilters
        search={search}
        onSearchChange={(val) => { setSearch(val); setPage(1); }}
        selectedCategory={categoryFilter}
        onCategoryChange={(val) => { setCategoryFilter(val); setPage(1); }}
        selectedStockStatus={stockStatusFilter}
        onStockStatusChange={(val) => { setStockStatusFilter(val); setPage(1); }}
        selectedWarehouse={warehouseFilter}
        onWarehouseChange={(val) => { setWarehouseFilter(val); setPage(1); }}
        categories={categories}
        warehouses={warehouses}
        onReset={handleResetFilters}
      />

      {/* Products Table */}
      <ProductListTable
        products={productsData?.items || []}
        total={productsData?.total || 0}
        page={page}
        pageSize={pageSize}
        pages={productsData?.pages || 1}
        isLoading={isProductsLoading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onPageChange={(p) => setPage(p)}
        onViewProduct={(id) => setSelectedProductId(id)}
        onEditProduct={(p) => setEditingProduct(p)}
        onDeleteProduct={handleDelete}
        onAddProduct={() => setIsCreateOpen(true)}
        isManager={isManager}
      />

      {/* Modals */}
      <CreateProductModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={async (payload) => { await createMutation.mutateAsync(payload); }}
        categories={categories}
        warehouses={warehouses}
      />

      <EditProductModal
        isOpen={!!editingProduct}
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onSubmit={async (id, payload) => { await updateMutation.mutateAsync({ id, payload }); }}
        categories={categories}
      />

      <ProductDetailModal
        productId={selectedProductId}
        onClose={() => setSelectedProductId(null)}
      />

      <CategoryManagementModal
        isOpen={isCategoryOpen}
        onClose={() => setIsCategoryOpen(false)}
        categories={categories}
        onCategoriesChanged={() => {
          refetchCategories();
          refetchProducts();
        }}
      />
    </div>
  );
};
