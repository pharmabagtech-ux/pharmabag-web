"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Plus, Eye, MapPin, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button, Badge, Skeleton } from "@/components/ui";
import { getSellerBuyers } from "@/api/seller.api";
import toast from "react-hot-toast";

interface BuyerProfile {
  id: string;
  userId: string;
  phone: string;
  name: string;
  email?: string;
  legalName: string;
  gstNumber?: string;
  panNumber?: string;
  city: string;
  state: string;
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  creditTier: "PREPAID" | "EMI" | "FULLCREDIT" | null;
  createdAt: string;
}

export default function BuyersPage() {
  const [buyers, setBuyers] = useState<BuyerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchBuyers = async () => {
      setLoading(true);
      try {
        const data = await getSellerBuyers(page, 20);
        if (data?.data) {
          setBuyers(data.data);
          setTotalPages(data.totalPages || 1);
        }
      } catch (error: any) {
        toast.error("Failed to load buyers");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchBuyers();
  }, [page]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
      case "PENDING":
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400";
      case "REJECTED":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return <CheckCircle2 className="h-4 w-4" />;
      case "PENDING":
        return <Clock className="h-4 w-4" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Buyers</h1>
            </div>
            <p className="text-muted-foreground">Manage and onboard buyers for your pharmacy business.</p>
          </div>
          <Link href="/buyers/onboard">
            <Button size="lg" rightIcon={<Plus className="h-4 w-4" />}>
              Onboard Buyer
            </Button>
          </Link>
        </div>

        {/* Empty State */}
        {!loading && buyers.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-12 text-center"
          >
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Buyers Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Start by onboarding your first buyer. Click the button above to get started.
            </p>
            <Link href="/buyers/onboard">
              <Button size="lg">Onboard Your First Buyer</Button>
            </Link>
          </motion.div>
        )}

        {/* Buyers Table */}
        {!loading && buyers.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      Buyer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      Tier
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {buyers.map((buyer, idx) => (
                    <motion.tr
                      key={buyer.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="font-semibold text-foreground">{buyer.name}</p>
                          <p className="text-xs text-muted-foreground">{buyer.legalName}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="text-foreground">{buyer.phone}</p>
                          {buyer.email && <p className="text-xs text-muted-foreground">{buyer.email}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-1 text-foreground">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>
                            {buyer.city}, {buyer.state.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Badge className={`flex items-center gap-1.5 w-fit ${getStatusColor(buyer.verificationStatus)}`}>
                          {getStatusIcon(buyer.verificationStatus)}
                          {buyer.verificationStatus}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {buyer.creditTier ? (
                          <Badge className="capitalize">
                            {buyer.creditTier.toLowerCase()}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" rightIcon={<Eye className="h-3.5 w-3.5" />}>
                          View
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-border/50 px-6 py-4 flex items-center justify-between bg-muted/20">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
