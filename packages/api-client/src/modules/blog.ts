import { api } from '../api';
import { BlogPost, BlogListResponse } from './blogs.api';

// This file is maintained for legacy compatibility.
// New code should import directly from blogs.api.ts

export async function getBlogs(params?: any): Promise<BlogListResponse> {
  const { data } = await api.get('/blog/posts', { params });
  return {
    data: data.data || data,
    total: (data.data || data).length,
  };
}

export async function getBlogById(id: string): Promise<BlogPost> {
  const { data } = await api.get(`/blog/posts/${id}`);
  return data.data || data;
}
