"use client";

import { useMemo, useState } from "react";

import { NewsCard } from "@/components/news-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTopicLabel } from "@/lib/news/rss";
import type { Locale } from "@/lib/i18n";
import type { NewsImportance, NewsItem, NewsSignalType, NewsSourceId, NewsTopic } from "@/lib/types";

const signalLabels: Record<Locale, Record<NewsSignalType, string>> = {
  en: {
    "inflation-pressure": "Inflation pressure",
    "central-bank-shift": "Central-bank shift",
    "currency-stress": "Currency stress",
    "debt-risk": "Debt risk",
    "growth-slowdown": "Growth slowdown",
    "growth-improvement": "Growth improvement",
    "crypto-liquidity": "Crypto liquidity",
  },
  es: {
    "inflation-pressure": "Presion inflacionaria",
    "central-bank-shift": "Cambio de banco central",
    "currency-stress": "Estres cambiario",
    "debt-risk": "Riesgo de deuda",
    "growth-slowdown": "Desaceleracion del crecimiento",
    "growth-improvement": "Mejora del crecimiento",
    "crypto-liquidity": "Liquidez crypto",
  },
};

const importanceLabels: Record<Locale, Record<NewsImportance, string>> = {
  en: {
    high: "High impact",
    medium: "Medium impact",
    low: "Low impact",
  },
  es: {
    high: "Impacto alto",
    medium: "Impacto medio",
    low: "Impacto bajo",
  },
};

export function NewsExplorer({
  items,
  locale,
  sourceLabels,
}: {
  items: NewsItem[];
  locale: Locale;
  sourceLabels: Record<NewsSourceId, string>;
}) {
  const bucketForExplorer = (item: NewsItem) => `${item.signalType}:${item.sourceId}:${item.topics[0] ?? "general"}`;

  const copy = {
    en: {
      title: "Explore all stories",
      body: "Filter by keyword, source, signal, and impact to find the stories that matter most for your investment workflow.",
      search: "Search headlines, summaries, countries, or indicators",
      source: "Source",
      signal: "Signal",
      importance: "Impact",
      topic: "Topic",
      allSources: "All sources",
      allSignals: "All signals",
      allImpact: "All impact levels",
      allTopics: "All topics",
      matches: "stories match your filters.",
      empty: "No stories matched the current filter set. Try a broader keyword or reset one of the filters.",
    },
    es: {
      title: "Explora todas las noticias",
      body: "Filtra por palabra clave, fuente, senal e impacto para encontrar las historias que mas importan para tu proceso de inversion.",
      search: "Buscar en titulares, resúmenes, paises o indicadores",
      source: "Fuente",
      signal: "Senal",
      importance: "Impacto",
      topic: "Tema",
      allSources: "Todas las fuentes",
      allSignals: "Todas las senales",
      allImpact: "Todos los niveles de impacto",
      allTopics: "Todos los temas",
      matches: "historias coinciden con tus filtros.",
      empty: "Ninguna historia coincide con los filtros actuales. Proba una palabra clave mas amplia o reinicia alguno de los filtros.",
    },
  }[locale];

  const [query, setQuery] = useState("");
  const [source, setSource] = useState<NewsSourceId | "all">("all");
  const [signal, setSignal] = useState<NewsSignalType | "all">("all");
  const [importance, setImportance] = useState<NewsImportance | "all">("all");
  const [topic, setTopic] = useState<NewsTopic | "all">("all");

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matching = items.filter((item) => {
      if (source !== "all" && item.sourceId !== source) return false;
      if (signal !== "all" && item.signalType !== signal) return false;
      if (importance !== "all" && item.importance !== importance) return false;
      if (topic !== "all" && !item.topics.includes(topic)) return false;

      if (!normalizedQuery) return true;

      const haystack = [
        item.title,
        item.summary,
        item.whatHappened,
        item.whyItMatters,
        item.watchNow,
        item.source,
        ...item.relatedCountries.map((country) => country.name),
        ...item.relatedIndicators,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });

    const seeded: NewsItem[] = [];
    const seenBuckets = new Set<string>();

    for (const item of matching) {
      const bucket = bucketForExplorer(item);
      if (seenBuckets.has(bucket)) continue;
      seeded.push(item);
      seenBuckets.add(bucket);
      if (seeded.length >= matching.length) break;
    }

    const perSource = new Map<NewsSourceId, number>();
    const selected: NewsItem[] = [];

    for (const item of [...seeded, ...matching]) {
      if (selected.some((selectedItem) => selectedItem.id === item.id)) continue;
      const sourceCount = perSource.get(item.sourceId) ?? 0;
      if (source === "all" && sourceCount >= 4) continue;
      selected.push(item);
      perSource.set(item.sourceId, sourceCount + 1);
    }

    return selected;
  }, [importance, items, query, signal, source, topic]);

  const availableTopics = useMemo(
    () =>
      Array.from(new Set(items.flatMap((item) => item.topics))).sort((left, right) =>
        getTopicLabel(left, locale).localeCompare(getTopicLabel(right, locale)),
      ),
    [items, locale],
  );

  const availableSources = useMemo(
    () => Array.from(new Set(items.map((item) => item.sourceId))),
    [items],
  );

  const availableSignals = useMemo(
    () => Array.from(new Set(items.map((item) => item.signalType))),
    [items],
  );

  const availableImportance = useMemo(
    () => Array.from(new Set(items.map((item) => item.importance))),
    [items],
  );

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-semibold">{copy.title}</h2>
        <p className="mt-2 text-muted-foreground">{copy.body}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{locale === "es" ? "Filtros avanzados" : "Advanced filters"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.search}
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary/50"
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">{copy.source}</span>
              <select
                value={source}
                onChange={(event) => setSource(event.target.value as NewsSourceId | "all")}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary/50"
              >
                <option value="all">{copy.allSources}</option>
                {availableSources.map((sourceId) => (
                  <option key={sourceId} value={sourceId}>
                    {sourceLabels[sourceId]}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">{copy.signal}</span>
              <select
                value={signal}
                onChange={(event) => setSignal(event.target.value as NewsSignalType | "all")}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary/50"
              >
                <option value="all">{copy.allSignals}</option>
                {availableSignals.map((signalId) => (
                  <option key={signalId} value={signalId}>
                    {signalLabels[locale][signalId]}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">{copy.importance}</span>
              <select
                value={importance}
                onChange={(event) => setImportance(event.target.value as NewsImportance | "all")}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary/50"
              >
                <option value="all">{copy.allImpact}</option>
                {availableImportance.map((level) => (
                  <option key={level} value={level}>
                    {importanceLabels[locale][level]}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">{copy.topic}</span>
              <select
                value={topic}
                onChange={(event) => setTopic(event.target.value as NewsTopic | "all")}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary/50"
              >
                <option value="all">{copy.allTopics}</option>
                {availableTopics.map((topicId) => (
                  <option key={topicId} value={topicId}>
                    {getTopicLabel(topicId, locale)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        {filteredItems.length} {copy.matches}
      </div>

      {filteredItems.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => (
            <NewsCard key={item.id} item={item} locale={locale} />
          ))}
        </div>
      ) : (
        <div className="rounded-[1.75rem] border border-dashed border-border bg-card/60 p-6 text-sm text-muted-foreground">
          {copy.empty}
        </div>
      )}
    </section>
  );
}
