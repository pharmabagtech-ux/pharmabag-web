"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Calendar, Share2, Clock, Loader2, Image as ImageIcon } from "lucide-react";
import { getBlogBySlug, BlogPost } from "@pharmabag/api-client";

export default function PostPage() {
  const { id: slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await getBlogBySlug(slug as string);
        setPost(data);
      } catch (err) {
        console.error("Failed to fetch post:", err);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="animate-spin text-green-500" size={48} />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white p-6">
        <div className="text-center glass-card p-12 max-w-lg w-full">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-500">
             <ImageIcon size={40} />
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">Post Not Found</h1>
          <p className="text-gray-400 mb-8">The insight you&apos;re looking for might have been moved or removed.</p>
          <Link href="/" className="bg-green-500 hover:bg-green-600 text-black px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-green-500/20 inline-flex items-center gap-2">
            <ArrowLeft size={18} /> Back to Blog
          </Link>
        </div>
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
          <Link href="/" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Home
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-block px-3 py-1 rounded-full border border-green-500/30 bg-green-500/10 text-green-500 text-xs font-semibold mb-6">
             {post.category?.name || 'INSIGHT'}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-8 leading-[1.1]">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 border-b border-white/5 pb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 text-[10px] font-bold">A</div>
              <span className="text-gray-300 font-medium">{post.author?.name || 'Admin'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={16} /> {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="flex items-center gap-1"><Clock size={16} /> 5 min read</div>
            <button className="flex items-center gap-1 hover:text-white transition-colors ml-auto text-gray-400">
              <Share2 size={16} /> Share
            </button>
          </div>
        </div>

        {/* Hero Image */}
        <div className="relative aspect-[21/9] rounded-3xl overflow-hidden mb-16 shadow-2xl shadow-green-500/5 group border border-white/5">
          {post.featuredImage ? (
            <Image 
              src={post.featuredImage} 
              alt={post.title} 
              fill 
              className="object-cover group-hover:scale-[1.02] transition-transform duration-700"
              priority
            />
          ) : (
            <div className="w-full h-full bg-white/5 flex items-center justify-center">
               <ImageIcon size={64} className="text-gray-700" />
            </div>
          )}
        </div>

        {/* Content */}
        <div 
          className="prose prose-invert prose-green max-w-none 
            [&>h2]:text-3xl [&>h2]:font-bold [&>h2]:mt-12 [&>h2]:mb-6 [&>h2]:tracking-tight
            [&>h3]:text-2xl [&>h3]:font-bold [&>h3]:mt-10 [&>h3]:mb-4 [&>h3]:tracking-tight
            [&>p]:text-xl [&>p]:leading-relaxed [&>p]:text-gray-300 [&>p]:mb-8 [&>p]:font-serif
            [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-8 [&>ul>li]:mb-3 [&>ul>li]:text-gray-300 [&>ul>li]:text-lg
            [&>strong]:text-white [&>strong]:font-bold"
          dangerouslySetInnerHTML={{ __html: typeof post.content === 'string' ? post.content : (post.content?.text || '') }}
        />
        
        {/* Author Bio */}
        <div className="mt-20 p-8 glass-card border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 font-bold text-xl border border-green-500/20">
               {post.author?.name?.[0] || 'A'}
            </div>
            <div>
              <h4 className="font-bold text-xl">{post.author?.name || 'PharmaBag Editor'}</h4>
              <p className="text-sm text-green-500 font-medium">Insights Specialist</p>
            </div>
          </div>
          <p className="text-gray-400 leading-relaxed max-w-2xl">
            {post.author?.bio || "Expert in pharmaceutical supply chain technology and digital transformation. Dedicated to bridging the gap between complexity and clarity in the modern pharmacy ecosystem."}
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-12 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-gray-500 text-sm">
          <div>© 2026 PharmaBag Technologies Inc. All rights reserved.</div>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
