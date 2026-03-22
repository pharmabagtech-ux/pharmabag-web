import React, { useState } from 'react';
import Image from 'next/image';
import { X, Loader2 } from 'lucide-react';
import { sendOtp, verifyOtp } from '@pharmabag/api-client';
import { useToast } from '@/components/shared/Toast';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TRUST_HIGHLIGHTS = [
  { label: 'Fastest Delivery' },
  { label: 'Controlled Qality' },
  { label: 'Only B2B rates' },
  { label: '0 Torelence 2 Diplicay' },
];

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const sanitizePhone = (input: string) => {
    // Remove all non-numeric characters
    let cleaned = input.replace(/\D/g, '');
    // If it starts with 91 and is 12 digits, strip the 91
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      cleaned = cleaned.substring(2);
    }
    return cleaned;
  };

  const handleSendOtp = async () => {
    const cleanPhone = sanitizePhone(phone);
    if (cleanPhone.length !== 10) {
      toast('Please enter a valid 10-digit phone number', 'error');
      return;
    }

    // Dev bypass: Skip real OTP for this specific number
    if (cleanPhone === '9831864222') {
      setStep('otp');
      toast('Dev Bypass: Use 123456', 'success');
      return;
    }

    setIsLoading(true);
    try {
      await sendOtp(cleanPhone);
      setStep('otp');
      toast('OTP sent successfully!', 'success');
    } catch (error: any) {
      toast(error?.response?.data?.message || 'Failed to send OTP', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const cleanPhone = sanitizePhone(phone);
    console.log('Verifying OTP:', { phone: cleanPhone, otp });
    if (otp.length < 4) {
      toast('Please enter the OTP', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await verifyOtp(cleanPhone, otp);
      toast('Login successful!', 'success');
      onClose();
      window.location.href = '/products'; // Redirect to products after login
    } catch (error: any) {
      console.error('Verify OTP failed:', error?.response?.data || error);
      toast(error?.response?.data?.message || 'Invalid OTP', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 md:p-20 overflow-y-auto">
      {/* Absolute Full-Screen Glassmorphism Backdrop */}
      <div 
        className="fixed inset-0 bg-black/5 backdrop-blur-[40px] transition-opacity duration-500"
        onClick={onClose}
      />

      <div className="relative w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center md:justify-between gap-12 md:gap-20">
        {/* Close Button - Simple X in corner */}
        <button 
          onClick={onClose}
          className="fixed top-8 right-8 p-4 text-black/80 hover:text-black transition-colors z-[110]"
        >
          <X size={32} strokeWidth={1} />
        </button>

        {/* Left Side - Branding & Trust */}
        <div className="flex-1 flex flex-col items-center text-center gap-12">
          <div className="flex flex-col items-center gap-8">
            <div className="relative">
              {/* More pronounced shadow for depth */}
              <div className="absolute inset-0 bg-black/20 blur-3xl rounded-full scale-110" />
              <Image 
                src="/pharmabag_logo.png" 
                alt="PharmaBag Logo" 
                width={120} 
                height={120} 
                className="relative w-32 md:w-36 h-auto drop-shadow-2xl"
              />
            </div>
            <div className="space-y-3">
              <h1 className="text-5xl md:text-[80px] font-black text-black tracking-tight leading-none">Pharma Bag</h1>
              <p className="text-3xl md:text-5xl font-normal text-black tracking-tight">
                Inida&apos;s Only <span className="font-bold text-black">Trusted</span>
              </p>
              <p className="text-xl md:text-2xl font-medium text-black/60">B2B Pharma Pklatform</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-10 gap-y-8 mt-4 max-w-2xl px-4">
            {TRUST_HIGHLIGHTS.map((item) => (
              <p key={item.label} className="text-xl md:text-[28px] font-bold text-black whitespace-nowrap">{item.label}</p>
            ))}
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 w-full max-w-md flex flex-col items-center">
          <div className="text-center mb-10">
            <h2 className="text-5xl md:text-[58px] font-black text-black mb-1 whitespace-nowrap">Express Login!</h2>
            <p className="text-xl md:text-2xl text-black font-medium">No Signup Required</p>
          </div>

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              step === 'phone' ? handleSendOtp() : handleVerifyOtp();
            }}
            className="w-full space-y-5"
          >
            {step === 'phone' ? (
              <div className="space-y-1.5">
                <label className="block text-lg md:text-xl font-semibold text-black/70 text-center">
                  Phone number
                </label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter 10-digit number"
                  autoFocus
                  className="w-full h-14 md:h-16 bg-white rounded-2xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] text-xl md:text-2xl px-8 text-center focus:ring-4 focus:ring-lime-300 outline-none transition-all"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-lg md:text-xl font-semibold text-black/70 text-center">
                  OTP
                </label>
                <input 
                  type="text" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="_ _ _ _"
                  autoFocus
                  className="w-full h-14 md:h-16 bg-white rounded-2xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] text-xl md:text-2xl px-8 text-center focus:ring-4 focus:ring-lime-300 outline-none transition-all"
                />
                <button 
                  type="button" 
                  onClick={handleSendOtp}
                  className="w-full text-center text-lg font-bold text-black/40 hover:text-black/80 tracking-widest transition-colors mt-2"
                >
                  RESEND OTP
                </button>
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full h-16 bg-lime-300 hover:bg-lime-400 text-gray-900 rounded-2xl text-xl font-black shadow-xl shadow-lime-300/20 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <span>{step === 'phone' ? 'Send OTP' : 'Continue'}</span>
              )}
            </button>

            {/* App Store Badges */}
            <div className="flex gap-4 mt-8 w-full pt-4">
              <Image 
                src="/app_store_badge.png" 
                alt="Download on App Store" 
                width={160} 
                height={50} 
                className="flex-1 h-auto transition-transform hover:scale-105"
              />
              <Image 
                src="/google_play_badge.png" 
                alt="Get it on Google Play" 
                width={160} 
                height={50} 
                className="flex-1 h-auto transition-transform hover:scale-105"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
