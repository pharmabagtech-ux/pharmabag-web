"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Search, Calendar, Clock, Loader2 } from "lucide-react";
import { getBlogs, BlogPost } from "@pharmabag/api-client";

export default function BlogHome() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await getBlogs();
        // getBlogs returns { data: BlogPost[], total: number }
        setBlogs(response.data || []);
      } catch (err) {
        console.error("Failed to fetch blogs:", err);
        setBlogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen premium-gradient flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen premium-gradient text-foreground">
      {/* Navigation */}
      <nav className="border-b border-white/20 px-6 py-4 sticky top-0 bg-white/40 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex-shrink-0">
              <Image
                src="/pharmabag_logo.png"
                alt="PharmaBag Logo"
                width={150}
                height={40}
                className="h-8 sm:h-10 w-auto"
                priority
              />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-500 hover:text-primary transition-colors">
              <Search size={22} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <section className="mb-20 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-6 uppercase tracking-widest border border-primary/20">
            Official Blog
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-gray-900 leading-[1.1]">
            Insights for the <span className="text-primary italic">Future</span> of Pharma
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Exploring the intersection of healthcare, supply chain innovation, and technology at PharmaBag.
          </p>
        </section>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.isArray(blogs) && blogs.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <h2 className="text-2xl font-bold text-gray-500">No blog posts found.</h2>
            </div>
          ) : (
            blogs.map((post) => (
              <Link 
                key={post.id} 
                href={`/post/${post.slug}`}
                className="group relative flex flex-col h-full glass-card hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-white/40"
              >
                {/* Image Container */}
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl mb-6 border border-white/20">
                  <Image
                    src={post.featuredImage || post.coverImage || '/placeholder_blog.png'}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-sm text-primary text-[10px] font-bold uppercase tracking-wider border border-white shadow-sm">
                      {post.category?.name || 'Pharma'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-grow">
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 font-medium">
                    <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(post.createdAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1.5"><Clock size={14} /> 5 min read</span>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-4 text-gray-900 group-hover:text-primary transition-colors leading-tight">
                    {post.title}
                  </h3>
                  
                  <p className="text-gray-600 line-clamp-2 text-base leading-relaxed mb-8 flex-grow">
                    {typeof post.content === 'string' ? post.content.replace(/<[^>]*>/g, '').substring(0, 150) : 'Read the latest insights from PharmaBag Technologies...'}
                  </p>

                  <div className="mt-auto flex items-center justify-between pt-6 border-t border-gray-200/50">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                        {post.author?.name?.[0] || 'A'}
                      </div>
                      <span className="text-xs font-bold text-gray-900">{post.author?.name || 'Admin'}</span>
                    </div>
                    <span className="text-primary group-hover:translate-x-1 transition-transform">
                      <ArrowRight size={20} />
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>

      {/* Footer */}
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
