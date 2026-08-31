"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Skeleton } from "@/components/ui";
import BlogPostForm from "@/components/blog/BlogPostForm";
import { useBlogPost } from "@/hooks/useBlog";

export default function EditBlogPostPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const { data: post, isLoading, isError } = useBlogPost(id);

  return (
    <AdminLayout>
      <div className="space-y-5">
        <Link
          href="/blogs"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to blogs
        </Link>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : isError || !post ? (
          <div className="text-sm text-red-600">Couldn&apos;t load this post.</div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-foreground">Edit post</h1>
            <BlogPostForm post={post} />
          </>
        )}
      </div>
    </AdminLayout>
  );
}
