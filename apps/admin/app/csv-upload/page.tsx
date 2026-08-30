"use client";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Pencil, Trash2, Upload, FileSpreadsheet, Download, Info, CheckCircle2, XCircle, AlertCircle, FileDown } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Badge, Input, Modal, Textarea, Pagination } from "@/components/ui";
import toast from "react-hot-toast";
import { useSuggestions, useCreateSuggestion, useUpdateSuggestion, useDeleteSuggestion } from "@/hooks/useAdmin";
import { apiClient } from "@/lib/apiClient";
import SeoFieldsPanel, { type SeoFieldsValue } from "@/components/seo/SeoFieldsPanel";

const EMPTY_SEO: SeoFieldsValue = { metaTitle: "", metaDescription: "", metaKeywords: [], canonicalUrl: "", ogImage: "" };

export default function MasterCatalogPage() {
  const [view, setView] = useState<"CATALOG" | "BULK">("CATALOG");

  // Catalog State
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 25;
  const { data: suggestionsData, isLoading } = useSuggestions({ page, limit, search: search || undefined });
  const createSuggestion = useCreateSuggestion();
  const updateSuggestion = useUpdateSuggestion();
  const deleteSuggestion = useDeleteSuggestion();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", manufacturer: "", composition: "", mrp: "", gstPercent: "", category: "", subCategory: "", description: "" });
  const [seo, setSeo] = useState<SeoFieldsValue>(EMPTY_SEO);

  const suggestions: any[] = Array.isArray(suggestionsData) ? suggestionsData : (suggestionsData?.data ?? []);
  const total = suggestionsData?.total ?? suggestions.length;

  // Bulk Upload State
  const [activeTab, setActiveTab] = useState<"NEW" | "UPDATE" | "DELETE">("NEW");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [results, setResults] = useState<{ successCount: number; failCount: number; errors: string[] } | null>(null);

  // --- Catalog Functions ---
  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", manufacturer: "", composition: "", mrp: "", gstPercent: "", category: "", subCategory: "", description: "" });
    setSeo(EMPTY_SEO);
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
      subCategory: item.subCategoryId || item.subCategory?.id || item.subCategory?.name || item.subCategory || "",
      description: item.description ?? ""
    });
    setSeo({
      metaTitle: item.metaTitle ?? "",
      metaDescription: item.metaDescription ?? "",
      metaKeywords: [],
      canonicalUrl: "",
      ogImage: item.ogImage ?? "",
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
        categoryId: form.category,
        subCategoryId: form.subCategory,
        description: form.description
      };
      
      if (editing) {
        // SEO overrides ride only the UPDATE path (the create DTO has no such
        // fields). Empty string is meaningful: it CLEARS an override back to
        // the storefront's generated head.
        await updateSuggestion.mutateAsync({
          id: editing.id,
          payload: {
            ...payload,
            metaTitle: seo.metaTitle,
            metaDescription: seo.metaDescription,
            ogImage: seo.ogImage,
          },
        });
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

  // --- Bulk Upload Functions ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResults(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a CSV file first");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setResults(null);
    
    const formData = new FormData();
    formData.append("file", file);

    const endpointMap: Record<"NEW" | "UPDATE" | "DELETE", string> = {
      NEW: "/master-products/bulk/new",
      UPDATE: "/master-products/bulk/update",
      DELETE: "/master-products/bulk/delete",
    };

    try {
      const response = await apiClient.post(endpointMap[activeTab], formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 0, // No timeout for large CSV uploads
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
          }
        },
      });
      
      const data = response.data?.data;
      if (data) {
        setResults({
          successCount: data.successCount,
          failCount: data.failCount,
          errors: data.errors || [],
        });
        toast.success(`Processed ${data.successCount + data.failCount} rows`);
      }
    } catch (error: any) {
      console.error(error);
      toast.error("An error occurred during upload.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setFile(null);
      const fileInput = document.getElementById("csv-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    }
  };

  const handleActivateAll = async () => {
    setIsActivating(true);
    try {
      const response = await apiClient.patch("/master-products/bulk/activate-all");
      toast.success(`Activated ${response.data?.data?.count ?? 0} master products`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to activate products");
    } finally {
      setIsActivating(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await apiClient.get("/master-products/bulk/export", {
        responseType: "blob",
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "master-products-export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Export downloaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export CSV");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading && view === "CATALOG") {
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
            <h1 className="font-semibold text-2xl text-foreground">Uploaded Products Catalog</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage uploaded standard products and CSV imports</p>
          </div>
          <div className="flex items-center gap-2">
            {view === "CATALOG" ? (
              <>
                <Button variant="outline" onClick={() => setView("BULK")} leftIcon={<Upload className="h-4 w-4" />}>Bulk Upload CSV</Button>
                <Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>Add Product</Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setView("CATALOG")}>Back to Catalog</Button>
            )}
          </div>
        </div>

        {view === "CATALOG" ? (
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
                        {["Image & SKU", "Product Details", "Company", "Composition", "Category", "Actions"].map(h => (
                          <th key={h} className="px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {suggestions.length === 0 ? (
                        <tr><td colSpan={6} className="py-20 text-center text-sm text-muted-foreground">No catalog entries found. Create one or Bulk Upload to get started.</td></tr>
                      ) : suggestions.map((s: any, i: number) => (
                        <motion.tr key={s.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="hover:bg-accent/30 transition-colors group">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {s.images?.[0]?.url ? (
                                <img src={s.images[0].url} alt={s.name} className="h-10 w-10 rounded-md object-cover border border-border" />
                              ) : (
                                <div className="h-10 w-10 rounded-md bg-muted/50 flex items-center justify-center border border-border/50">
                                  <span className="text-[10px] text-muted-foreground">No img</span>
                                </div>
                              )}
                              <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{s.sku || "—"}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-col max-w-[200px]">
                              <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate" title={s.name}>{s.name}</span>
                              {s.description && <span className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5" title={s.description}>{s.description}</span>}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-xs text-muted-foreground truncate max-w-[120px] block" title={s.company?.name || s.manufacturer}>
                              {s.company?.name || s.manufacturer || "—"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md max-w-[150px] inline-block truncate" title={s.chemicalCompositionRef?.name || s.composition || s.chemicalComposition}>
                              {s.chemicalCompositionRef?.name || s.composition || s.chemicalComposition || "—"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-1 items-start">
                              <Badge variant="outline" className="text-[10px] w-fit">{s.category?.name || s.category || "General"}</Badge>
                              {s.subCategory && <span className="text-[10px] text-muted-foreground px-1 truncate max-w-[120px]">{s.subCategory?.name || s.subCategory}</span>}
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
                  <h3 className="font-semibold">Catalog Info</h3>
                </div>
                <ul className="text-sm space-y-2 text-muted-foreground list-disc pl-4">
                  <li>Master products are used to auto-complete and standardise products uploaded by Sellers.</li>
                  <li>Use the Bulk Upload CSV feature to add or update thousands of products at once.</li>
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
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm max-w-4xl">
            <div className="flex border-b border-border overflow-x-auto justify-between pr-4 items-center">
              <div className="flex">
                {(["NEW", "UPDATE", "DELETE"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setResults(null);
                      setFile(null);
                    }}
                    className={`py-4 px-6 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                      activeTab === tab
                        ? "border-primary text-primary bg-primary/5"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    {tab === "NEW" && "Upload New"}
                    {tab === "UPDATE" && "Update Existing"}
                    {tab === "DELETE" && "Delete Existing"}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleActivateAll}
                  disabled={isActivating}
                  className="flex items-center gap-2 text-sm text-green-700 px-3 py-1.5 rounded-lg font-medium hover:bg-green-50 border border-green-200 transition-colors disabled:opacity-50"
                >
                  {isActivating ? (
                    <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  ) : (
                    <span>✓</span>
                  )}
                  Activate All Products
                </button>
                {(activeTab === "UPDATE" || activeTab === "DELETE") && (
                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex items-center gap-2 text-sm text-secondary-foreground px-3 py-1.5 rounded-lg font-medium hover:bg-accent transition-colors disabled:opacity-50"
                  >
                    {isExporting ? (
                      <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    ) : (
                      <FileDown className="h-4 w-4" />
                    )}
                    Export Existing CSV
                  </button>
                )}
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-accent/50 p-4 rounded-xl flex items-start gap-3 border border-border">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-foreground">
                  <p className="font-semibold mb-1">CSV Format Requirements:</p>
                  <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                    <li>Must contain headers: <code className="bg-background px-1 py-0.5 rounded">SKU</code>, <code className="bg-background px-1 py-0.5 rounded">Product name</code>, <code className="bg-background px-1 py-0.5 rounded">Company</code>, <code className="bg-background px-1 py-0.5 rounded">Main Category</code>, <code className="bg-background px-1 py-0.5 rounded">Sub Category</code>, <code className="bg-background px-1 py-0.5 rounded">Chemical Composition</code>, <code className="bg-background px-1 py-0.5 rounded">Description</code>, <code className="bg-background px-1 py-0.5 rounded">Image</code></li>
                    {activeTab === "UPDATE" && <li>The <code className="bg-background px-1 py-0.5 rounded">SKU</code> column is strictly used to find the existing product to update.</li>}
                    {activeTab === "DELETE" && <li>Must contain an <code className="bg-background px-1 py-0.5 rounded">Action</code> column set to "delete" for rows you want to remove.</li>}
                  </ul>
                </div>
              </div>

              <div className="border-2 border-dashed border-border rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:bg-accent/30 transition-colors">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Select a CSV file</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-sm">
                  Upload your properly formatted CSV file to process the {activeTab.toLowerCase()} operation.
                </p>
                
                <input
                  type="file"
                  id="csv-upload"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="csv-upload"
                  className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-medium cursor-pointer hover:bg-primary/90 transition-all shadow-sm flex items-center gap-2"
                >
                  Browse Files
                </label>
                
                {file && (
                  <div className="mt-4 flex items-center gap-2 text-sm font-medium bg-background px-4 py-2 rounded-lg border border-border">
                    <FileSpreadsheet className="h-4 w-4 text-green-500" />
                    {file.name}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end pt-2">
                <button
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed min-w-[180px]"
                >
                  {isUploading ? (
                    <>
                      <div className="h-5 w-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      {uploadProgress < 100 ? `Uploading ${uploadProgress}%` : `Processing...`}
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      Start Upload
                    </>
                  )}
                </button>
                {isUploading && (
                  <div className="w-full max-w-[180px] bg-muted rounded-full h-1.5 mt-3 overflow-hidden">
                    <div 
                      className="bg-primary h-1.5 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>

              {results && (
                <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500 border-t border-border pt-6 mt-6">
                  <h2 className="text-xl font-bold">Results Summary</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 p-4 rounded-xl flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-green-800 dark:text-green-300">Successfully Processed</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{results.successCount}</p>
                      </div>
                    </div>
                    
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-4 rounded-xl flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-red-800 dark:text-red-300">Failed to Process</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">{results.failCount}</p>
                      </div>
                    </div>
                  </div>

                  {results.errors.length > 0 && (
                    <div className="bg-card border border-border rounded-xl overflow-hidden mt-4">
                      <div className="bg-red-50 dark:bg-red-900/10 px-4 py-2 border-b border-border">
                        <h3 className="text-sm font-semibold text-red-800 dark:text-red-400 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Error Details
                        </h3>
                      </div>
                      <div className="p-4 max-h-48 overflow-y-auto">
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          {results.errors.map((err, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-red-500 font-bold">•</span>
                              {err}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
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
            <div className="col-span-2">
              <Textarea label="Description" placeholder="Detailed product description..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} />
            </div>
            {editing && (
              <div className="col-span-2">
                {/*
                  Optional head overrides. Blank = the storefront's generated
                  title/description (the placeholders + preview show exactly
                  what ships if these stay empty). Keywords/canonical are
                  hidden: product canonicals are ALWAYS the stored slug.
                */}
                <SeoFieldsPanel
                  value={seo}
                  onChange={setSeo}
                  fallbackTitle={`${form.name || "Product"} Wholesale Price — ${form.manufacturer || "Supplier"}`}
                  fallbackDescription={form.description?.trim() || `Buy ${form.name || "this product"} online at wholesale rates on PharmaBag.`}
                  previewUrl={`pharmabag.in/products/${editing?.slug || "product-slug"}`}
                  showKeywords={false}
                  showCanonical={false}
                />
              </div>
            )}
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
