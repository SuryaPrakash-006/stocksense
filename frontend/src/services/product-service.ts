import { apiClient } from "@/lib/api-client";
import {
  ProductCategory,
  ProductCategoryCreate,
  ProductCategoryUpdate,
  ProductCreatePayload,
  ProductDetail,
  ProductFilterParams,
  ProductPagination,
  ProductUpdatePayload,
} from "@/types/product";

export const productService = {
  // Products
  async getProducts(params?: ProductFilterParams): Promise<ProductPagination> {
    const response = await apiClient.get<ProductPagination>("/products", {
      params,
    });
    return response.data;
  },

  listProducts(params?: ProductFilterParams): Promise<ProductPagination> {
    return this.getProducts(params);
  },

  async getProductById(id: string): Promise<ProductDetail> {
    const response = await apiClient.get<ProductDetail>(`/products/${id}`);
    return response.data;
  },

  async createProduct(payload: ProductCreatePayload): Promise<ProductDetail> {
    const response = await apiClient.post<ProductDetail>("/products", payload);
    return response.data;
  },

  async updateProduct(
    id: string,
    payload: ProductUpdatePayload
  ): Promise<ProductDetail> {
    const response = await apiClient.put<ProductDetail>(`/products/${id}`, payload);
    return response.data;
  },

  async deleteProduct(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/products/${id}`);
    return response.data;
  },

  // Categories
  async getCategories(): Promise<ProductCategory[]> {
    const response = await apiClient.get<ProductCategory[]>("/categories");
    return response.data;
  },

  async createCategory(payload: ProductCategoryCreate): Promise<ProductCategory> {
    const response = await apiClient.post<ProductCategory>("/categories", payload);
    return response.data;
  },

  async updateCategory(
    id: string,
    payload: ProductCategoryUpdate
  ): Promise<ProductCategory> {
    const response = await apiClient.put<ProductCategory>(`/categories/${id}`, payload);
    return response.data;
  },

  async deleteCategory(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/categories/${id}`);
    return response.data;
  },
};
