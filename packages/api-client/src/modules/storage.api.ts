import { api } from '../api';

// ─── API Functions ──────────────────────────────────

export async function uploadPaymentProofFile(file: File): Promise<{ key: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/storage/payment-proof', formData);

  return response.data.data ?? response.data;
}

export async function uploadKycDocument(formData: FormData): Promise<{ key: string }> {
  const response = await api.post('/storage/kyc', formData);
  return response.data.data ?? response.data;
}

export async function uploadDrugLicense(formData: FormData): Promise<{ key: string }> {
  const response = await api.post('/storage/drug-license', formData);
  return response.data.data ?? response.data;
}

export async function getPresignedUrl(key: string): Promise<string> {
  const response = await api.post('/storage/view', { key });
  return (response.data.data ?? response.data).url;
}
