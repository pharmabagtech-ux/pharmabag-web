'use client';

import { useMutation } from '@tanstack/react-query';
import { uploadPaymentProofFile, uploadKycDocument, uploadDrugLicense } from '@pharmabag/api-client';

export function useUploadPaymentProofFile() {
  return useMutation({
    mutationFn: (file: File) => uploadPaymentProofFile(file),
  });
}

export function useUploadKycDocument() {
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return uploadKycDocument(formData);
    },
  });
}

export function useUploadDrugLicense() {
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return uploadDrugLicense(formData);
    },
  });
}
