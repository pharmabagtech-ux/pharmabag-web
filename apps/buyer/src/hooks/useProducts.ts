'use client';

import { useQuery } from '@tanstack/react-query';
import { getProducts, getProductById, getCategories } from '@pharmabag/api-client';

export function useProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
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
  });
}
