"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Edit2, Trash2, FolderTree, ArrowRight, Loader2 } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Input, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory,
  useSubCategories, useCreateSubCategory, useUpdateSubCategory, useDeleteSubCategory
} from "@/hooks/useAdmin";

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function AdminCategoriesPage() {
  const [view, setView] = useState<"categories" | "subcategories">("categories");
  const [search, setSearch] = useState("");

  const { data: categoriesData, isLoading: catLoading } = useCategories();
  const { data: subCatsData, isLoading: subLoading } = useSubCategories();

  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();
  const createSubCat = useCreateSubCategory();
  const updateSubCat = useUpdateSubCategory();
  const deleteSubCat = useDeleteSubCategory();

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editId, setEditId] = useState("");
  const [formData, setFormData] = useState({ name: "", slug: "", categoryId: "" });

  const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.categories ?? []);
  const subCategories = Array.isArray(subCatsData) ? subCatsData : (subCatsData?.subCategories ?? []);

  const openModal = (mode: "create" | "edit", item?: any) => {
    setModalMode(mode);
    setEditId(item?.id || "");
    setFormData({
      name: item?.name || "",
      slug: item?.slug || "",
      categoryId: item?.categoryId || (categories.length > 0 ? categories[0].id : ""),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormData({ name: "", slug: "", categoryId: "" });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({ ...prev, name, slug: slugify(name) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (view === "categories") {
        if (modalMode === "create") {
          await createCat.mutateAsync({ name: formData.name, slug: formData.slug });
          toast.success("Category created");
        } else {
          await updateCat.mutateAsync({ id: editId, payload: { name: formData.name, slug: formData.slug } });
          toast.success("Category updated");
        }
      } else {
        if (!formData.categoryId) return toast.error("Select a parent category");
        if (modalMode === "create") {
          await createSubCat.mutateAsync({ name: formData.name, slug: formData.slug, categoryId: formData.categoryId });
          toast.success("Subcategory created");
        } else {
          await updateSubCat.mutateAsync({ id: editId, payload: { name: formData.name, slug: formData.slug, categoryId: formData.categoryId } });
          toast.success("Subcategory updated");
        }
      }
      closeModal();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Permanently delete "${name}"? This action cannot be undone.`)) return;
    try {
      if (view === "categories") {
        await deleteCat.mutateAsync(id);
      } else {
        await deleteSubCat.mutateAsync(id);
      }
      toast.success(`"${name}" deleted`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete");
    }
  };

  const isLoading = view === "categories" ? catLoading : subLoading;
  const list = view === "categories" ? categories : subCategories;
  const filtered = list.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase()) ||
    (view === "subcategories" && c.category?.name?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-semibold text-2xl text-foreground flex items-center gap-2">
              <FolderTree className="h-6 w-6 text-primary" />
              Categories & Taxonomy
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your product categorization hierarchy</p>
          </div>
          <Button onClick={() => openModal("create")} leftIcon={<Plus className="h-4 w-4" />}>
            Add {view === "categories" ? "Category" : "Subcategory"}
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="flex gap-1.5 p-1 bg-muted/30 rounded-xl" role="group">
            <button onClick={() => setView("categories")} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", view === "categories" ? "bg-white dark:bg-zinc-800 shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>Categories</button>
            <button onClick={() => setView("subcategories")} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", view === "subcategories" ? "bg-white dark:bg-zinc-800 shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>Subcategories</button>
          </div>
          <div className="flex-1 max-w-sm">
            <Input placeholder={`Search ${view}…`} value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" aria-label={view}>
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Name</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Slug</th>
                  {view === "subcategories" && <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Parent Category</th>}
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-12 text-center text-sm text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" /> Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">No {view} found</td></tr>
                ) : filtered.map((item: any, i: number) => (
                  <motion.tr key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="hover:bg-accent/30 transition-colors">
                    <td className="px-5 py-4 font-medium text-foreground">{item.name}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground font-mono">{item.slug}</td>
                    {view === "subcategories" && (
                      <td className="px-5 py-4">
                        <Badge variant="info" className="flex items-center gap-1 w-fit">
                          {item.category?.name ?? "—"} <ArrowRight className="h-3 w-3" />
                        </Badge>
                      </td>
                    )}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openModal("edit", item)} aria-label="Edit" title="Edit"
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(item.id, item.name)} aria-label="Delete" title="Delete"
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={closeModal} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-card/60 glass-card rounded-2xl shadow-xl overflow-hidden border border-border">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-1">{modalMode === "create" ? "Add" : "Edit"} {view === "categories" ? "Category" : "Subcategory"}</h2>
                <p className="text-sm text-muted-foreground mb-6">Enter the details for this {view === "categories" ? "category" : "subcategory"}.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {view === "subcategories" && (
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-foreground">Parent Category</label>
                      <select value={formData.categoryId} onChange={e => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                        className="w-full rounded-xl border border-input bg-background/50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all font-medium appearance-none" required>
                        <option value="" disabled>Select a category</option>
                        {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  )}
                  <Input label="Name" value={formData.name} onChange={handleNameChange} placeholder="e.g. Antibiotics" required autoFocus />
                  <Input label="Slug (URL Friendly)" value={formData.slug} onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))} placeholder="e.g. antibiotics" required />
                  <div className="pt-4 flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button>
                    <Button type="submit" loading={createCat.isPending || updateCat.isPending || createSubCat.isPending || updateSubCat.isPending}>
                      {modalMode === "create" ? "Create" : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
