import type { Metadata } from 'next';
import './globals.css';
import { siteConfig } from '@/lib/config';

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased">
        <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
