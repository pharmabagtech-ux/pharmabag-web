"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, ArrowLeft, Loader2, User, Shield, Clock, LifeBuoy } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useSellerTicketById, useAddTicketMessage } from "@/hooks/useSeller";

export default function SellerTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;
  const [replyMessage, setReplyMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: ticket, isLoading, isError, error } = useSellerTicketById(ticketId);
  const reply = useAddTicketMessage();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    try {
      await reply.mutateAsync({ ticketId, message: replyMessage });
      setReplyMessage("");
      toast.success("Message sent");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || "Failed to send message");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    if (ticketId === "undefined") {
      router.push("/support");
      return null;
    }

    const errorMessage = isError
      ? (error as any)?.response?.data?.message || (error as any)?.message || "Ticket not found"
      : "Ticket not found";

    console.error('[Seller Ticket Page] failed to load ticket:', ticketId, error);

    return (
      <div className="text-center py-20">
        <LifeBuoy className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="text-muted-foreground mb-4">{errorMessage} (ID: {ticketId})</p>
        <button onClick={() => router.push("/support")} className="text-sm text-primary underline">Back to Support</button>
      </div>
    );
  }

  const STATUS_COLOR: Record<string, string> = {
    OPEN: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    RESOLVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    CLOSED: "bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400",
  };

  return (
        <div className="max-w-4xl mx-auto space-y-6">
          <button onClick={() => router.push("/support")} className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Support
          </button>

          {/* Ticket Header */}
          <div className="glass rounded-2xl border border-white/10 p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={cn("px-3 py-1 rounded-full text-xs font-medium", STATUS_COLOR[ticket.status] ?? STATUS_COLOR.OPEN)}>
                    {ticket.status?.replace("_", " ") ?? "OPEN"}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">ID: {String(ticket.id || ticket._id || ticket.ticketId || ticket.ticket_id)?.slice(0, 8)}…</span>
                </div>
                <h1 className="text-xl font-bold text-foreground">{ticket.subject}</h1>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</span>
                </div>
                {ticket?.description && (
                  <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-foreground/80 leading-relaxed font-medium whitespace-pre-wrap">{ticket.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="glass rounded-2xl border border-white/10 flex flex-col" style={{ height: "calc(100vh - 340px)", minHeight: "400px" }}>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-sb">
              {(() => {
                let messages = ticket.messages ?? [];
                if (ticket.description && !messages.find((m: any) => m.id === 'desc-msg')) {
                  messages = [
                    {
                      id: 'desc-msg',
                      message: ticket.description,
                      sender: 'user',
                      createdAt: ticket.createdAt,
                    },
                    ...messages,
                  ];
                }
                
                if (messages.length === 0) {
                  return <div className="text-center text-muted-foreground py-10">No messages yet.</div>;
                }
                
                return messages.map((msg: any, i: number) => {
                  const isAdmin = msg.sender?.role === "ADMIN" || msg.sender === "admin" || msg.sender === "ADMIN" || msg.sender === "SUPPORT";
                  return (
                    <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className={cn("flex w-full", isAdmin ? "justify-start" : "justify-end")}>
                      <div className={cn("max-w-[80%] rounded-2xl p-4",
                        isAdmin ? "bg-muted text-foreground rounded-bl-none" : "bg-primary text-white rounded-br-none")}>
                        <div className="flex items-center gap-2 mb-1.5">
                          {isAdmin ? <Shield className="h-3 w-3 opacity-70" /> : <User className="h-3 w-3 opacity-70" />}
                          <span className={cn("text-xs font-medium", isAdmin ? "text-muted-foreground" : "text-primary-foreground/90")}>
                            {isAdmin ? "Support Agent" : "You"}
                          </span>
                          <span className={cn("text-xs", isAdmin ? "text-muted-foreground/70" : "text-primary-foreground/70")}>
                            · {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    </motion.div>
                  );
                });
              })()}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Area */}
            <div className="p-4 border-t border-white/10 bg-background/50 rounded-b-2xl">
              {ticket.status === "CLOSED" ? (
                <div className="text-center py-2 text-sm text-muted-foreground">Ticket is closed.</div>
              ) : (
                <form onSubmit={handleReply} className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Type your reply..."
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    value={replyMessage}
                    onChange={e => setReplyMessage(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    disabled={reply.isPending || !replyMessage.trim()}
                    className={cn(
                      "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white transition-all",
                      reply.isPending || !replyMessage.trim()
                        ? "bg-primary/50 cursor-not-allowed"
                        : "bg-primary hover:bg-primary/90 active:scale-95"
                    )}
                  >
                    {reply.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                    Send
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
  );
}
