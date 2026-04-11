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
  Clock
} from "lucide-react";
import Link from "next/link";

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
        const { data } = await getBlogs();
        setPosts(data);
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
    // Clear tokens and redirect
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.push("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="animate-spin text-green-500" size={48} />
      </div>
    );
  }

  const stats = [
    { label: "Total Posts", value: posts.length, icon: FileText, color: "text-blue-500" },
    { label: "Total Views", value: posts.reduce((acc, p: any) => acc + (p.views || 0), 0), icon: BarChart2, color: "text-green-500" },
    { label: "Published", value: posts.filter(p => p.status === 'PUBLISHED').length, icon: CheckCircle2, color: "text-purple-500" },
    { label: "Drafts", value: posts.filter(p => p.status === 'DRAFT').length, icon: Clock, color: "text-orange-500" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Sidebar / Nav */}
      <nav className="border-b border-white/10 px-6 py-4 flex justify-between items-center bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-xl font-bold tracking-tighter flex items-center gap-2">
            <span className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-black">P</span>
            ADMIN <span className="text-green-500">PORTAL</span>
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <Link href="/" className="text-sm text-gray-400 hover:text-green-500 transition-colors flex items-center gap-1">
            <ExternalLink size={14} /> View Site
          </Link>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium">{user?.adminProfile?.displayName || 'Admin User'}</div>
            <div className="text-xs text-gray-500 uppercase tracking-widest">{user?.role}</div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Dashboard Overview</h1>
            <p className="text-gray-400">Manage your pharmacological insights and news updates.</p>
          </div>
          <Link 
            href="/admin/new"
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-black px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-green-500/20"
          >
            <Plus size={20} /> Create New Post
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, i) => (
            <div key={i} className="glass-card p-6 border-white/10 flex items-center gap-4">
              <div className={`p-4 rounded-2xl bg-white/5 ${stat.color} border border-white/5`}>
                <stat.icon size={24} />
              </div>
              <div>
                <div className="text-gray-500 text-sm font-medium">{stat.label}</div>
                <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Content Table */}
        <div className="glass-card border-white/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
            <h2 className="font-bold flex items-center gap-2">
              <FileText size={18} className="text-gray-500" /> Recent Posts
            </h2>
            <div className="text-xs text-gray-500 font-medium">SHOWING {posts.length} POSTS</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-widest">
                  <th className="px-6 py-4 font-semibold">Post Title</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Views</th>
                  <th className="px-6 py-4 font-semibold">Author</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-6">
                      <div className="font-bold text-gray-200 group-hover:text-green-500 transition-colors uppercase tracking-tight text-sm">
                        {post.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        {post.slug}
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        {new Date(post.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-widest border ${
                        post.status === 'PUBLISHED' 
                          ? 'border-green-500/30 text-green-500 bg-green-500/5' 
                          : 'border-yellow-500/30 text-yellow-500 bg-yellow-500/5'
                      }`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-gray-400 font-medium text-sm">
                      {(post as any).views || 0}
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px]">A</div>
                        {post.author?.name || 'Admin'}
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link 
                          href={`/admin/edit/${post.id}`}
                          className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-green-500 hover:bg-green-500/10 transition-all"
                        >
                          <Edit size={18} />
                        </Link>
                        <button 
                          onClick={() => handleDelete(post.id)}
                          className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {posts.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-600">
                <FileText size={32} />
              </div>
              <h3 className="text-gray-400 font-medium">No posts found</h3>
              <p className="text-gray-600 text-sm mt-1">Start by creating your first cryptographic insight.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
