"use client";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui";
import BlogPostForm from "@/components/blog/BlogPostForm";
import { useBlogPost } from "@/hooks/useBlog";

export default function EditBlogPostPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const { data: post, isLoading, isError } = useBlogPost(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (isError || !post) {
    return <div className="text-sm text-red-600">Couldn&apos;t load this post.</div>;
  }
  return <BlogPostForm post={post} />;
}
