"use client";

import { z } from "zod";

type StorageKey =
  | "favorites:countries"
  | "favorites:comparisons"
  | "favorites:news-topics"
  | "favorites:news-signals"
  | "favorites:news-sources"
  | "history:recent-countries"
  | "history:recent-searches"
  | "history:recent-comparisons"
  | "history:recent-news"
  | "preferences:theme"
  | "preferences:locale";

const schemas = {
  "favorites:countries": z.array(z.string()),
  "favorites:comparisons": z.array(z.string()),
  "favorites:news-topics": z.array(z.string()),
  "favorites:news-signals": z.array(z.string()),
  "favorites:news-sources": z.array(z.string()),
  "history:recent-countries": z.array(z.string()),
  "history:recent-searches": z.array(z.string()),
  "history:recent-comparisons": z.array(z.string()),
  "history:recent-news": z.array(z.string()),
  "preferences:theme": z.enum(["light", "dark", "system"]),
  "preferences:locale": z.enum(["en", "es"]),
} satisfies Record<StorageKey, z.ZodTypeAny>;

function readKey<T>(key: StorageKey, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(`globalecon:${key}`);
    if (!raw) return fallback;
    const parsed = schemas[key].safeParse(JSON.parse(raw));
    return parsed.success ? (parsed.data as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeKey(key: StorageKey, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`globalecon:${key}`, JSON.stringify(value));
}

function pushUnique(values: string[], nextValue: string, limit = 8) {
  return [nextValue, ...values.filter((item) => item !== nextValue)].slice(0, limit);
}

export const storage = {
  getFavoriteCountries: () => readKey("favorites:countries", [] as string[]),
  toggleFavoriteCountry: (iso3: string) => {
    const current = readKey("favorites:countries", [] as string[]);
    const next = current.includes(iso3)
      ? current.filter((item) => item !== iso3)
      : [...current, iso3];
    writeKey("favorites:countries", next);
    return next;
  },
  getFavoriteComparisons: () => readKey("favorites:comparisons", [] as string[]),
  toggleFavoriteComparison: (slug: string) => {
    const current = readKey("favorites:comparisons", [] as string[]);
    const next = current.includes(slug)
      ? current.filter((item) => item !== slug)
      : [...current, slug];
    writeKey("favorites:comparisons", next);
    return next;
  },
  getFavoriteNewsTopics: () => readKey("favorites:news-topics", [] as string[]),
  toggleFavoriteNewsTopic: (topic: string) => {
    const current = readKey("favorites:news-topics", [] as string[]);
    const next = current.includes(topic)
      ? current.filter((item) => item !== topic)
      : [...current, topic];
    writeKey("favorites:news-topics", next);
    return next;
  },
  getFavoriteNewsSignals: () => readKey("favorites:news-signals", [] as string[]),
  toggleFavoriteNewsSignal: (signal: string) => {
    const current = readKey("favorites:news-signals", [] as string[]);
    const next = current.includes(signal)
      ? current.filter((item) => item !== signal)
      : [...current, signal];
    writeKey("favorites:news-signals", next);
    return next;
  },
  getFavoriteNewsSources: () => readKey("favorites:news-sources", [] as string[]),
  toggleFavoriteNewsSource: (sourceId: string) => {
    const current = readKey("favorites:news-sources", [] as string[]);
    const next = current.includes(sourceId)
      ? current.filter((item) => item !== sourceId)
      : [...current, sourceId];
    writeKey("favorites:news-sources", next);
    return next;
  },
  getRecentSearches: () => readKey("history:recent-searches", [] as string[]),
  getRecentCountries: () => readKey("history:recent-countries", [] as string[]),
  addRecentCountry: (slug: string) => {
    const next = pushUnique(readKey("history:recent-countries", [] as string[]), slug);
    writeKey("history:recent-countries", next);
    return next;
  },
  addRecentSearch: (query: string) => {
    const next = pushUnique(readKey("history:recent-searches", [] as string[]), query);
    writeKey("history:recent-searches", next);
    return next;
  },
  getRecentComparisons: () => readKey("history:recent-comparisons", [] as string[]),
  addRecentComparison: (slug: string) => {
    const next = pushUnique(readKey("history:recent-comparisons", [] as string[]), slug);
    writeKey("history:recent-comparisons", next);
    return next;
  },
  getRecentNews: () => readKey("history:recent-news", [] as string[]),
  addRecentNews: (id: string) => {
    const next = pushUnique(readKey("history:recent-news", [] as string[]), id, 12);
    writeKey("history:recent-news", next);
    return next;
  },
  getThemePreference: () => readKey("preferences:theme", "system" as const),
  setThemePreference: (theme: "light" | "dark" | "system") => writeKey("preferences:theme", theme),
  getLocalePreference: () => readKey("preferences:locale", "en" as const),
  setLocalePreference: (locale: "en" | "es") => writeKey("preferences:locale", locale),
};
