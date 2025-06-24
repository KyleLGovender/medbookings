import GeneralLayout from '@/components/layout/general-layout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <GeneralLayout>{children}</GeneralLayout>;
}
