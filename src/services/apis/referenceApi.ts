import type { CountryReference, ReferenceConfigResponse } from "@/types";
import { mockReferenceConfig } from "@/services/apis/mockCatalog";
import { fetchJson, HttpError } from "@/services/apis/httpClient";
export type AppReferenceConfig = ReferenceConfigResponse;

const REFERENCE_ENDPOINT = "/api/reference/config";
const COUNTRY_ENDPOINT = "/api/reference/countries";

export async function getReferenceConfig(): Promise<AppReferenceConfig> {
  try {
    return await fetchJson<AppReferenceConfig>(REFERENCE_ENDPOINT, { method: "GET" });
  } catch (error) {
    if (error instanceof HttpError) {
      return mockReferenceConfig;
    }

    return mockReferenceConfig;
  }
}

function normalizeCountryList(countries: CountryReference[]) {
  const seen = new Set<string>();

  return countries
    .filter((country) => {
      const code = country.countryCode.trim().toUpperCase();
      if (!code || seen.has(code)) {
        return false;
      }

      seen.add(code);
      return true;
    })
    .map((country) => ({
      ...country,
      countryCode: country.countryCode.trim().toUpperCase(),
      countryName: country.countryName.trim()
    }))
    .sort((left, right) => left.countryName.localeCompare(right.countryName));
}

async function fetchRemoteCountryList(): Promise<CountryReference[]> {
  const response = await fetch("https://restcountries.com/v3.1/all?fields=cca2,name,region,subregion,flags");
  if (!response.ok) {
    throw new Error("Failed to fetch remote countries");
  }

  const payload = (await response.json()) as Array<{
    cca2?: string;
    name?: { common?: string };
    region?: string;
    subregion?: string;
    flags?: { png?: string; svg?: string };
  }>;

  return normalizeCountryList(
    payload
      .map((item) => ({
        countryCode: item.cca2 ?? "",
        countryName: item.name?.common ?? item.cca2 ?? "",
        region: item.region,
        subregion: item.subregion,
        flag: item.flags?.svg ?? item.flags?.png
      }))
      .filter((item) => Boolean(item.countryCode && item.countryName))
  );
}

export async function getCountryList(): Promise<CountryReference[]> {
  try {
    const countries = await fetchJson<CountryReference[]>(COUNTRY_ENDPOINT, { method: "GET" });
    return normalizeCountryList(countries);
  } catch (error) {
    if (error instanceof HttpError) {
      try {
        return await fetchRemoteCountryList();
      } catch {
        return [];
      }
    }

    try {
      return await fetchRemoteCountryList();
    } catch {
      return [];
    }
  }
}
