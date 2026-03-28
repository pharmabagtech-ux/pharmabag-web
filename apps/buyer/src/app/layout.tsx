import type { Metadata } from 'next';
import { Open_Sans } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from './providers';
import Footer from '@/components/landing/Footer';

const openSans = Open_Sans({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PharmaBag - B2B Pharma Platform',
  description: 'India\'s Only Trusted B2B Pharma Platform for Wholesalers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html 
      lang="en"
      style={{
        backgroundImage: "url('/Pharma_ui.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      <body className={openSans.className}>
        <Providers>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <div style={{ flex: 1 }}>
              {children}
            </div>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
