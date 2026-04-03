"use client";

import Link from "next/link";

import { useI18n } from "@/components/i18n-provider";

export function Footer() {
  const { messages, locale } = useI18n();

  const exploreTitle = locale === "es" ? "Explorar" : "Explore";

  const footerColumns = {
    [messages.footer.product]: [
      { href: "/compare", label: messages.footer.compare },
      { href: "/rankings/financial/macro-stability", label: messages.footer.rankings },
      { href: "/countries", label: messages.footer.countries },
      { href: "/news", label: locale === "es" ? "Noticias" : "News" },
    ],
    [exploreTitle]: [
      { href: "/learn", label: messages.footer.insights },
      { href: "/regions", label: messages.footer.regions },
      { href: "/rankings/financial/growth-vs-inflation", label: messages.footer.marketRankings },
    ],
    [messages.footer.workflows]: [
      { href: "/favorites", label: messages.footer.favorites },
      { href: "/countries", label: messages.footer.marketProfiles },
      { href: "/compare", label: messages.footer.quickBenchmark },
    ],
  };

  return (
    <footer
      className="mt-12 border-t border-border/70 bg-card/50 notranslate lg:mt-16"
      translate="no"
      suppressHydrationWarning
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:px-8 lg:py-16">
        <div className="space-y-4">
          <div className="font-display text-2xl font-semibold">GlobalEcon</div>
          <p className="max-w-md text-sm text-muted-foreground">{messages.footer.summary}</p>
          <p className="text-xs text-muted-foreground">{messages.footer.sources}</p>
        </div>
        {Object.entries(footerColumns).map(([title, links]) => (
          <div key={title}>
            <h3 className="mb-4 text-sm font-semibold">{title}</h3>
            <div className="space-y-3">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-muted-foreground transition hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </footer>
  );
}
