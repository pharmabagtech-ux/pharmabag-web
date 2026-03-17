import type { Metadata } from 'next';
import { Open_Sans } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from './providers';

const openSans = Open_Sans({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PharmaBag - Buyer',
  description: 'PharmaBag buyer marketplace for pharmaceutical products',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={openSans.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
