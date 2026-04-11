"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  getBlogById,
  updateBlogPost, 
  uploadBlogImage,
  getProfile
} from "@pharmabag/api-client";
import { 
  ArrowLeft, 
  Save, 
  Image as ImageIcon, 
  Upload, 
  Loader2, 
  Type, 
  FileText,
  PenTool,
  RefreshCcw
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function EditPostPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    status: "DRAFT",
    featuredImage: ""
  });
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        await getProfile();
        const post = await getBlogById(id as string);
        setFormData({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt || "",
          content: post.content?.text || "",
          status: post.status,
          featuredImage: post.featuredImage || ""
        });
      } catch (err) {
        console.error(err);
        router.push("/admin");
      } finally {
        setFetching(false);
      }
    };
    init();
  }, [id, router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadBlogImage(file);
      setFormData(prev => ({ ...prev, featuredImage: url }));
    } catch (err) {
      alert("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateBlogPost(id as string, {
        ...formData,
        content: { text: formData.content }
      });
      router.push("/admin");
    } catch (err: any) {
      alert(err.message || "Failed to update post.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen premium-gradient flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen premium-gradient text-foreground pb-20">
      {/* Navigation */}
      <nav className="border-b border-white/40 px-6 py-4 sticky top-0 bg-white/40 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="flex-shrink-0">
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
             <Link href="/admin" className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-all group">
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                Discard & Exit
              </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-2 text-primary font-bold mb-2 uppercase tracking-widest text-sm">
              <RefreshCcw size={18} />
              Refining Insight
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">Edit Publication</h1>
            <p className="text-gray-500 mt-2 font-medium font-sans">Modify your pharmacological publication details.</p>
          </div>
          
          <div className="flex items-center gap-3 bg-white/50 backdrop-blur-md p-2 rounded-2xl border border-white/60 shadow-xl shadow-primary/5">
            <button
               type="button"
               onClick={() => setFormData({...formData, status: 'DRAFT'})}
               className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                 formData.status === 'DRAFT' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-gray-600'
               }`}
            >
              Draft
            </button>
            <button
               type="button"
               onClick={() => setFormData({...formData, status: 'PUBLISHED'})}
               className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                 formData.status === 'PUBLISHED' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-gray-600'
               }`}
            >
              Publish
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Main Title Section */}
          <div className="glass-card p-10 border-white/60 shadow-xl shadow-primary/5 space-y-8">
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                <Type size={14} className="text-primary" /> Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full bg-white/40 border border-white/60 rounded-2xl py-5 px-8 text-3xl font-extrabold text-gray-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-inner"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                  <FileText size={14} className="text-primary" /> URL Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                  className="w-full bg-white/40 border border-white/60 rounded-xl py-3.5 px-6 focus:outline-none focus:border-primary transition-all font-mono text-sm text-gray-600 shadow-inner"
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                   Tag / Category
                </label>
                <div className="w-full bg-white/40 border border-white/60 rounded-xl py-3.5 px-6 text-sm text-gray-400 font-bold shadow-inner">
                  Industry Research (Fixed)
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                 Summary / Excerpt
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                className="w-full bg-white/40 border border-white/60 rounded-xl py-4 px-6 h-28 focus:outline-none focus:border-primary transition-all resize-none text-gray-700 font-medium leading-relaxed shadow-inner"
              />
            </div>
          </div>

          {/* Visuals Section */}
          <div className="glass-card p-10 border-white/60 shadow-xl shadow-primary/5 space-y-6">
             <div className="flex justify-between items-center px-1">
               <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                 <ImageIcon size={14} className="text-primary" /> Cover Asset
               </label>
               {uploading && (
                 <div className="flex items-center gap-2 text-primary">
                   <Loader2 className="animate-spin" size={16} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Processing...</span>
                 </div>
               )}
             </div>
             
             <div className="relative group">
                {formData.featuredImage ? (
                  <div className="aspect-[21/9] relative rounded-3xl overflow-hidden border-4 border-white shadow-2xl">
                    <img src={formData.featuredImage} alt="Featured" className="w-full h-full object-cover" />
                    <label className="absolute inset-0 bg-primary/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all duration-300">
                      <div className="flex items-center gap-3 bg-white text-primary px-6 py-3 rounded-2xl font-black uppercase tracking-tighter shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform">
                        <Upload size={20} /> Update Visual
                      </div>
                      <input type="file" onChange={handleImageUpload} className="hidden" accept="image/*" />
                    </label>
                  </div>
                ) : (
                  <label className="aspect-[21/9] rounded-3xl border-2 border-dashed border-gray-200 hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center cursor-pointer transition-all group bg-white/30">
                    <div className="p-6 rounded-3xl bg-white shadow-lg group-hover:scale-110 transition-transform mb-6">
                      <Upload className="text-primary" size={40} />
                    </div>
                    <div className="font-extrabold text-gray-900 text-lg">Upload Hero Graphic</div>
                    <input type="file" onChange={handleImageUpload} className="hidden" accept="image/*" />
                  </label>
                )}
             </div>
          </div>

          {/* Editor Section */}
          <div className="glass-card p-10 border-white/60 shadow-xl shadow-primary/5 space-y-4">
             <div className="flex justify-between items-center px-1">
               <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                 <PenTool size={14} className="text-primary" /> Body Content
               </label>
               <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-1 rounded">Markup Enabled</span>
             </div>
             <textarea
               value={formData.content}
               onChange={(e) => setFormData({...formData, content: e.target.value})}
               className="w-full bg-white/40 border border-white/60 rounded-2xl py-8 px-8 h-[600px] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-mono text-gray-700 leading-relaxed shadow-inner"
               required
             />
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-end items-center gap-6 pt-12 pb-10">
             <Link
               href="/admin"
               className="text-sm font-black text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-[0.2em]"
             >
               Revert Changes
             </Link>
             <button
               type="submit"
               disabled={loading || uploading}
               className="bg-primary hover:bg-primary/90 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-2xl shadow-primary/20 flex items-center gap-3 disabled:opacity-50 group min-w-[280px] justify-center"
             >
               {loading ? (
                 <>
                   <Loader2 className="animate-spin" size={20} />
                   Applying Updates...
                 </>
               ) : (
                 <>
                   <Save size={20} className="group-hover:scale-110 transition-transform" />
                   Update Publication
                 </>
               )}
             </button>
          </div>
        </form>
      </main>
    </div>
  );
}
