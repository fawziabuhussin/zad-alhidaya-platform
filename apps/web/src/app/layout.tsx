import type { Metadata } from 'next';
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
      <body>
        {children}
      </body>
    </html>
  );
}
