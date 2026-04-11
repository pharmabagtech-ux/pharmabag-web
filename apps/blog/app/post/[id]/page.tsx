"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, Share2, Clock, Loader2, Search } from "lucide-react";
import { getBlogBySlug, BlogPost } from "@pharmabag/api-client";

export default function PostPage({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await getBlogBySlug(params.id);
        setPost(data);
      } catch (err) {
        console.error("Failed to fetch post:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen premium-gradient flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen premium-gradient flex items-center justify-center text-foreground">
        <div className="text-center p-8 glass-card">
          <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
          <Link href="/" className="text-primary hover:underline font-medium">Back to Blog</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen premium-gradient text-foreground">
      {/* Navigation */}
      <nav className="border-b border-white/20 px-6 py-4 sticky top-0 bg-white/40 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex-shrink-0 flex items-center gap-2">
            <Image
              src="/pharmabag_logo.png"
              alt="PharmaBag Logo"
              width={140}
              height={36}
              className="h-7 sm:h-9 w-auto"
              priority
            />
          </Link>
          <div className="flex items-center gap-4">
             <Link href="/" className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors group font-medium">
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                Back to Blog
              </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Post Header */}
        <div className="mb-12">
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-500 mb-6">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              {post.category?.name || 'Pharma Insights'}
            </span>
            <span className="flex items-center gap-1.5"><Calendar size={16} /> {new Date(post.createdAt).toLocaleDateString()}</span>
            <span className="flex items-center gap-1.5"><Clock size={16} /> 8 min read</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-8">
            {post.title}
          </h1>

          <div className="flex items-center justify-between py-6 border-y border-gray-200/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-bold">
                {post.author?.name?.[0] || 'A'}
              </div>
              <div>
                <div className="font-bold text-gray-900 text-lg">{post.author?.name || 'Admin'}</div>
                <div className="text-sm text-gray-500">Industry Specialist</div>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
              <Share2 size={18} />
              <span className="font-semibold text-sm">Share</span>
            </button>
          </div>
        </div>

        {/* Featured Image */}
        <div className="relative aspect-[21/9] rounded-3xl overflow-hidden mb-16 shadow-2xl shadow-primary/5">
          <Image
            src={post.featuredImage || post.coverImage || '/placeholder_blog.png'}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Post Content */}
        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed mb-20 bg-white/30 backdrop-blur-sm p-8 md:p-12 rounded-3xl border border-white/40">
           {typeof post.content === 'string' ? (
             <div dangerouslySetInnerHTML={{ __html: post.content }} />
           ) : (
             <p>{JSON.stringify(post.content)}</p>
           )}
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-col md:flex-row items-center justify-between p-10 glass-card rounded-3xl gap-8 shadow-xl shadow-primary/5">
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Want more pharmaceutical insights?</h3>
            <p className="text-gray-600">Explore our knowledge hub for the latest industry updates.</p>
          </div>
          <Link href="/" className="px-8 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 whitespace-nowrap">
            Explore All Posts
          </Link>
        </div>
      </main>

      <footer className="border-t border-gray-200/30 px-6 py-12 mt-20">
        <div className="max-w-7xl mx-auto text-center">
          <Image
            src="/pharmabag_logo.png"
            alt="PharmaBag Logo"
            width={120}
            height={30}
            className="opacity-40 grayscale hover:grayscale-0 transition-all mx-auto mb-6"
          />
          <div className="text-gray-400 text-sm font-medium">
             © 2026 PharmaBag Technologies Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
