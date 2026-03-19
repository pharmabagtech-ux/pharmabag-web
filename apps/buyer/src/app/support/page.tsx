'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, MessageCircle, ChevronRight, Plus, AlertCircle, Clock, Inbox, X, Send } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { SkeletonList } from '@/components/shared/LoaderSkeleton';
import { useToast } from '@/components/shared/Toast';
import { useTickets, useCreateTicket } from '@/hooks/useTickets';
import { useState } from 'react';

export default function SupportPage() {
  const { data, isLoading, isError } = useTickets();
  const createTicket = useCreateTicket();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '', category: 'General', priority: 'medium' as const });

  const tickets = data?.data ?? [];

  const handleCreateTicket = () => {
    if (!form.subject.trim() || !form.description.trim()) return;
    createTicket.mutate(
      { subject: form.subject, description: form.description, category: form.category, priority: form.priority },
      {
        onSuccess: () => {
          setShowForm(false);
          setForm({ subject: '', description: '', category: 'General', priority: 'medium' });
          toast('Ticket created successfully!', 'success');
        },
        onError: () => toast('Failed to create ticket', 'error'),
      }
    );
  };

  const statusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'open') return 'bg-green-100 text-green-700';
    if (s === 'in-progress') return 'bg-blue-100 text-blue-700';
    if (s === 'resolved' || s === 'closed') return 'bg-gray-100 text-gray-500';
    return 'bg-gray-100 text-gray-500';
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try { return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return dateStr; }
  };

  return (
    <main className="min-h-screen bg-gray-50/50">
      <Navbar />
      
      <div className="pt-32 pb-20 max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-gray-100">
                <HelpCircle className="w-6 h-6 text-gray-800" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Help & Support</h1>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-gray-900 text-white rounded-full font-bold flex items-center gap-2 hover:bg-black shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Create Ticket
            </motion.button>
          </div>

          {/* Create Ticket Modal */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white/60 backdrop-blur-xl p-8 rounded-[40px] border border-white/40 shadow-xl space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">New Support Ticket</h2>
                  <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Subject</label>
                    <input
                      value={form.subject}
                      onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                      placeholder="Brief description of your issue"
                      className="w-full px-5 py-3 bg-white/60 rounded-2xl border border-gray-200 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-lime-300"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      className="w-full px-5 py-3 bg-white/60 rounded-2xl border border-gray-200 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-lime-300"
                    >
                      <option>General</option>
                      <option>Delivery</option>
                      <option>Billing</option>
                      <option>Product</option>
                      <option>Technical</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Priority</label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                      className="w-full px-5 py-3 bg-white/60 rounded-2xl border border-gray-200 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-lime-300"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      rows={4}
                      placeholder="Provide details about your issue..."
                      className="w-full px-5 py-3 bg-white/60 rounded-2xl border border-gray-200 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-lime-300 resize-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCreateTicket}
                    disabled={createTicket.isPending || !form.subject.trim() || !form.description.trim()}
                    className="px-8 py-3 bg-lime-300 text-gray-900 rounded-full font-bold flex items-center gap-2 hover:bg-lime-400 shadow-lg shadow-lime-200 transition-all disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {createTicket.isPending ? 'Submitting...' : 'Submit Ticket'}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <motion.div whileHover={{ y: -4 }} className="bg-white/40 p-6 rounded-[32px] border border-white/40 shadow-xl transition-shadow hover:shadow-2xl">
               <MessageCircle className="w-8 h-8 text-blue-500 mb-4" />
               <h3 className="font-bold text-gray-900">Live Chat</h3>
               <p className="text-sm text-gray-500 mt-2">Speak directly with our support team.</p>
               <button className="text-blue-600 font-bold mt-4 hover:underline">Start Chat</button>
             </motion.div>
             <motion.div whileHover={{ y: -4 }} className="bg-white/40 p-6 rounded-[32px] border border-white/40 shadow-xl transition-shadow hover:shadow-2xl">
               <AlertCircle className="w-8 h-8 text-orange-500 mb-4" />
               <h3 className="font-bold text-gray-900">Knowledge Base</h3>
               <p className="text-sm text-gray-500 mt-2">Find answers to frequently asked questions.</p>
               <button className="text-orange-600 font-bold mt-4 hover:underline">Read FAQ</button>
             </motion.div>
             <motion.div whileHover={{ y: -4 }} className="bg-lime-100/40 p-6 rounded-[32px] border border-lime-200 shadow-xl transition-shadow hover:shadow-2xl">
               <Clock className="w-8 h-8 text-lime-700 mb-4" />
               <h3 className="font-bold text-gray-900">24/7 Support</h3>
               <p className="text-sm text-gray-500 mt-2">Always here to help you grow your business.</p>
             </motion.div>
          </div>

          <div className="space-y-4">
             <h2 className="text-xl font-bold text-gray-900 ml-2">Your Tickets</h2>

             {isLoading ? (
               <SkeletonList count={3} variant="ticket" />
             ) : isError ? (
               <div className="flex flex-col items-center justify-center py-16 gap-3">
                 <AlertCircle className="w-10 h-10 text-gray-300" />
                 <p className="text-lg font-bold text-gray-400">Failed to load tickets</p>
               </div>
             ) : tickets.length === 0 ? (
               <EmptyState
                 icon={MessageCircle}
                 title="No tickets yet"
                 description="Create a ticket to get help from our support team."
                 actionLabel="Create Ticket"
                 onAction={() => setShowForm(true)}
                 compact
               />
             ) : (
               tickets.map((tkt: any) => (
                 <motion.div
                   key={tkt.id}
                   whileHover={{ y: -5 }}
                   className="bg-white/40 backdrop-blur-xl p-8 rounded-[40px] border border-white/40 shadow-xl flex items-center justify-between"
                 >
                   <div className="flex flex-col">
                     <div className="flex items-center gap-3 mb-2">
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{tkt.id.slice(-8)}</span>
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${statusColor(tkt.status)}`}>
                          {tkt.status}
                       </span>
                       {tkt.priority && (
                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tkt.priority === 'high' ? 'bg-red-100 text-red-600' : tkt.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                           {tkt.priority}
                         </span>
                       )}
                     </div>
                     <h3 className="text-lg font-bold text-gray-900">{tkt.subject}</h3>
                     <p className="text-sm text-gray-400 font-medium mt-1">
                       {tkt.category ?? 'General'} • Created {formatDate(tkt.createdAt)}
                     </p>
                   </div>
                   
                   <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                         <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Updated</p>
                         <p className="text-sm font-bold text-gray-800">{formatDate(tkt.updatedAt)}</p>
                      </div>
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
                         <ChevronRight className="w-6 h-6" />
                      </div>
                   </div>
                 </motion.div>
               ))
             )}
          </div>
        </motion.div>
      </div>

      <Footer />
    </main>
  );
}
