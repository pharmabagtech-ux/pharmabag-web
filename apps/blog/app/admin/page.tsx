"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  getBlogs, 
  deleteBlogPost, 
  getProfile,
  BlogPost
} from "@pharmabag/api-client";
import { 
  Plus, 
  Trash2, 
  Edit, 
  ExternalLink, 
  FileText, 
  BarChart2, 
  LogOut,
  Loader2,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  Search
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function AdminDashboard() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        const u = await getProfile();
        if (u.role !== 'ADMIN') throw new Error('Unauthorized');
        setUser(u);
        const response = await getBlogs();
        setPosts(response.data || []);
      } catch (err) {
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await deleteBlogPost(id);
      setPosts(posts.filter(p => p.id !== id));
    } catch (err) {
      alert("Failed to delete post.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.push("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen premium-gradient flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  const stats = [
    { label: "Total Posts", value: posts.length, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Views", value: posts.reduce((acc, p: any) => acc + (p.views || 0), 0), icon: BarChart2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Published", value: posts.filter(p => p.status === 'PUBLISHED').length, icon: CheckCircle2, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Drafts", value: posts.filter(p => p.status === 'DRAFT').length, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  ];

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
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Admin Portal</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <Link href="/" className="hidden sm:flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-all">
              <ExternalLink size={18} /> View Blog
            </Link>
            <div className="h-6 w-px bg-gray-300" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-gray-900 leading-tight">{user?.name || 'Admin User'}</div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Administrator</div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-10 h-10 rounded-xl bg-white/80 border border-white flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-2 text-primary font-bold mb-2">
              <LayoutDashboard size={20} />
              <span className="text-sm uppercase tracking-widest">Dashboard</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">Content Overview</h1>
            <p className="text-gray-500 mt-2 font-medium">Manage and monitor your pharmacological publications.</p>
          </div>
          <Link 
            href="/admin/new"
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-primary/20 w-fit group"
          >
            <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
            Create New Post
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, i) => (
            <div key={i} className="glass-card p-6 border-white/60 flex items-center gap-6 group hover:shadow-xl transition-all duration-300">
              <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} border border-white shadow-inner group-hover:scale-110 transition-transform`}>
                <stat.icon size={28} />
              </div>
              <div>
                <div className="text-gray-500 text-sm font-bold uppercase tracking-wide">{stat.label}</div>
                <div className="text-3xl font-extrabold tracking-tighter text-gray-900">{stat.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Content Table */}
        <div className="glass-card border-white/60 overflow-hidden shadow-2xl shadow-primary/5">
          <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white/40">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-3">
              <FileText size={22} className="text-primary" /> 
              Recent Publications
            </h2>
            <div className="flex items-center gap-4">
               <div className="relative hidden lg:block">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                 <input 
                  type="text" 
                  placeholder="Filter posts..." 
                  className="bg-white/50 border border-gray-200 pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:border-primary transition-all w-64"
                 />
               </div>
               <div className="bg-primary/10 px-3 py-1.5 rounded-lg text-[10px] text-primary font-black uppercase tracking-widest border border-primary/10">
                 {posts.length} Total
               </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-[10px] uppercase font-black tracking-[0.2em] bg-gray-50/30">
                  <th className="px-8 py-5 font-black">Publication Details</th>
                  <th className="px-8 py-5 font-black">Status</th>
                  <th className="px-8 py-5 font-black">Engagement</th>
                  <th className="px-8 py-5 font-black text-right">Settings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/50">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-white/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-gray-900 group-hover:text-primary transition-colors text-base leading-tight mb-1">
                          {post.title}
                        </span>
                        <div className="text-xs text-gray-500 font-medium flex items-center gap-2">
                          <span className="text-primary/70">{post.category?.name || 'Pharma'}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300" />
                          {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-widest border ${
                        post.status === 'PUBLISHED' 
                          ? 'border-emerald-200 text-emerald-700 bg-emerald-50' 
                          : 'border-amber-200 text-amber-700 bg-amber-50'
                      }`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-extrabold text-gray-900">{(post as any).views || 0}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Views</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        <Link 
                          href={`/admin/edit/${post.id}`}
                          className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-primary hover:border-primary/30 hover:shadow-lg transition-all"
                          title="Edit Publication"
                        >
                          <Edit size={20} />
                        </Link>
                        <button 
                          onClick={() => handleDelete(post.id)}
                          className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 hover:shadow-lg transition-all"
                          title="Delete Publication"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {posts.length === 0 && (
            <div className="py-24 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-gray-300 border border-gray-100 shadow-inner">
                <FileText size={40} />
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-2">No publications yet</h3>
              <p className="text-gray-500 font-medium max-w-xs mx-auto">Start sharing your pharmaceutical expertise with the world.</p>
              <Link href="/admin/new" className="inline-block mt-8 text-primary font-bold hover:underline">
                Create your first post →
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
