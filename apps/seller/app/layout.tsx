import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import "../styles/globals.css";
import { Providers } from "@/components/providers";
import { SellerGuard } from "@/components/layout/seller-guard";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "PharmaBag Seller Portal", template: "%s | PharmaBag Seller" },
  description: "Manage your pharma products, orders, inventory, and payouts on PharmaBag.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <Providers>
            <SellerGuard>
              {children}
            </SellerGuard>
            <Toaster position="top-right" toastOptions={{ style: { background: "hsl(var(--card))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "14px" } }} />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
