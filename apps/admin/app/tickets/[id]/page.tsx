"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, ArrowLeft, Loader2, User, Shield, Clock } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Input, Badge } from "@/components/ui";
import { formatDate, formatDateTime } from "@pharmabag/utils";
import { cn } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useTicketById, useReplyToTicket, useUpdateTicketStatus, useAdminMe } from "@/hooks/useAdmin";

export default function AdminTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;
  const [replyMessage, setReplyMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { data: ticket, isLoading } = useTicketById(ticketId);
  const { data: adminMe } = useAdminMe();
  const replyToTicket = useReplyToTicket();
  const updateStatus = useUpdateTicketStatus();

  const adminId = adminMe?.id;

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    try {
      await replyToTicket.mutateAsync({ ticketId, message: replyMessage });
      setReplyMessage("");
      toast.success("Message sent");
    } catch {
      toast.error("Failed to send message");
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await updateStatus.mutateAsync({ ticketId, status });
      toast.success(`Ticket marked as ${status.replace("_", " ")}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!ticket) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Ticket not found</p>
          <Button onClick={() => router.push("/tickets")} className="mt-4" variant="outline">Back to Tickets</Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <button onClick={() => router.push("/tickets")} className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Tickets
        </button>

        <div className="glass-card p-6 rounded-2xl border border-border">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant={ticket.status === "CLOSED" || ticket.status === "RESOLVED" ? "default" : ticket.status === "OPEN" ? "warning" : "info"}>
                  {ticket.status?.replace("_", " ")}
                </Badge>
                <span className="text-xs font-mono text-muted-foreground">ID: {ticket.id}</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">{ticket.subject}</h1>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><User className="h-4 w-4" /> {ticket.user?.phone} ({ticket.user?.role?.toLowerCase()})</span>
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {formatDateTime(ticket.createdAt)}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {ticket.status !== "RESOLVED" && <Button size="sm" variant="outline" onClick={() => handleStatusChange("RESOLVED")} className="text-green-600 border-green-200 hover:bg-green-50">Mark Resolved</Button>}
              {ticket.status !== "CLOSED" && <Button size="sm" variant="outline" onClick={() => handleStatusChange("CLOSED")}>Close Ticket</Button>}
              {ticket.status === "CLOSED" && <Button size="sm" variant="outline" onClick={() => handleStatusChange("OPEN")} className="text-blue-600 border-blue-200 hover:bg-blue-50">Reopen</Button>}
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl flex flex-col" style={{ height: "calc(100vh - 280px)", minHeight: "500px" }}>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 no-sb">
            {(() => {
              let messages = ticket.messages ?? [];
              if (ticket.description && !messages.find((m: any) => m.id === 'desc-msg')) {
                messages = [
                  {
                    id: 'desc-msg',
                    message: ticket.description,
                    sender: 'user', // user sender
                    createdAt: ticket.createdAt,
                  },
                  ...messages,
                ];
              }
              if (messages.length === 0) {
                return <div className="text-center text-muted-foreground py-10">No messages yet.</div>;
              }
              return messages.map((msg: any, i: number) => {
                const isAdmin = msg.senderId === adminId || msg.sender?.role === "ADMIN";
                return (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className={cn("flex w-full", isAdmin ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[80%] rounded-2xl p-4", isAdmin ? "bg-primary text-white rounded-br-none" : "bg-muted text-foreground rounded-bl-none")}>
                      <div className="flex items-center gap-2 mb-1.5">
                        {isAdmin ? <Shield className="h-3 w-3 opacity-70" /> : <User className="h-3 w-3 opacity-70" />}
                        <span className={cn("text-xs font-medium", isAdmin ? "text-primary-foreground/90" : "text-muted-foreground")}>{isAdmin ? "Support Agent" : "User"}</span>
                        <span className={cn("text-xs", isAdmin ? "text-primary-foreground/70" : "text-muted-foreground/70")}>· {formatDate(msg.createdAt, { hour: "2-digit", minute: "2-digit" })}</span>
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
          <div className="p-4 border-t border-border/50 bg-background/50 rounded-b-2xl">
            {ticket.status === "CLOSED" ? (
              <div className="text-center py-2 text-sm text-muted-foreground">Ticket is closed. Reopen to send a message.</div>
            ) : (
              <form onSubmit={handleReply} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Type your reply to the user..."
                  className="flex-1 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  value={replyMessage}
                  onChange={e => setReplyMessage(e.target.value)}
                  required
                />
                <Button type="submit" loading={replyToTicket.isPending} disabled={!replyMessage.trim()} leftIcon={<Send className="h-4 w-4" />}>
                  Send Reply
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
