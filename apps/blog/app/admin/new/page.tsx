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
  FileText
} from "lucide-react";
import Link from "next/link";

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
      alert("Failed to upload image to S3.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createBlogPost({
        ...formData,
        content: JSON.stringify({ text: formData.content }) // Simplified content for now
      });
      router.push("/admin");
    } catch (err: any) {
      alert(err.message || "Failed to create post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <Link href="/admin" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
            <ArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
          </Link>
          <div className="flex gap-4">
            <button
               onClick={() => setFormData({...formData, status: 'DRAFT'})}
               className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                 formData.status === 'DRAFT' ? 'border-green-500 text-green-500 bg-green-500/5' : 'border-white/10 text-gray-500'
               }`}
            >
              Draft
            </button>
            <button
               onClick={() => setFormData({...formData, status: 'PUBLISHED'})}
               className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                 formData.status === 'PUBLISHED' ? 'border-green-500 text-green-500 bg-green-500/5' : 'border-white/10 text-gray-500'
               }`}
            >
              Publish
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="glass-card p-8 border-white/10 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Type size={16} /> Post Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Enter a compelling title..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-2xl font-bold focus:outline-none focus:border-green-500/50 transition-all placeholder:text-gray-700"
                required
              />
            </div>

            <div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <FileText size={16} /> Slug (URL Identifier)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                  placeholder="how-to-manage-pharmacy"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 focus:outline-none focus:border-green-500/50 transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Excerpt / Short Description</label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                placeholder="A brief summary for the blog grid..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 h-24 focus:outline-none focus:border-green-500/50 transition-all resize-none"
              />
            </div>
          </div>

          <div className="glass-card p-8 border-white/10 space-y-6">
             <div className="flex justify-between items-center">
               <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                 <ImageIcon size={16} /> Featured Image (S3 Upload)
               </label>
               {uploading && <Loader2 className="animate-spin text-green-500" size={16} />}
             </div>
             
             <div className="relative group">
                {formData.featuredImage ? (
                  <div className="aspect-video relative rounded-2xl overflow-hidden border border-white/10">
                    <img src={formData.featuredImage} alt="Featured" className="w-full h-full object-cover" />
                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                      <div className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-bold">
                        <Upload size={18} /> Change Image
                      </div>
                      <input type="file" onChange={handleImageUpload} className="hidden" accept="image/*" />
                    </label>
                  </div>
                ) : (
                  <label className="aspect-video rounded-2xl border-2 border-dashed border-white/10 hover:border-green-500/50 hover:bg-green-500/5 flex flex-col items-center justify-center cursor-pointer transition-all group">
                    <div className="p-4 rounded-full bg-white/5 group-hover:bg-green-500/10 mb-4 transition-colors">
                      <Upload className="text-gray-500 group-hover:text-green-500" size={32} />
                    </div>
                    <div className="font-bold text-gray-400 group-hover:text-white">Upload Brandable Visual</div>
                    <div className="text-xs text-gray-600 mt-1">Recommended: 1200 x 630px</div>
                    <input type="file" onChange={handleImageUpload} className="hidden" accept="image/*" />
                  </label>
                )}
             </div>
          </div>

          <div className="glass-card p-8 border-white/10 space-y-4">
             <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
               <FileText size={16} /> Main Content (Markdown Supported)
             </label>
             <textarea
               value={formData.content}
               onChange={(e) => setFormData({...formData, content: e.target.value})}
               placeholder="Start writing your pharmaceutical insights..."
               className="w-full bg-white/5 border border-white/10 rounded-xl py-6 px-6 h-[500px] focus:outline-none focus:border-green-500/50 transition-all font-mono text-sm leading-relaxed"
               required
             />
          </div>

          <div className="flex justify-end gap-6 pt-8">
             <button
               type="button"
               onClick={() => router.push('/admin')}
               className="px-8 py-3 rounded-xl font-bold text-gray-400 hover:text-white transition-colors"
             >
               Cancel
             </button>
             <button
               type="submit"
               disabled={loading || uploading}
               className="bg-green-500 hover:bg-green-600 text-black px-12 py-3 rounded-xl font-bold transition-all shadow-lg shadow-green-500/20 flex items-center gap-2 disabled:opacity-50"
             >
               {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
               Save {formData.status === 'PUBLISHED' ? 'And Publish' : 'Draft'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
