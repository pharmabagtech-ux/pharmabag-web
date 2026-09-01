"use client";
import { ArrowLeft, RefreshCw, Upload, FileSpreadsheet, Clock } from "lucide-react";
import { Button } from "@/components/ui";
import Link from "next/link";

export default function ErpSyncPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/products" className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent/60 transition-colors text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-semibold text-2xl text-foreground">Sync from ERP</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Keep your PharmaBag stock and prices in sync with your billing software</p>
        </div>
      </div>

      {/* Coming soon card */}
      <div className="glass-card rounded-2xl p-6 space-y-4 border border-border/50">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <RefreshCw className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-foreground">Automatic inventory sync</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[11px] font-semibold">
                <Clock className="h-3 w-3" /> Coming soon
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Connect Marg or any other ERP and your stock, rates and new items will update on PharmaBag automatically — no re-typing, no double entry.
            </p>
          </div>
        </div>
      </div>

      {/* Interim path card */}
      <div className="glass-card rounded-2xl p-6 space-y-4 border border-border/50">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">Until then: upload your stock in bulk</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Export your stock and rate list from Marg (or your ERP) to Excel/CSV, fill it into our template, and upload all your products in one go.
        </p>
        <Link href="/products/bulk-upload">
          <Button variant="secondary" leftIcon={<Upload className="h-4 w-4" />}>Go to Bulk Upload</Button>
        </Link>
      </div>
    </div>
  );
}
