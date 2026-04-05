"use client";

import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildNewsInvestorLens,
  getLocalizedNewsSourceLabelSafe,
  getLocalizedNewsSummarySafe,
  getLocalizedNewsTitleSafe,
  getLocalizedNewsNarrativeSafe,
} from "@/lib/news/rss";
import type { Locale } from "@/lib/i18n";
import { storage } from "@/lib/storage";
import type { NewsItem } from "@/lib/types";

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function NewsCard({ item, locale }: { item: NewsItem; locale: Locale }) {
  const copy = buildNewsInvestorLens(item, locale);
  const localizedTitle = getLocalizedNewsTitleSafe(item, locale);
  const localizedSummary = getLocalizedNewsSummarySafe(item, locale);
  const localizedNarrative = getLocalizedNewsNarrativeSafe(item, locale);
  const sourceLabel = getLocalizedNewsSourceLabelSafe(item.sourceId, locale);

  return (
    <Card className="h-full">
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-start justify-between gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3 w-3" />
            {formatDate(item.publishedAt, locale)}
          </span>
          <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-semibold text-foreground/80">
            {sourceLabel}
          </span>
        </div>
        <CardTitle className="text-lg leading-snug">{localizedTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <p className="text-sm leading-6 text-muted-foreground">
          {localizedSummary}
        </p>

        <div className="space-y-2 rounded-2xl border border-border/70 bg-muted/30 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
            {copy.why}
          </p>
          <p className="text-sm leading-6 text-foreground/85">{localizedNarrative.why}</p>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
            {copy.watch}
          </p>
          <p className="text-sm leading-6 text-foreground/85">{localizedNarrative.watch}</p>
        </div>

        <Link
          href={item.url}
          target="_blank"
          rel="noreferrer"
          onClick={() => storage.addRecentNews(item.id)}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary"
        >
          {copy.open}
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
