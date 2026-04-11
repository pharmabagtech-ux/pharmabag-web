import { api } from '../api';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: any;
  featuredImage?: string;
  coverImage?: string; // Alias for buyer app compatibility
  authorId: string;
  categoryId: string;
  tags: string[];
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt?: string;
  createdAt: string;
  author?: {
    name: string;
    avatar?: string;
    bio?: string;
  };
  category?: {
    name: string;
    slug: string;
  };
}

export interface BlogListResponse {
  data: BlogPost[];
  total: number;
}

export async function getBlogs(params?: { categoryId?: string; status?: string; page?: number; limit?: number; search?: string }): Promise<BlogListResponse> {
  const { data } = await api.get('/blog/posts', { params });
  return {
    data: data.data || data,
    total: data.total || (data.data || data).length,
  };
}

export async function getBlogById(id: string): Promise<BlogPost> {
  const { data } = await api.get(`/blog/posts/${id}`);
  const blog = data.data || data;
  if (blog) {
    blog.coverImage = blog.featuredImage;
  }
  return blog;
}

export async function getBlogBySlug(slug: string): Promise<BlogPost> {
  const { data } = await api.get(`/blog/posts/${slug}`);
  const blog = data.data || data;
  if (blog) {
    blog.coverImage = blog.featuredImage;
  }
  return blog;
}

export async function createBlogPost(postData: any): Promise<BlogPost> {
  const { data } = await api.post('/blog/posts', postData);
  return data.data || data;
}

export async function updateBlogPost(id: string, postData: any): Promise<BlogPost> {
  const { data } = await api.patch(`/blog/posts/${id}`, postData);
  return data.data || data;
}

export async function deleteBlogPost(id: string): Promise<void> {
  await api.delete(`/blog/posts/${id}`);
}

export async function getBlogCategories(): Promise<any[]> {
  const { data } = await api.get('/blog/categories');
  return data.data || data;
}

export async function createBlogCategory(categoryData: any): Promise<any> {
  const { data } = await api.post('/blog/categories', categoryData);
  return data.data || data;
}

export async function uploadBlogImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/storage/blog-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data.url;
}
