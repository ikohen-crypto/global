import { z } from "zod";

import { countryCatalog } from "@/lib/data/countryCatalog";
import { toKebabCase } from "@/lib/utils";
import type { CountrySummary } from "@/lib/types";

const restCountrySchema = z.object({
  cca2: z.string(),
  cca3: z.string(),
  name: z.object({
    common: z.string(),
  }),
  region: z.string().optional().default("Other"),
  subregion: z.string().optional().default("Other"),
  capital: z.array(z.string()).optional(),
  population: z.number().nullable().optional(),
  flags: z
    .object({
      svg: z.string().url().optional(),
      png: z.string().url().optional(),
    })
    .optional(),
  latlng: z.array(z.number()).length(2).optional(),
  currencies: z.record(z.object({ name: z.string().optional() })).optional(),
  languages: z.record(z.string()).optional(),
});

export function normalizeCountries(input: unknown[]): CountrySummary[] {
  const parsed = z.array(restCountrySchema).safeParse(input);

  if (!parsed.success) {
    return countryCatalog;
  }

  return parsed.data.map((country) => ({
    iso2: country.cca2,
    iso3: country.cca3,
    slug: toKebabCase(country.name.common),
    name: country.name.common,
    shortName: country.name.common,
    region: country.region || "Other",
    subregion: country.subregion || "Other",
    capital: country.capital?.[0] ?? "N/A",
    population: country.population ?? null,
    flagUrl: country.flags?.svg ?? country.flags?.png ?? "",
    latlng: country.latlng ? [country.latlng[0], country.latlng[1]] : null,
    currencies: country.currencies ? Object.keys(country.currencies) : [],
    languages: country.languages ? Object.values(country.languages) : [],
  }));
}
