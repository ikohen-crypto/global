import { normalizeCountries } from "@/lib/normalizers/country";
import { getLatestPopulationValuesFromUn } from "@/lib/api/unPopulation";
import { countryCatalog } from "@/lib/data/countryCatalog";
import type { CountrySummary } from "@/lib/types";

const REST_COUNTRIES_ALL_URL =
  "https://restcountries.com/v3.1/all?fields=cca2,cca3,name,region,subregion,capital,population,flags,latlng,currencies,languages";

let countriesPromise: Promise<CountrySummary[]> | null = null;

function mergeWithCatalog(
  countries: CountrySummary[],
  unPopulationByIso3: Map<string, number | null>,
) {
  const catalogByIso3 = new Map(countryCatalog.map((country) => [country.iso3, country]));

  return countries.map((country) => {
    const fallback = catalogByIso3.get(country.iso3);
    const unPopulation = unPopulationByIso3.get(country.iso3) ?? null;
    if (!fallback) return country;

    return {
      ...country,
      shortName: country.shortName || fallback.shortName,
      region: country.region || fallback.region,
      subregion: country.subregion || fallback.subregion,
      capital: country.capital === "N/A" ? fallback.capital : country.capital,
      population: country.population ?? unPopulation ?? fallback.population,
      flagUrl: country.flagUrl || fallback.flagUrl,
      latlng: country.latlng ?? fallback.latlng,
      currencies: country.currencies.length > 0 ? country.currencies : fallback.currencies,
      languages: country.languages.length > 0 ? country.languages : fallback.languages,
    } satisfies CountrySummary;
  });
}

export async function fetchAllCountries(): Promise<CountrySummary[]> {
  if (countriesPromise) {
    return countriesPromise;
  }

  countriesPromise = (async () => {
  try {
    const unPopulationByIso3 = await getLatestPopulationValuesFromUn();
    const response = await fetch(REST_COUNTRIES_ALL_URL, {
      next: { revalidate: 60 * 60 * 24 * 14 },
    } as RequestInit & { next: { revalidate: number } });

    if (!response.ok) {
      return mergeWithCatalog(countryCatalog, unPopulationByIso3);
    }

    const data = (await response.json()) as unknown[];
    const countries = mergeWithCatalog(normalizeCountries(data), unPopulationByIso3).filter(
      (country) => country.iso3 !== "ATA",
    );
    return countries.length > 0 ? countries : mergeWithCatalog(countryCatalog, unPopulationByIso3);
  } catch {
    const unPopulationByIso3 = await getLatestPopulationValuesFromUn();
    return mergeWithCatalog(countryCatalog, unPopulationByIso3);
  }
  })();

  return countriesPromise;
}
