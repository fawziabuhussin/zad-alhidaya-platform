import type { Metadata } from 'next';
import { Cairo, Noto_Sans_Arabic } from 'next/font/google';
import { Toaster } from 'sonner';
import OfflineIndicator from '@/components/OfflineIndicator';
import './globals.css';

// Optimized font loading with next/font
const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-cairo',
});

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-noto',
});

export const metadata: Metadata = {
  title: 'زاد الهداية | Zad Al-Hidaya Academy',
  description: 'منصة تعليمية إلكترونية للعلوم الشرعية',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${notoSansArabic.variable}`}>
      <body className="bg-[#fdfbf7] font-arabic">
        {children}
        <Toaster 
          position="top-center" 
          dir="rtl"
          richColors
          closeButton
          toastOptions={{
            style: {
              fontFamily: 'inherit',
            },
            classNames: {
              toast: 'rtl',
              title: 'text-right',
              description: 'text-right',
            },
          }}
        />
        <OfflineIndicator />
      </body>
    </html>
  );
}
