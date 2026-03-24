'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShieldCheck, Globe, Zap } from 'lucide-react';

export default function PremiumFooter() {
  const footerLinks = [
    { label: 'Intelligence Blogs', href: '#' },
    { label: 'Response Center', href: '/support' },
    { label: 'Corporate Entity', href: '#' },
    { label: 'Governance Protocol', href: '#' },
    { label: 'Privacy Framework', href: '#' },
    { label: 'Logistics Policy', href: '#' },
    { label: 'Consignment Returns', href: '#' },
    { label: 'Contact Interface', href: '#' },
  ];

  return (
    <footer className="bg-white border-t border-gray-100 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-6 py-24 relative z-10">
        <div className="flex flex-col xl:flex-row justify-between items-start gap-20 xl:gap-32">
          {/* Brand Matrix */}
          <div className="flex-1 space-y-12">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center p-4 border border-gray-100 shadow-xl group hover:scale-105 transition-transform">
                <Image 
                  src="/pharmabag_logo.png" 
                  alt="PharmaBag" 
                  width={80} 
                  height={80} 
                  className="w-full h-auto object-contain"
                />
              </div>
              <div>
                <h3 className="text-4xl font-black text-gray-950 tracking-tighter mb-1 uppercase">
                  Pharma Bag
                </h3>
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-lime-500 animate-pulse" />
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Operational Supremacy</p>
                </div>
              </div>
            </div>

            <div className="space-y-6 max-w-xl">
               <p className="text-2xl font-bold text-gray-900 leading-tight">
                 India&apos;s most sophisticated <span className="text-lime-600">B2B pharmaceuticals</span> distribution protocol. 
               </p>
               <p className="text-sm font-medium text-gray-400 leading-relaxed uppercase tracking-wider">
                 Architecting the future of healthcare supply chains with real-time signal processing and automated fulfillment logistics.
               </p>
            </div>

            <div className="flex flex-wrap gap-4">
               {[
                 { icon: ShieldCheck, label: 'GPD Certified' },
                 { icon: Globe, label: 'Pan-India Grid' },
                 { icon: Zap, label: 'Hyper-Logic' }
               ].map((cert) => (
                 <div key={cert.label} className="flex items-center gap-3 px-5 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <cert.icon className="w-4 h-4 text-gray-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{cert.label}</span>
                 </div>
               ))}
            </div>
          </div>

          {/* Navigation Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-16 gap-y-10 xl:min-w-[600px]">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="group flex flex-col gap-1 transition-all"
              >
                <span className="text-sm font-black text-gray-900 group-hover:text-lime-600 transition-colors uppercase tracking-widest">
                  {link.label}
                </span>
                <div className="h-0.5 w-0 bg-lime-400 group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-24 pt-12 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-8">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">
             &copy; {new Date().getFullYear()} PHARMABAG INTELLIGENCE SYSTEMS. ALL PROTOCOLS RESERVED.
           </p>
           <div className="flex items-center gap-10">
              <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">ISO 27001:2022</p>
              <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">GDPR COMPLIANT</p>
              <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">SOC 2 TYPE II</p>
           </div>
        </div>
      </div>
    </footer>
  );
}
