'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  ArrowLeft, 
  User, 
  Headphones, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { useTicketById, useAddTicketMessage } from '@/hooks/useTickets';
import Link from 'next/link';
import AuthGuard from '@/components/shared/AuthGuard';

export default function TicketDetailPage() {
  const { ticketId } = useParams() as { ticketId: string };
  const { data: ticket, isLoading } = useTicketById(ticketId);
  const addMessage = useAddTicketMessage();
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = ticket?.messages ?? [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || addMessage.isPending) return;

    addMessage.mutate({ ticketId, message: newMessage.trim() }, {
      onSuccess: () => setNewMessage('')
    });
  };

  if (isLoading) {
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
    <AuthGuard>
    <main className="min-h-screen bg-[#f8fbfa] flex flex-col">
      <Navbar showUserActions={true} />

      <div className="flex-1 pt-32 pb-20 px-6 max-w-5xl mx-auto w-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/support" 
            className="inline-flex items-center gap-2 text-gray-400 font-bold hover:text-gray-900 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Support Tickets</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
              ticket?.status === 'open' ? 'bg-lime-100 text-lime-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {ticket?.status}
            </span>
          </div>
        </div>

        {/* Ticket Title Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/40 backdrop-blur-3xl border border-white/50 rounded-[32px] p-8 mb-8 shadow-xl"
        >
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>Ticket #{ticketId.slice(-6).toUpperCase()}</span>
              </p>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight">
                {ticket?.subject}
              </h1>
              <p className="text-gray-500 font-medium mt-2">{ticket?.category}</p>
            </div>
          </div>
        </motion.div>

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col bg-white/40 backdrop-blur-3xl border border-white/50 rounded-[40px] shadow-2xl overflow-hidden min-h-[500px]">
          {/* Message List */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4">
                <Headphones className="w-16 h-16" />
                <p className="font-bold text-xl uppercase tracking-widest">No messages yet</p>
              </div>
            ) : (
              messages.map((msg: any, idx: number) => {
                const isSystem = msg.sender === 'SUPPORT';
                return (
                  <motion.div 
                    key={msg.id || idx}
                    initial={{ opacity: 0, x: isSystem ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex ${isSystem ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`flex gap-4 max-w-[80%] ${isSystem ? 'flex-row' : 'flex-row-reverse'}`}>
                      <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${
                        isSystem ? 'bg-sky-100' : 'bg-lime-100'
                      }`}>
                        {isSystem ? <Headphones className="w-5 h-5 text-gray-800" /> : <User className="w-5 h-5 text-gray-800" />}
                      </div>
                      <div className={`space-y-1 ${isSystem ? 'items-start' : 'items-end flex flex-col'}`}>
                        <div className={`p-5 rounded-[24px] ${
                          isSystem 
                            ? 'bg-white text-gray-800 rounded-tl-none border border-gray-100 shadow-sm' 
                            : 'bg-lime-300 text-gray-900 rounded-tr-none shadow-lg shadow-lime-300/10'
                        }`}>
                          <p className="text-base font-medium leading-relaxed">{msg.message}</p>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white/60 border-t border-white/40 backdrop-blur-xl">
            <form onSubmit={handleSendMessage} className="flex gap-4">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message here..."
                disabled={ticket?.status === 'closed'}
                className="flex-1 h-14 bg-white rounded-2xl border border-gray-100 px-6 font-medium focus:ring-4 focus:ring-lime-100 focus:border-lime-300 outline-none transition-all disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={!newMessage.trim() || addMessage.isPending || ticket?.status === 'closed'}
                className="w-14 h-14 bg-lime-300 hover:bg-lime-400 disabled:opacity-50 disabled:bg-gray-200 text-gray-900 rounded-2xl flex items-center justify-center shadow-lg shadow-lime-300/20 active:scale-90 transition-all"
              >
                {addMessage.isPending ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
            {ticket?.status === 'closed' && (
              <p className="text-center text-xs font-bold text-red-400 uppercase tracking-widest mt-4 flex items-center justify-center gap-2">
                <AlertCircle className="w-3 h-3" />
                <span>This ticket is closed and cannot be replied to.</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
    </AuthGuard>
  );
}
