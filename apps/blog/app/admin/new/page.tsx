"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  createBlogPost, 
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
  Sparkles
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function NewPostPage() {
  const [loading, setLoading] = useState(false);
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
      } catch (err) {
        router.push("/admin/login");
      }
    };
    init();
  }, [router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadBlogImage(file);
      setFormData(prev => ({ ...prev, featuredImage: url }));
    } catch (err) {
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Content is saved as a JSON string for structure
      await createBlogPost({
        ...formData,
        content: JSON.stringify({ text: formData.content })
      });
      router.push("/admin");
    } catch (err: any) {
      alert(err.message || "Failed to create post.");
    } finally {
      setLoading(false);
    }
  };

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
                Back to Dashboard
              </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-2 text-primary font-bold mb-2 uppercase tracking-widest text-sm">
              <Sparkles size={18} />
              New Publication
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">Create Insight</h1>
            <p className="text-gray-500 mt-2 font-medium">Draft your next pharmaceutical breakthrough update.</p>
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
                <Type size={14} className="text-primary" /> Post Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="The Future of Pharmaceutical Logistics..."
                className="w-full bg-white/40 border border-white/60 rounded-2xl py-5 px-8 text-3xl font-extrabold text-gray-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-gray-200 shadow-inner"
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
                  placeholder="future-pharma-logistics"
                  className="w-full bg-white/40 border border-white/60 rounded-xl py-3.5 px-6 focus:outline-none focus:border-primary transition-all font-mono text-sm text-gray-600 shadow-inner"
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                   Category Tag
                </label>
                <div className="w-full bg-white/40 border border-white/60 rounded-xl py-3.5 px-6 text-sm text-gray-400 font-bold shadow-inner">
                  Industry Insights (Default)
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
                placeholder="A brief 2-sentence summary that appears on the blog grid..."
                className="w-full bg-white/40 border border-white/60 rounded-xl py-4 px-6 h-28 focus:outline-none focus:border-primary transition-all resize-none text-gray-700 font-medium leading-relaxed shadow-inner"
              />
            </div>
          </div>

          {/* Visuals Section */}
          <div className="glass-card p-10 border-white/60 shadow-xl shadow-primary/5 space-y-6">
             <div className="flex justify-between items-center px-1">
               <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                 <ImageIcon size={14} className="text-primary" /> Featured Visual
               </label>
               {uploading && (
                 <div className="flex items-center gap-2 text-primary">
                   <Loader2 className="animate-spin" size={16} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Optimizing...</span>
                 </div>
               )}
             </div>
             
             <div className="relative group">
                {formData.featuredImage ? (
                  <div className="aspect-[21/9] relative rounded-3xl overflow-hidden border-4 border-white shadow-2xl">
                    <img src={formData.featuredImage} alt="Featured" className="w-full h-full object-cover" />
                    <label className="absolute inset-0 bg-primary/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all duration-300">
                      <div className="flex items-center gap-3 bg-white text-primary px-6 py-3 rounded-2xl font-black uppercase tracking-tighter shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform">
                        <Upload size={20} /> Replace Asset
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
                    <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">Recommended: 1200 x 630px (PNG/JPG)</div>
                    <input type="file" onChange={handleImageUpload} className="hidden" accept="image/*" />
                  </label>
                )}
             </div>
          </div>

          {/* Editor Section */}
          <div className="glass-card p-10 border-white/60 shadow-xl shadow-primary/5 space-y-4">
             <div className="flex justify-between items-center px-1">
               <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                 <PenTool size={14} className="text-primary" /> Narrative Content
               </label>
               <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-1 rounded">Markdown Ready</span>
             </div>
             <textarea
               value={formData.content}
               onChange={(e) => setFormData({...formData, content: e.target.value})}
               placeholder="Start your narrative here..."
               className="w-full bg-white/40 border border-white/60 rounded-2xl py-8 px-8 h-[600px] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-mono text-gray-700 leading-relaxed shadow-inner scrollbar-hide"
               required
             />
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-end items-center gap-6 pt-12 pb-10">
             <Link
               href="/admin"
               className="text-sm font-black text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-[0.2em]"
             >
               Discard Changes
             </Link>
             <button
               type="submit"
               disabled={loading || uploading}
               className="bg-primary hover:bg-primary/90 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-2xl shadow-primary/20 flex items-center gap-3 disabled:opacity-50 group min-w-[280px] justify-center"
             >
               {loading ? (
                 <>
                   <Loader2 className="animate-spin" size={20} />
                   Finalizing...
                 </>
               ) : (
                 <>
                   <Save size={20} className="group-hover:scale-110 transition-transform" />
                   {formData.status === 'PUBLISHED' ? 'Publish Insight' : 'Save Draft'}
                 </>
               )}
             </button>
          </div>
        </form>
      </main>
    </div>
  );
}
