"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LifeBuoy, Send, Clock, CheckCircle2, AlertCircle, ChevronDown, MessageSquare } from "lucide-react";
import { useSellerTickets, useCreateSellerTicket } from "@/hooks/useSeller";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";

const REASONS = [
  "Order Issue",
  "Payment Issue",
  "Product Listing",
  "Account & Profile",
  "Settlement Dispute",
  "Technical Issue",
  "Other",
];

const STATUS_COLOR: Record<string, string> = {
  OPEN: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  RESOLVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CLOSED: "bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400",
};

export default function SupportPage() {
  const [reason, setReason] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { data: ticketsRaw, isLoading } = useSellerTickets();
  const { mutate: createTicket, isPending } = useCreateSellerTicket();

  const tickets: any[] = Array.isArray(ticketsRaw) ? ticketsRaw : (ticketsRaw?.data?.tickets ?? ticketsRaw?.tickets ?? ticketsRaw?.data ?? []);
  console.dir({ DEBUG_TICKETS: tickets }, { depth: null });

  const wordCount = message.trim().split(/\s+/).filter(Boolean).length;

  const handleSubmit = () => {
    if (!reason) { toast.error("Please select a reason"); return; }
    if (!subject.trim()) { toast.error("Please enter a subject"); return; }
    if (!message.trim()) { toast.error("Please enter a message"); return; }
    if (wordCount > 150) { toast.error("Message must be 150 words or fewer"); return; }

    const fullSubject = `[${reason}] ${subject.trim()}`;

    createTicket(
      { subject: fullSubject, message: message.trim() },
      {
        onSuccess: () => {
          toast.success("Support ticket raised successfully!");
          setReason("");
          setSubject("");
          setMessage("");
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Failed to raise ticket");
        },
      }
    );
  };

  return (
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-1">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3"
            >
              <LifeBuoy className="w-8 h-8 text-primary" />
              Support Center
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground"
            >
              Raise a support ticket and our team will get back to you within 24 hours.
            </motion.p>
          </div>

          {/* ═══ Raise Ticket Form ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass rounded-3xl border border-white/20 p-6 md:p-8 shadow-sm space-y-6"
          >
            <h2 className="text-lg font-semibold text-foreground">Raise a New Ticket</h2>

            {/* Row: Reason + Subject */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Reason dropdown */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-primary">Reason</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  >
                    <span className={reason ? "text-foreground" : "text-muted-foreground"}>
                      {reason || "Select your reason here"}
                    </span>
                    <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", dropdownOpen && "rotate-180")} />
                  </button>
                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.ul
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute z-50 mt-1 w-full rounded-xl glass border border-white/20 shadow-lg overflow-hidden"
                      >
                        {REASONS.map((r) => (
                          <li key={r}>
                            <button
                              type="button"
                              onClick={() => { setReason(r); setDropdownOpen(false); }}
                              className={cn(
                                "w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-primary/10",
                                reason === r ? "text-primary font-medium bg-primary/5" : "text-foreground"
                              )}
                            >
                              {r}
                            </button>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-primary">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of your issue"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-primary">Message (MAX 150 words)</label>
                <span className={cn("text-xs", wordCount > 150 ? "text-red-500" : "text-muted-foreground")}>
                  {wordCount} / 150
                </span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue in detail so our team can help you faster…"
                className="w-full h-32 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
              />
            </div>

            {/* Submit button */}
            <div className="flex justify-center">
              <button
                onClick={handleSubmit}
                disabled={isPending || !reason || !subject.trim() || !message.trim() || wordCount > 150}
                className={cn(
                  "w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold text-white transition-all",
                  isPending || !reason || !subject.trim() || !message.trim() || wordCount > 150
                    ? "bg-primary/50 cursor-not-allowed"
                    : "bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 active:scale-95"
                )}
              >
                {isPending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                {isPending ? "Submitting..." : "Submit"}
              </button>
            </div>
          </motion.div>

          {/* ═══ Ticket History ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Your Tickets
            </h2>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="glass rounded-2xl border border-white/10 p-8 text-center">
                <LifeBuoy className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground text-sm">No tickets raised yet. Use the form above to create one.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((t: any, i: number) => (
                  <Link key={t.id || t._id || t.ticketId || t.ticket_id} href={`/support/${t.id || t._id || t.ticketId || t.ticket_id}`}>
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="glass rounded-2xl border border-white/10 p-5 hover:border-primary/30 transition-all cursor-pointer"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-medium text-foreground text-sm truncate">{t.subject}</h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {t._count?.messages ?? t.messages?.length ?? 0} replies
                            </span>
                          </div>
                        </div>
                        <span className={cn("px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap", STATUS_COLOR[t.status] ?? STATUS_COLOR.OPEN)}>
                          {t.status?.replace("_", " ") ?? "OPEN"}
                        </span>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        </div>
  );
}
