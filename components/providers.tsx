"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useState } from "react";

import { I18nProvider } from "@/components/i18n-provider";
import type { Locale } from "@/lib/i18n";

export function Providers({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: Locale;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 30,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <I18nProvider initialLocale={locale}>
      <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </NextThemesProvider>
    </I18nProvider>
  );
}
