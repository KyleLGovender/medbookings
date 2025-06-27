import { Suspense } from 'react';

import Footer from '@/components/footer';
import Header from '@/components/header';

interface GeneralLayoutProps {
  children: React.ReactNode;
}

export default function GeneralLayout({ children }: GeneralLayoutProps) {
  return (
    <>
      <Header />
      <main className="flex-1 bg-background pt-16">
        <Suspense>{children}</Suspense>
      </main>
      <Footer />
    </>
  );
}
