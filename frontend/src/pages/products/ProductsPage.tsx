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

