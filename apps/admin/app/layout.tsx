import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import "../styles/globals.css";
import { Providers } from "@/components/providers";
import { AdminGuard } from "@/components/layout/admin-guard";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "PharmaBag Admin", template: "%s | Admin" },
  description: "PharmaBag platform administration dashboard.",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <Providers>
            <AdminGuard>
              {children}
            </AdminGuard>
            <Toaster position="top-right" toastOptions={{ style: { background: "hsl(var(--card))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "14px" } }} />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
