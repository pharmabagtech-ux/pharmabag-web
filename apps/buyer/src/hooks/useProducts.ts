'use client';

import { useQuery } from '@tanstack/react-query';
import { getProducts, getProductById, getCategories, getManufacturers, getCities, getDiscountDetails } from '@pharmabag/api-client';

export function useProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  subCategoryId?: string;
  manufacturer?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  minPrice?: number;
  maxPrice?: number;
}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => getProducts(params),
  });
}

export function useProductById(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id),
    enabled: !!id,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
    staleTime: 30 * 60 * 1000, // 30 min — categories rarely change
  });
}

export function useManufacturers() {
  return useQuery({
    queryKey: ['manufacturers'],
    queryFn: getManufacturers,
    staleTime: 30 * 60 * 1000, // 30 min — manufacturers rarely change
  });
}

export function useCities() {
  return useQuery({
    queryKey: ['cities'],
    queryFn: getCities,
    staleTime: 60 * 60 * 1000, // 1 hour — cities basically never change
  });
}

export function useDiscountDetails(productId: string) {
  return useQuery({
    queryKey: ['discount', productId],
    queryFn: () => getDiscountDetails(productId),
    enabled: !!productId,
  });
}
