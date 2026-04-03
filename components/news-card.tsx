"use client";

import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildNewsInvestorLens,
  getIndicatorLabels,
  getLocalizedNewsNarrativeSafe,
  getLocalizedNewsSourceLabelSafe,
  getLocalizedNewsSummarySafe,
  getLocalizedNewsTitleSafe,
  getRegionLabelsForNews,
  getTopicLabel,
} from "@/lib/news/rss";
import type { Locale } from "@/lib/i18n";
import { storage } from "@/lib/storage";
import { toKebabCase } from "@/lib/utils";
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
  const sourceLabel = getLocalizedNewsSourceLabelSafe(item.sourceId, locale);

  const indicatorLabels = getIndicatorLabels(item.relatedIndicators).slice(0, 2);
  const regions = getRegionLabelsForNews(item).slice(0, 1);
  const countries = item.relatedCountries.slice(0, 2);
  const redundantTopicBySignal: Partial<Record<NewsItem["signalType"], NewsItem["topics"][number]>> = {
    "crypto-liquidity": "crypto",
    "inflation-pressure": "inflation",
    "central-bank-shift": "central-banks",
    "currency-stress": "forex",
    "debt-risk": "debt",
    "growth-slowdown": "growth",
    "growth-improvement": "growth",
  };

  const topics = item.topics
    .filter((topic) => topic !== redundantTopicBySignal[item.signalType])
    .slice(0, 2);

  return (
    <Card className="h-full">
      <CardHeader className="space-y-2 pb-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-border px-2 py-0.5">{sourceLabel}</span>
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3 w-3" />
            {formatDate(item.publishedAt, locale)}
          </span>
        </div>
        <CardTitle className="text-lg leading-snug">{localizedTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {locale === "es" ? "Resumen: " : "Summary: "}
          {localizedSummary}
        </p>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            {copy.signalLabel}
          </span>
          {topics.map((topic) => (
            <Link
              key={topic}
              href={`/news/topic/${topic}`}
              className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
            >
              {getTopicLabel(topic, locale)}
            </Link>
          ))}
        </div>

        {(countries.length > 0 || indicatorLabels.length > 0 || regions.length > 0) ? (
          <div className="flex flex-wrap gap-2">
            {countries.map((country) => (
              <Link
                key={country.iso3}
                href={`/news/country/${country.slug}`}
                className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                {country.name}
              </Link>
            ))}
            {regions.map((region) => (
              <Link
                key={region}
                href={`/region/${toKebabCase(region)}`}
                className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                {region}
              </Link>
            ))}
            {indicatorLabels.map((indicator) => (
              <Link
                key={indicator.id}
                href={`/indicator/${toKebabCase(indicator.id)}`}
                className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                {indicator.label}
              </Link>
            ))}
          </div>
        ) : null}

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
