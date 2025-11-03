import type { Metadata } from 'next';

import Providers from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';

import './globals.css';

export const metadata: Metadata = {
  title: 'MedBookings - Healthcare Appointment Management Platform',
  description:
    'Professional healthcare appointment management system for South African medical providers. POPIA-compliant booking platform with calendar integration, availability management, and patient scheduling.',
  keywords: [
    'medical appointments',
    'healthcare scheduling',
    'South Africa',
    'POPIA compliant',
    'medical practice management',
    'patient booking',
  ],
  authors: [{ name: 'MedBookings' }],
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    title: 'MedBookings - Healthcare Appointment Management',
    description:
      'Professional appointment management platform for South African healthcare providers',
    siteName: 'MedBookings',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <link
        rel="icon"
        href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📅</text></svg>"
      />
      <body className="antialiased">
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
