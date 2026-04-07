'use client';

import { motion } from 'framer-motion';
import { CreditCard, UploadCloud, ChevronLeft, Info, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';

import { useToast } from '@/components/shared/Toast';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePaymentByOrderId, useUploadPaymentProofByOrder } from '@/hooks/usePayments';
import { useUploadPaymentProofFile } from '@/hooks/useStorage';
import { useOrderById } from '@/hooks/useOrders';
import AuthGuard from '@/components/shared/AuthGuard';

export default function PaymentIdPage({ params }: { params: { orderId: string } }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const { data: payment, isLoading: isPaymentLoading, isError: isPaymentError } = usePaymentByOrderId(params.orderId);
  const { data: order, isLoading: isOrderLoading, isError: isOrderError } = useOrderById(params.orderId);
  const uploadFileMutation = useUploadPaymentProofFile();
  const uploadProofByOrderMutation = useUploadPaymentProofByOrder();
  const { toast } = useToast();

  const isError = isPaymentError && isOrderError;
  const isLoading = isPaymentLoading || isOrderLoading;
  const isUploading = uploadFileMutation.isPending || uploadProofByOrderMutation.isPending;

  const handleUpload = async () => {
    if (!file || !order) return;
    setUploadError('');
    try {
      const { key } = await uploadFileMutation.mutateAsync(file);
      await uploadProofByOrderMutation.mutateAsync({ orderId: params.orderId, proofUrl: key });
      setIsSuccess(true);
      toast('Payment proof submitted successfully!', 'success');
      
      // Auto redirect after 2 seconds
      setTimeout(() => {
        router.push(`/orders/${params.orderId}`);
      }, 2000);
    } catch (err: any) {
      console.error('[Payment] Upload flow failed:', err);
      setUploadError(err.message || 'Failed to upload payment proof. Please try again.');
      toast('Upload failed. Please try again.', 'error');
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50/50">
        <Navbar showUserActions={true} />
        <div className="pt-32 pb-20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
        </div>
      </main>
    );
  }

  const amount = payment?.amount || order?.totalAmount || 0;
  const status = payment?.status?.toUpperCase() ?? 'PENDING';
  const hasProof = !!payment?.proofUrl;

  return (
    <AuthGuard>
    <main className="min-h-screen bg-gray-50/50">
      <Navbar showUserActions={true} />
      
      <div className="pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-12 sm:pb-20 w-full mx-auto px-[4vw]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 sm:space-y-8"
        >
          <div className="flex items-center justify-between">
            <Link href="/payments" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-bold">
              <ChevronLeft className="w-5 h-5" />
              Back to Payments
            </Link>
          </div>

          <div className="bg-white/40 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[40px] border border-white/40 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8">
               <div className="w-24 h-24 bg-lime-100/30 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8 md:mb-10">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gray-900 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-xl">
                  <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Order Payment</h1>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Order #{params.orderId.slice(-8)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8 md:mb-12">
                <div className="bg-white/40 p-6 rounded-3xl border border-white h-fit">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Payment Summary</p>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Bill Amount</p>
                      <p className="text-3xl font-black text-gray-900 tracking-tight">₹{amount.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${['CONFIRMED', 'COMPLETED', 'VERIFIED'].includes(status) ? 'bg-green-100 text-green-700' : status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/40 p-6 md:p-8 rounded-[32px] sm:rounded-[40px] border border-white shadow-sm relative overflow-hidden group">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-100 pb-4">Bank Details for Payment</p>
                  
                  <div className="grid grid-cols-1 gap-y-5">
                    <div className="flex items-center justify-between group/item">
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Account Name</span>
                       <span className="text-xs font-black text-gray-900 text-right">The Era Of Marketing</span>
                    </div>
                    <div className="flex items-center justify-between group/item">
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Account Number</span>
                       <span className="text-xs font-black text-gray-900 tracking-wider font-mono">10126079826</span>
                    </div>
                    <div className="flex items-center justify-between group/item">
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bank Name</span>
                       <span className="text-xs font-black text-gray-900 text-right">IDFC FIRST Bank LTD</span>
                    </div>
                    <div className="flex items-center justify-between group/item">
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">IFSC Code</span>
                       <span className="text-xs font-black text-gray-900 tracking-wider font-mono">IDFB0060102</span>
                    </div>
                    <div className="flex items-center justify-between group/item">
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Swift / BIC</span>
                       <span className="text-xs font-black text-gray-900 tracking-wider font-mono uppercase">IDFBINBBMUM</span>
                    </div>
                    <div className="pt-4 border-t border-gray-100 mt-2">
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Bank Address</span>
                       <p className="text-[10px] font-bold text-gray-500 leading-relaxed italic">
                        Salt Lake, Sector 1, Kolkata, West Bengal, India, Pincode: 700064.
                       </p>
                    </div>
                  </div>
                </div>
              </div>

              {isError && !payment ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <AlertCircle className="w-12 h-12 text-gray-300" />
                  <p className="text-lg font-bold text-gray-400">No payment found for this order</p>
                  <p className="text-sm text-gray-400">Create a payment first from your order details.</p>
                </div>
              ) : !isSuccess && !hasProof ? (
                <div className="space-y-6">
                  <div 
                    className={`border-2 border-dashed rounded-2xl sm:rounded-3xl md:rounded-[40px] p-6 sm:p-8 md:p-12 text-center transition-all ${
                      file ? 'border-lime-400 bg-lime-50/20' : 'border-gray-200 bg-gray-50/30 hover:bg-gray-50/50'
                    }`}
                  >
                    {!file ? (
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                          <UploadCloud className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Upload Payment Proof</h3>
                        <p className="text-sm font-medium text-gray-400 mb-6 px-12">
                          Select a screenshot or photo of your bank transfer or UPI payment receipt.
                        </p>
                        <input 
                          type="file" 
                          id="proof-upload" 
                          className="hidden"
                          accept="image/*,.pdf"
                          onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                        <label 
                          htmlFor="proof-upload"
                          className="px-8 py-3 bg-gray-900 text-white rounded-full font-bold cursor-pointer hover:bg-black transition-colors"
                        >
                          Select File
                        </label>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        {file.type.startsWith('image/') ? (
                          <div className="w-40 h-40 rounded-2xl overflow-hidden mb-4 border border-gray-200 shadow-lg">
                            <img
                              src={URL.createObjectURL(file)}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <CheckCircle2 className="w-12 h-12 text-lime-500 mb-4" />
                        )}
                        <p className="text-lg font-bold text-gray-900 mb-1">{file.name}</p>
                        <p className="text-sm font-medium text-gray-400 mb-6">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        {uploadError && (
                          <p className="text-sm font-medium text-red-500 mb-4">{uploadError}</p>
                        )}
                        <div className="flex gap-4">
                          <motion.button 
                            whileTap={{ scale: 0.95 }}
                            onClick={handleUpload}
                            disabled={isUploading}
                            className="px-10 py-3 bg-lime-300 hover:bg-lime-400 text-gray-900 rounded-full font-bold shadow-lg shadow-lime-200 transition-all disabled:opacity-50"
                          >
                            {isUploading ? 'Uploading...' : 'Submit Payment'}
                          </motion.button>
                          <motion.button 
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { setFile(null); setUploadError(''); }}
                            className="px-6 py-3 bg-white border border-gray-100 rounded-full font-bold text-gray-600 hover:bg-gray-50"
                          >
                            Cancel
                          </motion.button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 p-6 bg-blue-50/50 rounded-3xl border border-blue-50">
                    <Info className="w-5 h-5 text-blue-500" />
                    <p className="text-xs font-bold text-blue-700/70 tracking-tight leading-relaxed">
                      Please ensure the transaction ID and amount are clearly visible in the uploaded image. Confirmation usually takes 2-4 business hours.
                    </p>
                  </div>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-lime-50/50 rounded-[40px] p-12 text-center border border-lime-100"
                >
                  <div className="w-20 h-20 bg-lime-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-lime-200">
                    <CheckCircle2 className="w-10 h-10 text-gray-900" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {hasProof && !isSuccess ? 'Proof Already Submitted' : 'Payment Submitted!'}
                  </h2>
                  <p className="text-gray-500 font-medium mb-8">
                    Your payment proof has been sent for verification. <br />
                    We&apos;ll notify you once it&apos;s confirmed.
                  </p>
                  <Link 
                    href={`/orders/${params.orderId}`}
                    className="px-12 py-4 bg-gray-900 text-white rounded-full font-bold shadow-xl shadow-black/20 hover:bg-black transition-colors inline-block"
                  >
                    View Order Details
                  </Link>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

    </main>
    </AuthGuard>
  );
}
