"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, Clock, Loader2, Image as ImageIcon } from "lucide-react";
import { getBlogs, BlogPost } from "@pharmabag/api-client";

export default function BlogHome() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data } = await getBlogs({ status: 'PUBLISHED' });
        setPosts(data);
      } catch (err) {
        console.error("Failed to fetch posts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="animate-spin text-green-500" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10 px-6 py-4 sticky top-0 bg-black/50 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold tracking-tighter flex items-center gap-2">
            <span className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-black">P</span>
            PHARMABAG <span className="text-green-500">BLOG</span>
          </Link>
          <div className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
            <Link href="/admin" className="text-green-500 hover:text-green-400 transition-colors border border-green-500/20 px-4 py-1.5 rounded-lg bg-green-500/5">Admin Login</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-20 pb-16 px-6 border-b border-white/5 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="inline-block px-3 py-1 rounded-full border border-green-500/30 bg-green-500/10 text-green-500 text-xs font-semibold mb-6">
            LATEST INSIGHTS
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl text-balance">
            Insights for the <span className="text-green-500">Modern Pharmacy</span> Ecosystem.
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl">
            Stay ahead with the latest news, technological trends, and success stories from the PharmaBag platform.
          </p>
        </div>
      </header>

      {/* Blog Grid */}
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link 
              key={post.id} 
              href={`/post/${post.slug}`}
              className="group glass-card overflow-hidden hover:border-green-500/50 transition-all duration-300"
            >
              <div className="aspect-video relative overflow-hidden">
                {post.featuredImage ? (
                  <Image 
                    src={post.featuredImage} 
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                   <div className="w-full h-full bg-white/5 flex items-center justify-center">
                      <ImageIcon className="text-gray-700" size={48} />
                   </div>
                )}
                <div className="absolute top-4 left-4 px-2 py-1 rounded bg-black/60 backdrop-blur-md text-[10px] uppercase font-bold tracking-widest text-green-500 border border-green-500/30">
                  INSIGHT
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(post.createdAt).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Clock size={14} /> 5 min read</span>
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-green-500 transition-colors">
                  {post.title}
                </h3>
                <p className="text-gray-400 text-sm line-clamp-2 mb-6">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-300">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-[10px] text-green-500">A</div>
                    {post.author?.name || 'Admin'}
                  </div>
                  <span className="text-green-500 flex items-center gap-1 text-sm font-semibold group-hover:translate-x-1 transition-transform">
                    Read more <ArrowRight size={16} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {posts.length === 0 && !loading && (
           <div className="py-20 text-center text-gray-500">
              No published insights available yet. Please check back later or login to admin to create content.
           </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-12 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-gray-500 text-sm">
          <div>© 2026 PharmaBag Technologies Inc. All rights reserved.</div>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-white transition-colors">Twitter</Link>
            <Link href="#" className="hover:text-white transition-colors">LinkedIn</Link>
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
