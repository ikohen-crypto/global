import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import Script from "next/script";

import { AppShell } from "@/components/layout/app-shell";
import { Providers } from "@/components/providers";
import { getServerLocale } from "@/lib/i18n/server";
import { buildMetadata } from "@/lib/seo";

import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = buildMetadata({
  title: "World economy dashboard, rankings, and country comparisons",
  description:
    "Compare GDP, inflation, growth, population, and sustainability metrics with clear charts, rankings, and country explainers.",
  path: "/",
});

metadata.metadataBase = new URL(
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3100",
);

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();

  return (
    <html lang={locale} translate="no" className="notranslate" suppressHydrationWarning>
      <head>
        <meta name="google" content="notranslate" />
        <meta httpEquiv="Content-Language" content={locale} />
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        <Script id="translator-guard" strategy="beforeInteractive">
          {`
            (() => {
              const selectors = [
                ".translate-tooltip-mtz",
                ".translator-hidden",
                "[class*='translate-tooltip']",
                "[class*='translator-hidden']"
              ];

              const cleanElement = (element) => {
                if (!(element instanceof HTMLElement)) return;
                if (!selectors.some((selector) => element.matches(selector))) return;

                element.setAttribute("hidden", "");
                element.setAttribute("aria-hidden", "true");
                element.style.display = "none";
                element.style.pointerEvents = "none";
              };

              const sweep = (root) => {
                if (!(root instanceof HTMLElement || root instanceof Document)) return;
                selectors.forEach((selector) => {
                  root.querySelectorAll(selector).forEach(cleanElement);
                });
              };

              const start = () => {
                sweep(document);

                const observer = new MutationObserver((mutations) => {
                  for (const mutation of mutations) {
                    mutation.addedNodes.forEach((node) => {
                      if (node instanceof HTMLElement) {
                        cleanElement(node);
                        sweep(node);
                      }
                    });
                  }
                });

                observer.observe(document.documentElement, {
                  subtree: true,
                  childList: true,
                });

                window.setTimeout(() => observer.disconnect(), 4000);
              };

              if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", start, { once: true });
              } else {
                start();
              }
            })();
          `}
        </Script>
      </head>
      <body
        translate="no"
        className={`${inter.variable} ${manrope.variable} font-sans notranslate`}
        suppressHydrationWarning
      >
        <Providers locale={locale}>
          <div className="notranslate" translate="no" suppressHydrationWarning>
            <AppShell>{children}</AppShell>
          </div>
        </Providers>
      </body>
    </html>
  );
}
