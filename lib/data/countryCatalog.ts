import { toKebabCase } from "@/lib/utils";
import type { CountrySummary } from "@/lib/types";
import worldCountriesJson from "world-countries";

type WorldCountry = {
  name: { common: string };
  cca2: string;
  cca3: string;
  region: string;
  subregion?: string;
  capital?: string[];
  population?: number;
  latlng?: [number, number];
  currencies?: Record<string, { name?: string; symbol?: string }>;
  languages?: Record<string, string>;
};

const worldCountries = worldCountriesJson as WorldCountry[];

function mapRegion(region: string) {
  return region === "Americas" ? "Americas" : region || "Other";
}

export const countryCatalog: CountrySummary[] = worldCountries
  .filter((country) => country.cca3 !== "ATA")
  .map((country) => ({
    iso2: country.cca2,
    iso3: country.cca3,
    slug: toKebabCase(country.name.common),
    name: country.name.common,
    shortName: country.name.common,
    region: mapRegion(country.region),
    subregion: country.subregion || "Other",
    capital: country.capital?.[0] ?? "N/A",
    population: country.population ?? null,
    flagUrl: `https://flagcdn.com/${country.cca2.toLowerCase()}.svg`,
    latlng:
      country.latlng && country.latlng.length === 2
        ? ([country.latlng[0], country.latlng[1]] as [number, number])
        : null,
    currencies: country.currencies ? Object.keys(country.currencies) : [],
    languages: country.languages ? Object.values(country.languages) : [],
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const featuredCountrySlugs = [
  "united-states",
  "china",
  "india",
  "germany",
  "brazil",
  "argentina",
  "japan",
  "south-africa",
];
