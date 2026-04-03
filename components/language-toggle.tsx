"use client";

import { Languages } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";
import type { Locale } from "@/lib/i18n";

export function LanguageToggle() {
  const { locale, setLocale, messages } = useI18n();

  const nextLocale: Locale = locale === "en" ? "es" : "en";

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLocale(nextLocale)}
      aria-label={messages.language.switchLabel}
      className="gap-2 rounded-full"
    >
      <Languages className="h-4 w-4" />
      <span>{locale === "en" ? messages.language.spanish : messages.language.english}</span>
    </Button>
  );
}
