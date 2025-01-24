"use client";

import { useState } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <div className="flex h-full w-full flex-col">
          <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
          >
            {children}
          </NextThemesProvider>
        </div>
      </SessionProvider>
    </QueryClientProvider>
  );
}
