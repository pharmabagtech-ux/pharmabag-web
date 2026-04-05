"use client";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Pencil, Trash2, Upload, FileSpreadsheet, Download, Info } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Badge, Input, Modal, Textarea, Pagination } from "@/components/ui";
import toast from "react-hot-toast";
import { useSuggestions, useCreateSuggestion, useUpdateSuggestion, useDeleteSuggestion, useImportSuggestionsCsv } from "@/hooks/useAdmin";

export default function MasterCatalogPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 25;
  const { data: suggestionsData, isLoading } = useSuggestions({ page, limit, search: search || undefined });
  const createSuggestion = useCreateSuggestion();
  const updateSuggestion = useUpdateSuggestion();
  const deleteSuggestion = useDeleteSuggestion();
  const importCsv = useImportSuggestionsCsv();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", manufacturer: "", composition: "", mrp: "", gstPercent: "", category: "", subCategory: "" });

  const suggestions: any[] = Array.isArray(suggestionsData) ? suggestionsData : (suggestionsData?.data ?? []);
  const total = suggestionsData?.total ?? suggestions.length;

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", manufacturer: "", composition: "", mrp: "", gstPercent: "", category: "", subCategory: "" });
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({ 
      name: item.name ?? "", 
      manufacturer: item.manufacturer ?? "", 
      composition: item.chemicalComposition ?? item.composition ?? "", 
      mrp: String(item.mrp ?? ""), 
      gstPercent: String(item.gstPercent ?? ""),
      category: item.categoryId || item.category?.id || item.category?.name || item.category || "",
      subCategory: item.subCategoryId || item.subCategory?.id || item.subCategory?.name || item.subCategory || "" 
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const payload = { 
        name: form.name,
        manufacturer: form.manufacturer,
        chemicalComposition: form.composition,
        mrp: form.mrp ? Number(form.mrp) : undefined,
        gstPercent: form.gstPercent ? Number(form.gstPercent) : undefined,
        categoryId: form.category, // Assuming ID is passed from selection in a real scenario
        subCategoryId: form.subCategory
      };
      
      if (editing) {
        await updateSuggestion.mutateAsync({ id: editing.id, payload });
        toast.success("Catalog entry updated");
      } else {
        await createSuggestion.mutateAsync(payload);
        toast.success("Catalog entry created");
      }
      setShowModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (editing ? "Failed to update" : "Failed to create"));
    }
  };

  const handleDelete = async (item: any) => {
    if (!window.confirm(`Delete "${item.name}" from catalog?`)) return;
    try {
      await deleteSuggestion.mutateAsync(item.id);
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importCsv.mutateAsync(file);
      toast.success("Master catalog imported successfully");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to import CSV");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleExport = async () => {
    try {
      toast.loading("Preparing CSV...", { id: "export-csv" });
      // Fetch all suggestions (using a large limit to get the full catalog)
      const res = await (require("@/api/admin.api").getSuggestions({ limit: 5000 }));
      const allSuggestions = Array.isArray(res) ? res : (res?.data ?? []);
      
      if (allSuggestions.length === 0) {
        toast.error("No catalog data to export", { id: "export-csv" });
        return;
      }

      const headers = "name,manufacturer,chemicalComposition,mrp,gstPercent,category,subCategory\n";
      const rows = allSuggestions.map((s: any) => {
        const cat = s.category?.name || s.category || "";
        const sub = s.subCategory?.name || s.subCategory || "";
        const comp = s.composition || s.chemicalComposition || "";
        return `"${s.name}","${s.manufacturer}","${comp}",${s.mrp || 0},${s.gstPercent || 0},"${cat}","${sub}"`;
      }).join("\n");

      const blob = new Blob([headers + rows], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `master_catalog_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      toast.success(`Exported ${allSuggestions.length} products`, { id: "export-csv" });
    } catch (err) {
      toast.error("Failed to export catalog", { id: "export-csv" });
    }
  };

  const downloadSample = () => {
    const headers = "name,manufacturer,chemicalComposition,mrp,gstPercent,category,subCategory\n";
    const sample = 'Paracetamol 500mg,Cipla,Paracetamol,15.00,12,Tablets,Pain Relief\n';
    const blob = new Blob([headers + sample], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'master_catalog_sample.csv';
    a.click();
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading master catalog…</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-semibold text-2xl text-foreground">Master Product Catalog</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage standardized products for seller lookup</p>
          </div>
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept=".csv" onChange={handleImport} className="hidden" />
            <Button variant="outline" onClick={downloadSample} leftIcon={<Download className="h-4 w-4" />}>Sample CSV</Button>
            <Button variant="outline" onClick={handleExport} leftIcon={<FileSpreadsheet className="h-4 w-4" />}>Export Full CSV</Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()} loading={importCsv.isPending} leftIcon={<Upload className="h-4 w-4" />}>Import CSV</Button>
            <Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>Add Product</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="max-w-md">
              <Input placeholder="Search catalog…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} leftIcon={<Search className="h-4 w-4" />} />
            </div>

            <div className="glass-card rounded-2xl overflow-hidden border border-border/50">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/20">
                      {["Product Details", "Composition", "MRP", "Category", "Actions"].map(h => (
                        <th key={h} className="px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {suggestions.length === 0 ? (
                      <tr><td colSpan={5} className="py-20 text-center text-sm text-muted-foreground">No catalog entries found. Import a CSV to get started.</td></tr>
                    ) : suggestions.map((s: any, i: number) => (
                      <motion.tr key={s.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="hover:bg-accent/30 transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{s.name}</span>
                            <span className="text-xs text-muted-foreground">{s.manufacturer}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md max-w-[150px] inline-block truncate" title={s.composition || s.chemicalComposition}>
                            {s.composition || s.chemicalComposition || "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-foreground">{s.mrp ? `₹${s.mrp}` : "—"}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline" className="text-[10px] w-fit">{s.category?.name || s.category || "General"}</Badge>
                            {s.subCategory && <span className="text-[10px] text-muted-foreground px-1">{s.subCategory?.name || s.subCategory}</span>}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(s)} className="h-8 w-8 hover:bg-primary/10 hover:text-primary"><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(s)} className="h-8 w-8 hover:bg-red-500/10 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {total > limit && (
                <div className="p-4 border-t border-border/50 bg-muted/5">
                  <Pagination page={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-6 rounded-2xl border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2 text-primary mb-3">
                <Info className="h-5 w-5" />
                <h3 className="font-semibold">Import Instructions</h3>
              </div>
              <ul className="text-sm space-y-2 text-muted-foreground list-disc pl-4">
                <li>Download the sample CSV for correct formatting.</li>
                <li><strong>MRP</strong> and <strong>GST Percent</strong> should be numbers.</li>
                <li>Categories and subcategories must exist or will be matched by name.</li>
                <li>Duplicate products (by name + manufacturer) will be updated.</li>
                <li>Large files (up to 5000 rows) are supported.</li>
              </ul>
            </div>
            
            <div className="glass-card p-6 rounded-2xl border border-border/50">
              <h3 className="font-semibold mb-4 text-foreground">Catalog Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-xl">
                  <p className="text-xs text-muted-foreground uppercase font-medium">Total Items</p>
                  <p className="text-2xl font-bold text-foreground">{total}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl">
                  <p className="text-xs text-muted-foreground uppercase font-medium">Categories</p>
                  <p className="text-2xl font-bold text-foreground">—</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit Catalog Product" : "Add Catalog Product"}>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input label="Product Name" placeholder="e.g. Paracetamol 500mg" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <Input label="Manufacturer" placeholder="e.g. Cipla" value={form.manufacturer} onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))} />
            <Input label="MRP (₹)" type="number" placeholder="0.00" value={form.mrp} onChange={e => setForm(f => ({ ...f, mrp: e.target.value }))} />
            <Input label="GST (%)" type="number" placeholder="12" value={form.gstPercent} onChange={e => setForm(f => ({ ...f, gstPercent: e.target.value }))} />

            <div className="col-span-2">
              <Textarea label="Chemical Composition" placeholder="e.g. Paracetamol" value={form.composition} onChange={e => setForm(f => ({ ...f, composition: e.target.value }))} />
            </div>
            <Input label="Category" placeholder="e.g. Tablets" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
            <Input label="Sub-Category" placeholder="e.g. Pain Relief" value={form.subCategory} onChange={e => setForm(f => ({ ...f, subCategory: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-6">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={createSuggestion.isPending || updateSuggestion.isPending}>
              {editing ? "Update Product" : "Save to Catalog"}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
