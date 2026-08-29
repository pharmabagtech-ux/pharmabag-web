"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getBlogPosts,
  getBlogPost,
  createBlogPost,
  updateBlogPost,
  updateBlogPostStatus,
  deleteBlogPost,
  getBlogAuthors,
  createBlogAuthor,
  getBlogCategories,
  createBlogCategory,
  type BlogPostPayload,
} from "@/api/blog.api";

export function useBlogPosts(params: { page?: number; search?: string; status?: string } = {}) {
  return useQuery({ queryKey: ["admin", "blog", "posts", params], queryFn: () => getBlogPosts(params), staleTime: 30_000, retry: 1 });
}
export function useBlogPost(id: string) {
  return useQuery({ queryKey: ["admin", "blog", "post", id], queryFn: () => getBlogPost(id), enabled: !!id, retry: 1 });
}
export function useBlogAuthors() {
  return useQuery({ queryKey: ["admin", "blog", "authors"], queryFn: getBlogAuthors, staleTime: 60_000, retry: 1 });
}
export function useBlogCategories() {
  return useQuery({ queryKey: ["admin", "blog", "categories"], queryFn: getBlogCategories, staleTime: 60_000, retry: 1 });
}

function useInvalidateBlog() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: ["admin", "blog"] });
}

export function useCreateBlogPost() {
  const invalidate = useInvalidateBlog();
  return useMutation({ mutationFn: (p: BlogPostPayload) => createBlogPost(p), onSuccess: invalidate });
}
export function useUpdateBlogPost() {
  const invalidate = useInvalidateBlog();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<BlogPostPayload> }) => updateBlogPost(id, payload),
    onSuccess: invalidate,
  });
}
export function useUpdateBlogPostStatus() {
  const invalidate = useInvalidateBlog();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "DRAFT" | "PUBLISHED" }) => updateBlogPostStatus(id, status),
    onSuccess: invalidate,
  });
}
export function useDeleteBlogPost() {
  const invalidate = useInvalidateBlog();
  return useMutation({ mutationFn: (id: string) => deleteBlogPost(id), onSuccess: invalidate });
}
export function useCreateBlogAuthor() {
  const invalidate = useInvalidateBlog();
  return useMutation({ mutationFn: createBlogAuthor, onSuccess: invalidate });
}
export function useCreateBlogCategory() {
  const invalidate = useInvalidateBlog();
  return useMutation({ mutationFn: createBlogCategory, onSuccess: invalidate });
}
