"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import { CountryCard } from "@/components/country-card";
import { Input } from "@/components/ui/input";
import type { CountrySummary } from "@/lib/types";

export function RegionCountryBrowser({
  countries,
  regionName,
}: {
  countries: CountrySummary[];
  regionName: string;
}) {
  const [query, setQuery] = useState("");
  const { locale } = useI18n();

  const filteredCountries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return countries;

    return countries.filter((country) =>
      [country.name, country.iso3, country.subregion, country.capital]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [countries, query]);

  const copy =
    locale === "es"
      ? {
          label: `Buscar dentro de ${regionName}`,
          placeholder: `Buscar paises en ${regionName}`,
          showing: `Mostrando ${filteredCountries.length} de ${countries.length} paises en ${regionName}.`,
          capital: "Capital",
          population: "Poblacion",
          populationUnavailable: "Poblacion no disponible",
          empty: `No hubo paises que coincidan con esa busqueda en ${regionName}. Proba con un pais, capital o codigo ISO.`,
        }
      : {
          label: `Search within ${regionName}`,
          placeholder: `Search countries in ${regionName}`,
          showing: `Showing ${filteredCountries.length} of ${countries.length} countries in ${regionName}.`,
          capital: "Capital",
          population: "Population",
          populationUnavailable: "Population unavailable",
          empty: `No countries matched that search in ${regionName}. Try a country name, capital, or ISO code.`,
        };

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-border bg-card p-4 shadow-panel">
        <label htmlFor="region-country-search" className="text-sm font-medium text-foreground">
          {copy.label}
        </label>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="region-country-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.placeholder}
            className="pl-11"
          />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{copy.showing}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredCountries.map((country) => (
          <CountryCard
            key={country.iso3}
            country={country}
            labels={{
              capital: copy.capital,
              population: copy.population,
              populationUnavailable: copy.populationUnavailable,
            }}
          />
        ))}
      </div>

      {filteredCountries.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-border bg-card/60 p-6 text-sm text-muted-foreground">
          {copy.empty}
        </div>
      ) : null}
    </div>
  );
}
