'use client';

import { useRouter } from 'next/navigation';

import { NextUIProvider } from '@nextui-org/react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export default function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <SessionProvider>
      {/* @ts-expect-error */}
      <NextUIProvider navigate={router.push} className="flex h-full w-full flex-col">
        <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </NextThemesProvider>
      </NextUIProvider>
    </SessionProvider>
  );
}
