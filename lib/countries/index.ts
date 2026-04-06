import { cache } from "react";

import { fetchAllCountries } from "@/lib/api/restCountries";
import { countryCatalog } from "@/lib/data/countryCatalog";
import { toKebabCase, uniqueBy } from "@/lib/utils";

const getCountriesCached = cache(async () => fetchAllCountries());

export async function getCountries() {
  return getCountriesCached();
}

export async function getHeaderCountries() {
  return getCountriesCached();
}

export async function getSearchCountries() {
  return getCountriesCached();
}

export async function getCountryCatalogBySlug(slug: string) {
  return countryCatalog.find((country) => country.slug === slug) ?? null;
}

export async function getCountryCatalogByIso3(iso3: string) {
  return countryCatalog.find((country) => country.iso3 === iso3) ?? null;
}

export async function getCountriesFromCatalogByRegion(regionSlug: string) {
  return countryCatalog.filter((country) => toKebabCase(country.region) === regionSlug);
}

export async function getRegionsFromCatalog() {
  const countries = countryCatalog;

  return uniqueBy(
    countries
      .filter((country) => country.region && country.region !== "Other")
      .map((country) => ({
        name: country.region,
        slug: toKebabCase(country.region),
        countryCount: countries.filter((item) => item.region === country.region).length,
        sampleCountries: countries
          .filter((item) => item.region === country.region)
          .slice(0, 4),
      })),
    (region) => region.slug,
  ).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCountryBySlug(slug: string) {
  const countries = await getCountries();
  return (
    countries.find((country) => country.slug === slug) ??
    countryCatalog.find((country) => country.slug === slug) ??
    null
  );
}

export async function getCountryByIso3(iso3: string) {
  const countries = await getCountries();
  return countries.find((country) => country.iso3 === iso3) ?? null;
}

export async function getCountriesByRegion(regionSlug: string) {
  const countries = await getCountries();
  return countries.filter((country) => toKebabCase(country.region) === regionSlug);
}

export async function getRegions() {
  const countries = await getCountries();

  return uniqueBy(
    countries
      .filter((country) => country.region && country.region !== "Other")
      .map((country) => ({
        name: country.region,
        slug: toKebabCase(country.region),
        countryCount: countries.filter((item) => item.region === country.region).length,
        sampleCountries: countries
          .filter((item) => item.region === country.region)
          .slice(0, 4),
      })),
    (region) => region.slug,
  ).sort((a, b) => a.name.localeCompare(b.name));
}
