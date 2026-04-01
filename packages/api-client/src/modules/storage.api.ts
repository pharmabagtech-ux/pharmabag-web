import { api } from '../api';

// ─── API Functions ──────────────────────────────────

export async function uploadPaymentProofFile(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/storage/payment-proof', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function uploadKycDocument(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/storage/kyc', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function uploadDrugLicense(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/storage/drug-license', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
