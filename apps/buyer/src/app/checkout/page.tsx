'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  CreditCard, 
  ShoppingBag, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Truck,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { useCart } from '@/hooks/useCart';
import { useCreateOrder } from '@/hooks/useOrders';
import { useCreatePayment } from '@/hooks/usePayments';
import { useBuyerProfile, useBuyerCreditDetails } from '@/hooks/useBuyerProfile';
import { useToast } from '@/components/shared/Toast';
import { usePlatformConfig } from '@/hooks/usePlatformConfig';
import Image from 'next/image';
import Link from 'next/link';
import AuthGuard from '@/components/shared/AuthGuard';
import { useAuth } from '@pharmabag/api-client';

type PaymentMethod = 'COD' | 'UPI' | 'BANK_TRANSFER' | 'CREDIT';

export default function CheckoutPage() {
  const { user } = useAuth();
  const isVerified = user?.gstPanResponse?.status && 
                     user?.verificationStatus === 'VERIFIED' && 
                     !!user?.creditTier;
  const isPending = user?.verificationStatus === 'PENDING';
  const isRejected = user?.verificationStatus === 'REJECTED';

  const { data: cartData, isLoading: isCartLoading } = useCart();
  const { data: profileData } = useBuyerProfile();
  const { data: creditData } = useBuyerCreditDetails();
  const { toast } = useToast();
  const createOrder = useCreateOrder();
  const createPaymentMut = useCreatePayment();
  const { data: platformConfig } = usePlatformConfig();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');

  const credit = (creditData as any)?.data || creditData;
  const isCreditEligible = credit?.status === 'active' && (credit?.availableCredit ?? 0) > 0;
  
  const [address, setAddress] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  useEffect(() => {
    const profile = (profileData as any)?.data || profileData;
    if (profile) {
      setAddress({
        name: profile.name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        pincode: profile.pincode || '',
      });
    }
  }, [profileData]);

  const cart = (cartData as any)?.data || cartData || { items: [], total: 0 };
  const items = cart.items ?? [];
  const subtotal = cart.total ?? 0;
  const shippingThreshold = platformConfig?.shipping_threshold ?? 5000;
  const shippingFee = platformConfig?.shipping_fee ?? 250;
  const gstRate = (platformConfig?.gst_rate ?? 12) / 100;
  const shipping = subtotal > shippingThreshold ? 0 : shippingFee;
  const gst = subtotal * gstRate;
  const total = subtotal + shipping + gst;

  const handlePlaceOrder = () => {
    if (!address.name || !address.phone || !address.address || !address.city || !address.state || !address.pincode) {
      toast('Please fill in all delivery details', 'error');
      return;
    }

    if (paymentMethod === 'CREDIT') {
      const availableCredit = credit?.availableCredit ?? 0;
      if (total > availableCredit) {
        toast(`Insufficient credit. Available: ₹${availableCredit.toLocaleString()}, Required: ₹${total.toLocaleString()}`, 'error');
        return;
      }
    }

    createOrder.mutate(address, {
      onSuccess: (data: any) => {
        const orderId = data?.data?.id || data?.id;
        // Create payment record for the order
        createPaymentMut.mutate(
          { orderId, amount: total, method: paymentMethod },
          {
            onSuccess: () => {
              window.location.href = `/orders/${orderId}?success=true`;
            },
            onError: () => {
              // Payment record failed but order was created — redirect without success flag
              toast('Order placed but payment recording failed. Please contact support.', 'error');
              window.location.href = `/orders/${orderId}`;
            },
          }
        );
      },
      onError: (error: any) => {
        toast(error?.message || 'Failed to place order', 'error');
      }
    });
  };

  if (isCartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fbfa]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-12 h-12 border-4 border-lime-300 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!isVerified) {
    return (
      <AuthGuard>
      <main className="min-h-screen bg-[#f8fbfa] flex flex-col">
        <Navbar showUserActions={true} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center mt-20">
          {isPending ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full bg-white/40 backdrop-blur-3xl border border-white/50 rounded-3xl p-8 shadow-2xl">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-8 h-8 text-yellow-600" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 mb-4">Verification Under Review</h1>
              <p className="text-gray-600 font-medium mb-8">
                Your business documents are currently being reviewed by our Admin team. You will be able to place orders once approved.
              </p>
              <Link href="/products" className="inline-flex items-center justify-center w-full h-14 bg-gray-900 text-white rounded-xl font-bold transition-all hover:bg-gray-800">
                Continue Browsing
              </Link>
            </motion.div>
          ) : isRejected ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full bg-white/40 backdrop-blur-3xl border border-red-100 rounded-3xl p-8 shadow-2xl">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 mb-4">Verification Rejected</h1>
              <p className="text-gray-600 font-medium mb-8">
                Unfortunately, we could not verify your business details. Please update your profile or contact support.
              </p>
              <Link href="/support" className="inline-flex items-center justify-center w-full h-14 bg-gray-900 text-white rounded-xl font-bold transition-all hover:bg-gray-800">
                Contact Support
              </Link>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full bg-white/40 backdrop-blur-3xl border border-emerald-100 rounded-3xl p-8 shadow-2xl">
              <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-8 h-8 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 mb-4">Complete Verification</h1>
              <p className="text-gray-600 font-medium mb-8">
                Since it's your first time on our platform, you need to verify your business details to buy items on PharmaBag.
              </p>
              <Link href="/onboarding" className="inline-flex items-center justify-center w-full h-14 bg-emerald-500 text-white rounded-xl font-bold transition-all hover:bg-emerald-600 gap-2">
                Verify Now <ChevronRight className="w-5 h-5" />
              </Link>
            </motion.div>
          )}
        </div>
        <Footer />
      </main>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
    <main className="min-h-screen bg-[#f8fbfa]">
      <Navbar showUserActions={true} />

      <div className="pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-12 sm:pb-20 px-[4vw] w-full mx-auto">
        <Link 
          href="/products" 
          className="inline-flex items-center gap-2 text-gray-400 font-bold hover:text-gray-900 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Shopping</span>
        </Link>

        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-12">
          {/* Left Side - Delivery Details */}
          <div className="flex-1 space-y-6 sm:space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/40 backdrop-blur-3xl border border-white/50 rounded-2xl sm:rounded-3xl md:rounded-[40px] p-4 sm:p-6 md:p-8 lg:p-12 shadow-2xl"
            >
              <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8 md:mb-10">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-lime-100 rounded-xl sm:rounded-2xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" />
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Delivery Address</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Receiver Name</label>
                  <input 
                    type="text"
                    value={address.name}
                    onChange={(e) => setAddress({ ...address, name: e.target.value })}
                    className="w-full h-12 sm:h-14 bg-white/70 rounded-xl sm:rounded-2xl border border-white/50 px-4 sm:px-6 text-sm sm:text-base text-gray-900 font-medium focus:ring-4 focus:ring-lime-300 focus:bg-white outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Phone Number</label>
                  <input 
                    type="text"
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    className="w-full h-12 sm:h-14 bg-white/70 rounded-xl sm:rounded-2xl border border-white/50 px-4 sm:px-6 text-sm sm:text-base text-gray-900 font-medium focus:ring-4 focus:ring-lime-300 focus:bg-white outline-none transition-all"
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Street Address</label>
                  <input 
                    type="text"
                    value={address.address}
                    onChange={(e) => setAddress({ ...address, address: e.target.value })}
                    className="w-full h-12 sm:h-14 bg-white/70 rounded-xl sm:rounded-2xl border border-white/50 px-4 sm:px-6 text-sm sm:text-base text-gray-900 font-medium focus:ring-4 focus:ring-lime-300 focus:bg-white outline-none transition-all"
                    placeholder="123 Pharma Lane"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">City</label>
                  <input 
                    type="text"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full h-12 sm:h-14 bg-white/70 rounded-xl sm:rounded-2xl border border-white/50 px-4 sm:px-6 text-sm sm:text-base text-gray-900 font-medium focus:ring-4 focus:ring-lime-300 focus:bg-white outline-none transition-all"
                    placeholder="Mumbai"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">State</label>
                  <input 
                    type="text"
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="w-full h-12 sm:h-14 bg-white/70 rounded-xl sm:rounded-2xl border border-white/50 px-4 sm:px-6 text-sm sm:text-base text-gray-900 font-medium focus:ring-4 focus:ring-lime-300 focus:bg-white outline-none transition-all"
                    placeholder="Maharashtra"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">ZIP / Postcode</label>
                  <input 
                    type="text"
                    value={address.pincode}
                    onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                    className="w-full h-12 sm:h-14 bg-white/70 rounded-xl sm:rounded-2xl border border-white/50 px-4 sm:px-6 text-sm sm:text-base text-gray-900 font-medium focus:ring-4 focus:ring-lime-300 focus:bg-white outline-none transition-all"
                    placeholder="400001"
                  />
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/40 backdrop-blur-3xl border border-white/50 rounded-2xl sm:rounded-3xl md:rounded-[40px] p-4 sm:p-6 md:p-8 lg:p-12 shadow-2xl"
            >
              <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8 md:mb-10">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-sky-100 rounded-xl sm:rounded-2xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" />
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Payment Method</h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Cash on Delivery */}
                <button
                  onClick={() => setPaymentMethod('COD')}
                  className={`flex items-center justify-between p-6 rounded-3xl border-2 text-left transition-all ${
                    paymentMethod === 'COD'
                      ? 'bg-white border-lime-300 shadow-xl shadow-lime-900/5'
                      : 'bg-white/50 border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === 'COD' ? 'bg-lime-50' : 'bg-gray-50'}`}>
                      <ShieldCheck className={`w-5 h-5 ${paymentMethod === 'COD' ? 'text-lime-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <p className={`font-bold leading-tight ${paymentMethod === 'COD' ? 'text-gray-900' : 'text-gray-600'}`}>Cash on Delivery</p>
                      <p className="text-xs font-medium text-gray-400 mt-0.5">Pay when you receive</p>
                    </div>
                  </div>
                  {paymentMethod === 'COD' && <CheckCircle2 className="w-6 h-6 text-lime-500" />}
                </button>

                {/* Online Payment — disabled until payment gateway integration */}
                <button
                  disabled
                  className="flex items-center justify-between p-6 rounded-3xl border-2 text-left transition-all bg-gray-50/50 border-gray-100 opacity-50 cursor-not-allowed"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-50">
                      <CreditCard className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-bold leading-tight text-gray-400">Online Payment</p>
                      <p className="text-xs font-medium text-gray-400 mt-0.5">Coming Soon — Credit/Debit Card, UPI, Net Banking</p>
                    </div>
                  </div>
                </button>

                {/* Credit / EMI */}
                <button
                  onClick={() => isCreditEligible && setPaymentMethod('CREDIT')}
                  disabled={!isCreditEligible}
                  className={`flex items-center justify-between p-6 rounded-3xl border-2 text-left transition-all ${
                    paymentMethod === 'CREDIT'
                      ? 'bg-white border-lime-300 shadow-xl shadow-lime-900/5'
                      : isCreditEligible
                      ? 'bg-white/50 border-gray-100 hover:border-gray-200'
                      : 'bg-gray-50/50 border-gray-100 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === 'CREDIT' ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                      <CreditCard className={`w-5 h-5 ${paymentMethod === 'CREDIT' ? 'text-emerald-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <p className={`font-bold leading-tight ${paymentMethod === 'CREDIT' ? 'text-gray-900' : isCreditEligible ? 'text-gray-600' : 'text-gray-400'}`}>
                        Credit / EMI
                      </p>
                      <p className="text-xs font-medium text-gray-400 mt-0.5">
                        {isCreditEligible
                          ? `Available credit: ₹${(credit.availableCredit ?? 0).toLocaleString('en-IN')}`
                          : 'Not eligible — apply for credit in your profile'}
                      </p>
                    </div>
                  </div>
                  {paymentMethod === 'CREDIT' && <CheckCircle2 className="w-6 h-6 text-lime-500" />}
                </button>
              </div>
            </motion.div>
          </div>

          {/* Right Side - Order Summary */}
          <aside className="lg:w-96">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/60 backdrop-blur-3xl border border-white/50 rounded-2xl sm:rounded-3xl md:rounded-[48px] p-4 sm:p-6 md:p-8 lg:p-10 shadow-2xl sticky top-24 sm:top-32"
            >
              <div className="flex items-center gap-3 mb-6 sm:mb-8">
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />
                <h3 className="text-xl sm:text-2xl font-black text-gray-900">Order Summary</h3>
              </div>

              <div className="space-y-6 mb-10 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item: any) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 bg-[#f1f6ea] rounded-2xl flex-shrink-0 relative overflow-hidden">
                      <Image src={item.productImage || '/product_placeholder.png'} alt={item.productName} fill className="object-contain p-2" sizes="64px" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 leading-tight line-clamp-1">{item.productName}</p>
                      <p className="text-sm font-medium text-gray-400 mt-1">Qty: {item.quantity} • ₹{item.price}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 border-t border-gray-100 pt-8 mb-8">
                <div className="flex justify-between text-gray-600 font-medium">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600 font-medium">
                  <div className="flex items-center gap-2">
                    <span>Shipping</span>
                    <Truck className="w-4 h-4 text-gray-400" />
                  </div>
                  <span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                </div>
                <div className="flex justify-between text-gray-600 font-medium">
                  <span>GST ({platformConfig?.gst_rate ?? 12}%)</span>
                  <span>₹{gst.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xl sm:text-2xl md:text-[28px] font-black text-gray-900 pt-4 border-t border-gray-100">
                  <span>Total</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>

              <button 
                onClick={handlePlaceOrder}
                disabled={createOrder.isPending || items.length === 0}
                className="w-full h-12 sm:h-14 md:h-16 bg-lime-300 hover:bg-lime-400 disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400 text-gray-900 rounded-xl sm:rounded-2xl text-base sm:text-lg md:text-xl font-black transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                {createOrder.isPending ? (
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <span>Place Order</span>
                    <ChevronRight className="w-6 h-6" />
                  </>
                )}
              </button>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4 text-lime-500" />
                <span>Secure Checkout Guaranteed</span>
              </div>
            </motion.div>
          </aside>
        </div>
      </div>

      <Footer />
    </main>
    </AuthGuard>
  );
}
