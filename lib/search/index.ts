import { allIndicators } from "@/lib/indicators/registry";
import { formatPopulation } from "@/lib/formatters";
import { toKebabCase, uniqueBy } from "@/lib/utils";
import type { CountrySummary, SearchEntity } from "@/lib/types";

export function buildSearchIndex(countries: CountrySummary[]): SearchEntity[] {
  const countryEntries: SearchEntity[] = countries.map((country) => ({
    type: "country",
    id: country.iso3,
    title: country.name,
    subtitle: `${country.region} • ${country.iso3}`,
    href: `/country/${country.slug}`,
    population: country.population ?? null,
    populationLabel: country.population != null ? formatPopulation(country.population) : null,
    keywords: [
      country.name,
      country.iso3,
      country.iso2,
      country.region,
      country.subregion,
      country.capital,
    ],
  }));

  const indicatorEntries: SearchEntity[] = allIndicators.map((indicator) => ({
    type: "indicator",
    id: indicator.id,
    title: indicator.shortLabel,
    subtitle: indicator.fullLabel,
    href: `/indicator/${toKebabCase(indicator.id)}`,
    keywords: [indicator.fullLabel, indicator.category, indicator.seoSummary],
  }));

  const regionEntries: SearchEntity[] = uniqueBy(
    countries
      .filter((country) => country.region && country.region !== "Other")
      .map((country) => ({
        type: "region" as const,
        id: toKebabCase(country.region),
        title: country.region,
        subtitle: `Explore ${country.region} rankings and comparisons`,
        href: `/region/${toKebabCase(country.region)}`,
        keywords: [country.region, country.subregion, "region", "regional rankings"],
      })),
    (region) => region.id,
  );

  const compareEntries: SearchEntity[] = [
    ["united-states", "china"],
    ["mexico", "brazil"],
    ["india", "china"],
  ].map(([left, right]) => ({
    type: "compare" as const,
    id: `${left}-vs-${right}`,
    title: `${left.replaceAll("-", " ")} vs ${right.replaceAll("-", " ")}`,
    subtitle: "Popular comparison",
    href: `/compare/${left}-vs-${right}`,
    keywords: ["compare", left, right],
  }));

  return [...countryEntries, ...regionEntries, ...indicatorEntries, ...compareEntries];
}

export function searchEntities(index: SearchEntity[], query: string) {
  const normalized = toKebabCase(query).replaceAll("-", " ").toLowerCase().trim();
  if (!normalized) return index.slice(0, 8);

  const typeWeight: Record<SearchEntity["type"], number> = {
    country: 7,
    region: 4,
    indicator: 2,
    compare: 1,
  };

  return index
    .map((item) => {
      const title = item.title.toLowerCase();
      const subtitle = item.subtitle.toLowerCase();
      const keywords = item.keywords.map((keyword) => keyword.toLowerCase());
      let score = typeWeight[item.type];

      if (title === normalized) score += 14;
      if (title.startsWith(normalized)) score += 10;
      if (keywords.some((keyword) => keyword === normalized)) score += 8;
      if (title.includes(normalized)) score += 6;
      if (subtitle.includes(normalized)) score += 3;
      if (keywords.some((keyword) => keyword.includes(normalized))) score += 4;

      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .map((entry) => entry.item)
    .slice(0, 10);
}
