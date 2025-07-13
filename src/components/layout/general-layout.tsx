import { Suspense } from 'react';

import Footer from '@/components/footer';
import Header from '@/components/header';

interface GeneralLayoutProps {
  children: React.ReactNode;
}

export default function GeneralLayout({ children }: GeneralLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background pt-16">
        <Suspense>{children}</Suspense>
      </main>
      <Footer />
    </div>
  );
}
