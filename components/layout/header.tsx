"use client";

import Link from "next/link";
import { Menu, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import { LanguageToggle } from "@/components/language-toggle";
import { Button } from "@/components/ui/button";
import { SearchCommand } from "@/components/search-command";
import { cn } from "@/lib/utils";
import type { CountrySummary } from "@/lib/types";

export function Header({ countries }: { countries: CountrySummary[] }) {
  const { resolvedTheme, setTheme } = useTheme();
  const { messages, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const navItems = [
    { href: "/compare", label: messages.nav.compare },
    { href: "/countries", label: messages.nav.countries },
    { href: "/rankings/financial", label: messages.nav.rankings },
    { href: "/news", label: locale === "es" ? "Noticias" : "News" },
    { href: "/regions", label: messages.nav.regions },
    { href: "/learn", label: messages.nav.insights },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header
      translate="no"
      suppressHydrationWarning
      className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:gap-6 lg:px-8">
        <div className="min-w-0 shrink-0 lg:w-[14rem] xl:w-[18rem]">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
            <span className="font-display text-lg font-semibold">GE</span>
          </div>
          <div className="min-w-0 overflow-hidden">
            <div className="truncate font-display text-lg font-semibold">GlobalEcon</div>
            <div className="hidden overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-foreground xl:block">
              {messages.nav.subtitle}
            </div>
          </div>
        </Link>
        </div>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className="rounded-full px-4 py-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex min-w-0 shrink-0 items-center justify-end gap-2 lg:ml-0 lg:w-[22rem] lg:gap-3">
          <SearchCommand
            triggerClassName="hidden h-10 min-w-0 flex-1 sm:flex sm:max-w-[18rem] sm:shrink"
            countries={countries}
          />
          <LanguageToggle className="shrink-0" />
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            aria-label={messages.nav.themeToggle}
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            {mounted ? (
              resolvedTheme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )
            ) : (
              <div className="h-4 w-4 rounded-full bg-current opacity-40" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
            aria-label={messages.nav.menuToggle}
            onClick={() => setOpen((current) => !current)}
          >
            {open ? <Search className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className={cn("border-t border-border/70 px-4 py-4 lg:hidden", open ? "block" : "hidden")}>
        <div className="mx-auto flex max-w-7xl flex-col gap-2">
          <SearchCommand triggerClassName="w-full justify-start" countries={countries} />
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className="rounded-2xl border border-border bg-card px-4 py-3 text-sm"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
