"use client";

import { Languages } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale, messages } = useI18n();

  const nextLocale: Locale = locale === "en" ? "es" : "en";

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLocale(nextLocale)}
      aria-label={messages.language.switchLabel}
      className={cn("gap-2 rounded-full whitespace-nowrap px-3 text-sm", className)}
    >
      <Languages className="h-4 w-4 shrink-0" />
      <span className="truncate">{locale === "en" ? messages.language.spanish : messages.language.english}</span>
    </Button>
  );
}
