"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CountrySummary } from "@/lib/types";

type RegionSummary = {
  name: string;
  slug: string;
  countryCount: number;
  sampleCountries: CountrySummary[];
};

export function RegionBrowser({ regions }: { regions: RegionSummary[] }) {
  const [query, setQuery] = useState("");
  const { messages } = useI18n();

  const filteredRegions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return regions;

    return regions.filter((region) =>
      [region.name, ...region.sampleCountries.map((country) => country.name)]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query, regions]);

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-border bg-card p-4 shadow-panel">
        <label htmlFor="region-browser-search" className="text-sm font-medium text-foreground">
          {messages.regionsPage.searchLabel}
        </label>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="region-browser-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={messages.regionsPage.searchPlaceholder}
            className="pl-11"
          />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {messages.regionsPage.searchBody}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredRegions.map((region) => (
          <Link key={region.slug} href={`/region/${region.slug}`}>
            <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-panel">
              <CardHeader>
                <CardTitle>{region.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div>{region.countryCount} {messages.regionsPage.countries}</div>
                <div>{messages.regionsPage.examples}: {region.sampleCountries.map((country) => country.name).join(", ")}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredRegions.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-border bg-card/60 p-6 text-sm text-muted-foreground">
          {messages.regionsPage.empty}
        </div>
      ) : null}
    </div>
  );
}
