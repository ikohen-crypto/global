"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { useI18n } from "@/components/i18n-provider";
import { NewsCard } from "@/components/news-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTopicLabel } from "@/lib/news/rss";
import { storage } from "@/lib/storage";
import type { NewsItem, NewsSignalType, NewsSourceId, NewsTopic } from "@/lib/types";

const signalLabels = {
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
} satisfies Record<"en" | "es", Record<NewsSignalType, string>>;

function ToggleChips({
  items,
  activeItems,
  onToggle,
  renderLabel,
}: {
  items: string[];
  activeItems: string[];
  onToggle: (value: string) => void;
  renderLabel: (value: string) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = activeItems.includes(item);
        return (
          <button
            key={item}
            type="button"
            onClick={() => onToggle(item)}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              active
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            {renderLabel(item)}
          </button>
        );
      })}
    </div>
  );
}

export function NewsWatchlistDashboard({
  items,
  sourceLabels,
}: {
  items: NewsItem[];
  sourceLabels: Record<NewsSourceId, string>;
}) {
  const { locale } = useI18n();
  const [topics, setTopics] = useState<string[]>([]);
  const [signals, setSignals] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [recentNews, setRecentNews] = useState<string[]>([]);

  useEffect(() => {
    setTopics(storage.getFavoriteNewsTopics());
    setSignals(storage.getFavoriteNewsSignals());
    setSources(storage.getFavoriteNewsSources());
    setRecentNews(storage.getRecentNews());
  }, []);

  const copy = {
    en: {
      title: "News watchlist",
      body: "Build a macro-news watchlist around the topics, signals, and sources that matter most to your investing process.",
      topics: "Topics to track",
      signals: "Signals to track",
      sources: "Sources to track",
      matches: "Watchlist matches",
      recent: "Recently opened stories",
      emptyMatches: "Your watchlist does not match any live stories yet. Add a topic, signal, or source to begin.",
      emptyRecent: "Open stories from the news hub and they will appear here for quick follow-up.",
    },
    es: {
      title: "Watchlist de noticias",
      body: "Arma una watchlist macro de noticias alrededor de los temas, senales y fuentes que mas importan para tu proceso de inversion.",
      topics: "Temas a seguir",
      signals: "Senales a seguir",
      sources: "Fuentes a seguir",
      matches: "Coincidencias de la watchlist",
      recent: "Historias abiertas recientemente",
      emptyMatches: "Tu watchlist todavia no coincide con historias en vivo. Agrega un tema, senal o fuente para empezar.",
      emptyRecent: "Abri historias desde la seccion Noticias y van a aparecer aca para seguirlas rapido.",
    },
  }[locale];

  const availableTopics = useMemo(
    () => Array.from(new Set(items.flatMap((item) => item.topics))) as NewsTopic[],
    [items],
  );
  const availableSignals = useMemo(
    () => Array.from(new Set(items.map((item) => item.signalType))) as NewsSignalType[],
    [items],
  );
  const availableSources = useMemo(
    () => Array.from(new Set(items.map((item) => item.sourceId))) as NewsSourceId[],
    [items],
  );

  const watchlistMatches = useMemo(() => {
    if (topics.length === 0 && signals.length === 0 && sources.length === 0) {
      return [] as NewsItem[];
    }

    return items
      .filter((item) => {
        const topicMatch = topics.length === 0 || item.topics.some((topic) => topics.includes(topic));
        const signalMatch = signals.length === 0 || signals.includes(item.signalType);
        const sourceMatch = sources.length === 0 || sources.includes(item.sourceId);
        return topicMatch && signalMatch && sourceMatch;
      })
      .slice(0, 6);
  }, [items, signals, sources, topics]);

  const recentItems = useMemo(
    () =>
      recentNews
        .map((id) => items.find((item) => item.id === id))
        .filter((item): item is NewsItem => Boolean(item))
        .slice(0, 4),
    [items, recentNews],
  );

  const toggleTopic = (topic: string) => setTopics(storage.toggleFavoriteNewsTopic(topic));
  const toggleSignal = (signal: string) => setSignals(storage.toggleFavoriteNewsSignal(signal));
  const toggleSource = (sourceId: string) => setSources(storage.toggleFavoriteNewsSource(sourceId));

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h2 className="font-display text-2xl font-semibold">{copy.title}</h2>
          <p className="mt-2 text-muted-foreground">{copy.body}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{copy.topics}</CardTitle>
          </CardHeader>
          <CardContent>
            <ToggleChips
              items={availableTopics}
              activeItems={topics}
              onToggle={toggleTopic}
              renderLabel={(value) => getTopicLabel(value as NewsTopic, locale)}
            />
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{copy.signals}</CardTitle>
            </CardHeader>
            <CardContent>
              <ToggleChips
                items={availableSignals}
                activeItems={signals}
                onToggle={toggleSignal}
                renderLabel={(value) => signalLabels[locale][value as NewsSignalType]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{copy.sources}</CardTitle>
            </CardHeader>
            <CardContent>
              <ToggleChips
                items={availableSources}
                activeItems={sources}
                onToggle={toggleSource}
                renderLabel={(value) => sourceLabels[value as NewsSourceId]}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-2xl font-semibold">{copy.matches}</h3>
        {watchlistMatches.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {watchlistMatches.map((item) => (
              <NewsCard key={item.id} item={item} locale={locale} />
            ))}
          </div>
        ) : (
          <EmptyState title={copy.matches} description={copy.emptyMatches} />
        )}
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-2xl font-semibold">{copy.recent}</h3>
        {recentItems.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {recentItems.map((item) => (
              <NewsCard key={item.id} item={item} locale={locale} />
            ))}
          </div>
        ) : (
          <EmptyState title={copy.recent} description={copy.emptyRecent} />
        )}
        <Link href="/news" className="inline-flex text-sm font-medium text-primary">
          {locale === "es" ? "Ir a Noticias" : "Go to the news hub"}
        </Link>
      </section>
    </div>
  );
}
