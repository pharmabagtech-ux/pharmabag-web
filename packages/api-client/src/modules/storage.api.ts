import { api } from '../api';

// ─── API Functions ──────────────────────────────────

export async function uploadPaymentProofFile(file: File): Promise<{ key: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/storage/payment-proof', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data ?? response.data;
}

export async function uploadKycDocument(file: File): Promise<{ key: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/storage/kyc', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data ?? response.data;
}

export async function uploadDrugLicense(file: File): Promise<{ key: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/storage/drug-license', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data ?? response.data;
}

export async function getPresignedUrl(key: string): Promise<string> {
  const response = await api.post('/storage/view', { key });
  return (response.data.data ?? response.data).url;
}
