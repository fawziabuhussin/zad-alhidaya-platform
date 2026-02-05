import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import OfflineIndicator from '@/components/OfflineIndicator';
import './globals.css';

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
    <html lang="ar" dir="rtl">
      <body className="bg-[#fdfbf7]">
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
