"use client";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Download, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui";
import Link from "next/link";
import toast from "react-hot-toast";
import { useDownloadTemplate, useUploadBulkCsv } from "@/hooks/useSellerBulkUpload";
import type { BulkUploadResult } from "@/api/seller.api";

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<BulkUploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = useDownloadTemplate();
  const uploadCsv = useUploadBulkCsv();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }
    setFile(selected);
    setResults(null);
  };

  const handleUpload = async () => {
    if (!file) { toast.error('Please select a CSV file first'); return; }
    const result = await uploadCsv.mutateAsync(file);
    setResults(result);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.success(`${result.successCount} products uploaded`);
  };

  const handleReset = () => { setResults(null); setFile(null); };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/products" className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent/60 transition-colors text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-semibold text-2xl text-foreground">Bulk Upload Products</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Upload multiple products at once using a CSV file</p>
        </div>
      </div>

      {!results ? (
        <>
          {/* Step 1 */}
          <div className="glass-card rounded-2xl p-6 space-y-4 border border-border/50">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">1</div>
              <h2 className="font-semibold text-foreground">Download the template</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              The template contains all products from our master catalog. Fill in the <strong>Stock</strong> and <strong>Price</strong> columns for the products you want to list. Do not edit the Product Name column.
            </p>
            <Button
              variant="secondary"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={() => downloadTemplate.mutate()}
              loading={downloadTemplate.isPending}
            >
              Download Template CSV
            </Button>
          </div>

          {/* Step 2 */}
          <div className="glass-card rounded-2xl p-6 space-y-4 border border-border/50">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">2</div>
              <h2 className="font-semibold text-foreground">Upload your filled CSV</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Only rows with a Stock and Price filled in will be uploaded. Rows whose product name doesn&apos;t match the catalog exactly will be skipped and shown in a report.
            </p>

            <div
              className="border-2 border-dashed border-border rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:bg-accent/30 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <FileSpreadsheet className="h-7 w-7 text-primary" />
              </div>
              <p className="font-medium text-foreground mb-1">Click to select a CSV file</p>
              <p className="text-xs text-muted-foreground">Only .csv files accepted</p>
              {file && (
                <div className="mt-4 flex items-center gap-2 text-sm font-medium bg-background px-4 py-2 rounded-lg border border-border">
                  <FileSpreadsheet className="h-4 w-4 text-green-500" />
                  {file.name}
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />

            <div className="flex justify-end">
              <Button
                leftIcon={<Upload className="h-4 w-4" />}
                onClick={handleUpload}
                disabled={!file}
                loading={uploadCsv.isPending}
              >
                {uploadCsv.isPending ? 'Uploading…' : 'Upload CSV'}
              </Button>
            </div>
          </div>
        </>
      ) : (
        /* Results Panel */
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl p-5 border border-green-200 dark:border-green-900/40 bg-green-50/50 dark:bg-green-950/10 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-green-700 dark:text-green-400">Successfully Uploaded</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{results.successCount}</p>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-orange-200 dark:border-orange-900/40 bg-orange-50/50 dark:bg-orange-950/10 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-orange-700 dark:text-orange-400">Rows Skipped</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{results.skippedCount}</p>
              </div>
            </div>
          </div>

          {results.skipped.length > 0 && (
            <div className="glass-card rounded-2xl border border-border/50 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border/50 bg-muted/20">
                <h3 className="text-sm font-semibold text-foreground">Skipped Rows</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Fix these in your CSV and re-upload</p>
              </div>
              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30 bg-muted/10">
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Row</th>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product Name</th>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {results.skipped.map((s) => (
                      <tr key={`${s.row}-${s.name}`} className="hover:bg-accent/20 transition-colors">
                        <td className="px-5 py-3 text-muted-foreground font-mono text-xs">{s.row}</td>
                        <td className="px-5 py-3 font-medium text-foreground max-w-[240px] truncate" title={s.name}>{s.name}</td>
                        <td className="px-5 py-3 text-muted-foreground capitalize text-xs">{s.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="secondary" onClick={handleReset}>Upload Another CSV</Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
