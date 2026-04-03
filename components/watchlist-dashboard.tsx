"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { useI18n } from "@/components/i18n-provider";
import { storage } from "@/lib/storage";
import type { CountrySummary } from "@/lib/types";

export function WatchlistDashboard({ countries }: { countries: CountrySummary[] }) {
  const { messages, locale } = useI18n();
  const [countryFavorites, setCountryFavorites] = useState<string[]>([]);
  const [comparisonFavorites, setComparisonFavorites] = useState<string[]>([]);
  const [recentCountries, setRecentCountries] = useState<string[]>([]);
  const [recentComparisons, setRecentComparisons] = useState<string[]>([]);

  useEffect(() => {
    setCountryFavorites(storage.getFavoriteCountries());
    setComparisonFavorites(storage.getFavoriteComparisons());
    setRecentCountries(storage.getRecentCountries());
    setRecentComparisons(storage.getRecentComparisons());
  }, []);

  const byIso = useMemo(
    () => new Map(countries.map((country) => [country.iso3, country])),
    [countries],
  );
  const bySlug = useMemo(
    () => new Map(countries.map((country) => [country.slug, country])),
    [countries],
  );

  const favoriteCountryCards = countryFavorites
    .map((iso3) => byIso.get(iso3))
    .filter((country): country is CountrySummary => Boolean(country));
  const recentCountryCards = recentCountries
    .map((slug) => bySlug.get(slug))
    .filter((country): country is CountrySummary => Boolean(country))
    .filter((country, index, all) => all.findIndex((item) => item.slug === country.slug) === index);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold">{messages.favoritesPage.countries}</h2>
        {favoriteCountryCards.length === 0 ? (
          <EmptyState
            title={messages.favoritesPage.emptyCountriesTitle}
            description={messages.favoritesPage.emptyCountriesBody}
          />
        ) : (
          favoriteCountryCards.map((country) => (
            <Link
              key={country.iso3}
              href={`/country/${country.slug}`}
              className="block rounded-2xl border border-border px-4 py-3 text-sm transition hover:border-primary/40"
            >
              <div className="font-medium">{country.name}</div>
              <p className="mt-1 text-muted-foreground">
                {country.region} · {country.capital}
              </p>
            </Link>
          ))
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold">{messages.favoritesPage.comparisons}</h2>
        {comparisonFavorites.length === 0 ? (
          <EmptyState
            title={messages.favoritesPage.emptyComparisonsTitle}
            description={messages.favoritesPage.emptyComparisonsBody}
          />
        ) : (
          comparisonFavorites.map((slug) => (
            <Link
              key={slug}
              href={`/compare/${slug}`}
              className="block rounded-2xl border border-border px-4 py-3 text-sm text-primary transition hover:border-primary/40"
            >
              {slug.replaceAll("-vs-", " vs ").replaceAll("-", " ")}
            </Link>
          ))
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold">
          {locale === "es" ? "Paises recientes" : "Recent countries"}
        </h2>
        {recentCountryCards.length === 0 ? (
          <EmptyState
            title={locale === "es" ? "Todavia no hay paises recientes" : "No recent countries yet"}
            description={
              locale === "es"
                ? "Abri perfiles de pais para que aparezcan aqui como acceso rapido."
                : "Open country profiles and they will appear here for quick access."
            }
          />
        ) : (
          recentCountryCards.map((country) => (
            <Link
              key={country.slug}
              href={`/country/${country.slug}`}
              className="block rounded-2xl border border-border px-4 py-3 text-sm transition hover:border-primary/40"
            >
              <div className="font-medium">{country.name}</div>
              <p className="mt-1 text-muted-foreground">{country.region}</p>
            </Link>
          ))
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold">
          {locale === "es" ? "Comparaciones recientes" : "Recent comparisons"}
        </h2>
        {recentComparisons.length === 0 ? (
          <EmptyState
            title={locale === "es" ? "Todavia no hay comparaciones recientes" : "No recent comparisons yet"}
            description={
              locale === "es"
                ? "Usa una pagina de comparacion y se guardara aqui automaticamente."
                : "Use a comparison page and it will appear here automatically."
            }
          />
        ) : (
          recentComparisons.map((slug) => (
            <Link
              key={slug}
              href={`/compare/${slug}`}
              className="block rounded-2xl border border-border px-4 py-3 text-sm transition hover:border-primary/40"
            >
              {slug.replaceAll("-vs-", " vs ").replaceAll("-", " ")}
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
