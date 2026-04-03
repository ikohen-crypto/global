"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";
import { trackEvent } from "@/lib/analytics";
import { buildCompareSlug } from "@/lib/compare/slugs";
import type { CountrySummary } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CompareBuilder({
  initialCountries = [],
  countries,
}: {
  initialCountries?: CountrySummary[];
  countries: CountrySummary[];
}) {
  const router = useRouter();
  const { messages } = useI18n();
  const [selected, setSelected] = useState<CountrySummary[]>(initialCountries);
  const [query, setQuery] = useState("");

  const suggestions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return [];

    return countries.filter(
      (country) =>
        !selected.some((item) => item.iso3 === country.iso3) &&
        [country.name, country.iso3, country.region, country.subregion]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
    );
  }, [countries, query, selected]);

  const visibleSuggestions = useMemo(() => suggestions.slice(0, 8), [suggestions]);
  const hasQuery = query.trim().length > 0;

  return (
    <div className="space-y-4 rounded-[2rem] border border-border bg-card p-5 shadow-panel">
      <div>
        <div className="text-sm font-medium text-muted-foreground">{messages.compareBuilder.eyebrow}</div>
        <h2 className="mt-1 font-display text-2xl font-semibold">{messages.compareBuilder.title}</h2>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={messages.compareBuilder.placeholder}
            className="pl-11"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {messages.compareBuilder.helper}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {selected.map((country) => (
          <button
            key={country.iso3}
            type="button"
            className="rounded-full bg-accent px-3 py-2 text-sm text-accent-foreground"
            onClick={() =>
              setSelected((current) => current.filter((item) => item.iso3 !== country.iso3))
            }
          >
            {country.name} x
          </button>
        ))}
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-border bg-background/50",
          !hasQuery && "border-dashed",
        )}
      >
        {hasQuery ? (
          visibleSuggestions.length > 0 ? (
            <div className="divide-y divide-border">
              {visibleSuggestions.map((country) => (
                <button
                  key={country.iso3}
                  type="button"
                  className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-accent/40"
                  onClick={() => {
                    if (selected.length >= 4) return;
                    setSelected((current) => [...current, country]);
                    setQuery("");
                  }}
                >
                  <div>
                    <div className="font-medium">{country.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {country.region} - {country.subregion} - {country.iso3}
                    </div>
                  </div>
                  <span className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">
                    {messages.compareBuilder.add}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-4 text-sm text-muted-foreground">
              {messages.compareBuilder.emptySearch}
            </div>
          )
        ) : (
          <div className="px-4 py-4 text-sm text-muted-foreground">
            {messages.compareBuilder.emptyIdle}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={() => {
            if (selected.length < 2) return;
            const slug = buildCompareSlug(selected);
            trackEvent("compare_created", { slug, count: selected.length });
            router.push(`/compare/${slug}`);
          }}
          disabled={selected.length < 2}
        >
          {messages.compareBuilder.compareNow}
        </Button>
        <span className="text-sm text-muted-foreground">{messages.compareBuilder.limit}</span>
      </div>
    </div>
  );
}
