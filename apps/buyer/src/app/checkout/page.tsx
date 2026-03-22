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
import PremiumNavbar from '@/components/shared/PremiumNavbar';
import PremiumFooter from '@/components/shared/PremiumFooter';
import { useCart } from '@/hooks/useCart';
import { useCreateOrder } from '@/hooks/useOrders';
import { useBuyerProfile } from '@/hooks/useBuyerProfile';
import { useToast } from '@/components/shared/Toast';
import Link from 'next/link';

export default function CheckoutPage() {
  const { data: cartData, isLoading: isCartLoading } = useCart();
  const { data: profileData } = useBuyerProfile();
  const { toast } = useToast();
  const createOrder = useCreateOrder();
  
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
  const shipping = subtotal > 5000 ? 0 : 250;
  const gst = subtotal * 0.12; // 12% GST example
  const total = subtotal + shipping + gst;

  const handlePlaceOrder = () => {
    if (!address.name || !address.phone || !address.address || !address.city || !address.state || !address.pincode) {
      toast('Please fill in all delivery details', 'error');
      return;
    }

    createOrder.mutate(address, {
      onSuccess: (data: any) => {
        const orderId = data?.data?.id || data?.id;
        window.location.href = `/orders/${orderId}?success=true`;
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

  return (
    <main className="min-h-screen bg-[#f8fbfa]">
      <PremiumNavbar />

      <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <Link 
          href="/products" 
          className="inline-flex items-center gap-2 text-gray-400 font-bold hover:text-gray-900 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Shopping</span>
        </Link>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left Side - Delivery Details */}
          <div className="flex-1 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/40 backdrop-blur-3xl border border-white/50 rounded-[40px] p-8 md:p-12 shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-lime-100 rounded-2xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-gray-800" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Delivery Address</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Receiver Name</label>
                  <input 
                    type="text"
                    value={address.name}
                    onChange={(e) => setAddress({ ...address, name: e.target.value })}
                    className="w-full h-14 bg-white/70 rounded-2xl border border-white/50 px-6 text-gray-900 font-medium focus:ring-4 focus:ring-lime-300 focus:bg-white outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Phone Number</label>
                  <input 
                    type="text"
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    className="w-full h-14 bg-white/70 rounded-2xl border border-white/50 px-6 text-gray-900 font-medium focus:ring-4 focus:ring-lime-300 focus:bg-white outline-none transition-all"
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Street Address</label>
                  <input 
                    type="text"
                    value={address.address}
                    onChange={(e) => setAddress({ ...address, address: e.target.value })}
                    className="w-full h-14 bg-white/70 rounded-2xl border border-white/50 px-6 text-gray-900 font-medium focus:ring-4 focus:ring-lime-300 focus:bg-white outline-none transition-all"
                    placeholder="123 Pharma Lane"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">City</label>
                  <input 
                    type="text"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full h-14 bg-white/70 rounded-2xl border border-white/50 px-6 text-gray-900 font-medium focus:ring-4 focus:ring-lime-300 focus:bg-white outline-none transition-all"
                    placeholder="Mumbai"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">State</label>
                  <input 
                    type="text"
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="w-full h-14 bg-white/70 rounded-2xl border border-white/50 px-6 text-gray-900 font-medium focus:ring-4 focus:ring-lime-300 focus:bg-white outline-none transition-all"
                    placeholder="Maharashtra"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">ZIP / Postcode</label>
                  <input 
                    type="text"
                    value={address.pincode}
                    onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                    className="w-full h-14 bg-white/70 rounded-2xl border border-white/50 px-6 text-gray-900 font-medium focus:ring-4 focus:ring-lime-300 focus:bg-white outline-none transition-all"
                    placeholder="400001"
                  />
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/40 backdrop-blur-3xl border border-white/50 rounded-[40px] p-8 md:p-12 shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-sky-100 rounded-2xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-gray-800" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Payment Method</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="flex items-center justify-between p-6 bg-white rounded-3xl border-2 border-lime-300 shadow-xl shadow-lime-900/5 group text-left">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-lime-50 rounded-xl flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-lime-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 leading-tight">Cash on Delivery</p>
                      <p className="text-xs font-medium text-gray-400 mt-0.5">Pay when you receive</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-lime-500" />
                </button>

                <button disabled className="flex items-center justify-between p-6 bg-gray-50/50 rounded-3xl border border-gray-100 opacity-60 cursor-not-allowed text-left">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-400 leading-tight">Online Payment</p>
                      <p className="text-xs font-medium text-gray-400 mt-0.5">Credit/Debit/UPI</p>
                    </div>
                  </div>
                  <AlertCircle className="w-5 h-5 text-gray-300" />
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
              className="bg-white/60 backdrop-blur-3xl border border-white/50 rounded-[48px] p-8 md:p-10 shadow-2xl sticky top-32"
            >
              <div className="flex items-center gap-3 mb-8">
                <ShoppingBag className="w-6 h-6 text-gray-900" />
                <h3 className="text-2xl font-black text-gray-900">Order Summary</h3>
              </div>

              <div className="space-y-6 mb-10 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item: any) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 bg-[#f1f6ea] rounded-2xl flex-shrink-0 relative overflow-hidden">
                      <img src={item.productImage || '/product_placeholder.png'} alt={item.productName} className="object-contain p-2" />
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
                  <span>GST (12%)</span>
                  <span>₹{gst.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[28px] font-black text-gray-900 pt-4 border-t border-gray-100">
                  <span>Total</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>

              <button 
                onClick={handlePlaceOrder}
                disabled={createOrder.isPending || items.length === 0}
                className="w-full h-16 bg-lime-300 hover:bg-lime-400 disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400 text-gray-900 rounded-2xl text-xl font-black transition-all active:scale-95 flex items-center justify-center gap-3"
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

      <PremiumFooter />
    </main>
  );
}
