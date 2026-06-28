"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { downloadBulkTemplate, uploadBulkCsv, type BulkUploadResult } from "@/api/seller.api";

export function useDownloadTemplate() {
  return useMutation({
    mutationFn: downloadBulkTemplate,
    onError: () => toast.error("Failed to download template"),
  });
}

export function useUploadBulkCsv() {
  const qc = useQueryClient();
  return useMutation<BulkUploadResult, Error, File>({
    mutationFn: uploadBulkCsv,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["seller", "products"] });
    },
    onError: () => toast.error("Upload failed. Please try again."),
  });
}
