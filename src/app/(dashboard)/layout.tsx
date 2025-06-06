import { ReactNode } from 'react';

import Section from '@/components/section';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <Section className="bg-background py-16 dark:bg-background">{children}</Section>;
}
