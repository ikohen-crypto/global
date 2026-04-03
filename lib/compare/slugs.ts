import { toKebabCase, uniqueBy } from "@/lib/utils";
import type { CountrySummary } from "@/lib/types";

export function buildCompareSlug(countries: CountrySummary[]) {
  return uniqueBy(countries, (country) => country.slug)
    .map((country) => country.slug)
    .join("-vs-");
}

export function parseCompareSlug(slug: string) {
  const countries = slug
    .split("-vs-")
    .map((part) => toKebabCase(part))
    .filter(Boolean);

  const unique = [...new Set(countries)];

  return {
    countries: unique,
    isValid: unique.length >= 2 && unique.length <= 6,
  };
}
