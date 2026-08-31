"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import BlogPostForm from "@/components/blog/BlogPostForm";

export default function NewBlogPostPage() {
  return (
    <AdminLayout>
      <div className="space-y-5">
        <Link
          href="/blogs"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to blogs
        </Link>
        <h1 className="text-2xl font-semibold text-foreground">New post</h1>
        <BlogPostForm />
      </div>
    </AdminLayout>
  );
}
