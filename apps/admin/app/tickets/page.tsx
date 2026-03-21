"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Ticket as TicketIcon, Loader2, ArrowRight } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Input, Badge } from "@/components/ui";
import { formatDate } from "@pharmabag/utils";
import { cn } from "@/lib/utils";
import { useTickets } from "@/hooks/useAdmin";
import Link from "next/link";

export default function AdminTicketsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED">("ALL");
  
  const { data: ticketsData, isLoading } = useTickets();

  const tickets = Array.isArray(ticketsData) ? ticketsData : (ticketsData?.data ?? []);

  const filtered = tickets.filter((t: any) =>
    (filter === "ALL" || t.status === filter) &&
    (!search || 
      (t.id || "").toLowerCase().includes(search.toLowerCase()) || 
      (t.subject || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.user?.phone || "").includes(search)
    )
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center space-y-2">
            <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading tickets…</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const activeTickets = tickets.filter((t: any) => t.status === "OPEN" || t.status === "IN_PROGRESS").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-semibold text-2xl text-foreground flex items-center gap-2">
              <TicketIcon className="h-6 w-6 text-primary" />
              Support Tickets
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage and respond to user inquiries and issues
            </p>
          </div>
          <div className="text-right">
            <p className="font-medium text-xl text-primary">{activeTickets}</p>
            <p className="text-xs text-muted-foreground">Active Tickets</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input placeholder="Search by ID, subject, or user phone…" value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-sb pb-1 sm:pb-0" role="group" aria-label="Filter by status">
            {(["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn("px-3 py-2 rounded-xl text-xs font-medium border transition-all whitespace-nowrap", filter === f ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:bg-accent/60")}>
                {f.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="Tickets">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Ticket ID</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">User</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Subject</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Date Opened</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">No tickets found</td></tr>
                ) : filtered.map((t: any, i: number) => (
                  <motion.tr key={t.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="hover:bg-accent/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="text-sm font-mono text-muted-foreground truncate w-24" title={t.id}>{t.id?.substring(0, 8)}...</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium text-foreground">{t.user?.phone ?? "Unknown User"}</div>
                      <div className="text-xs text-muted-foreground capitalize mt-0.5">{t.user?.role?.toLowerCase() ?? "User"}</div>
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <div className="text-sm font-medium text-foreground truncate" title={t.subject}>{t.subject}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{t._count?.messages || 0} messages</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(t.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={t.status === "CLOSED" || t.status === "RESOLVED" ? "default" : t.status === "OPEN" ? "warning" : "info"}>
                        {t.status?.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/tickets/${t.id}`}>
                        <Button size="sm" variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10">
                          View <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
