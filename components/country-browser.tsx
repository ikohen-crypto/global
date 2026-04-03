"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import { CountryCard } from "@/components/country-card";
import { Input } from "@/components/ui/input";
import type { CountrySummary } from "@/lib/types";

export function CountryBrowser({ countries }: { countries: CountrySummary[] }) {
  const [query, setQuery] = useState("");
  const { messages } = useI18n();

  const filteredCountries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return countries;

    return countries.filter((country) =>
      [country.name, country.iso3, country.region, country.subregion, country.capital]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [countries, query]);

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-border bg-card p-4 shadow-panel">
        <label htmlFor="country-browser-search" className="text-sm font-medium text-foreground">
          {messages.countriesPage.searchLabel}
        </label>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="country-browser-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={messages.countriesPage.searchPlaceholder}
            className="pl-11"
          />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {filteredCountries.length} {messages.countriesPage.available}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredCountries.map((country) => (
          <CountryCard
            key={country.iso3}
            country={country}
            labels={{
              capital: messages.countriesPage.capital,
              population: messages.countriesPage.population,
              populationUnavailable: messages.countriesPage.populationUnavailable,
            }}
          />
        ))}
      </div>

      {filteredCountries.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-border bg-card/60 p-6 text-sm text-muted-foreground">
          {messages.countriesPage.empty}
        </div>
      ) : null}
    </div>
  );
}
