import { allIndicators } from "@/lib/indicators/registry";
import { normalizeWorldBankSeries } from "@/lib/normalizers/worldBank";
import type { IndicatorId, IndicatorSeries } from "@/lib/types";

const WORLD_BANK_BASE_URL = "https://api.worldbank.org/v2";

async function fetchIndicatorSeries(
  iso3: string,
  indicatorId: IndicatorId,
): Promise<IndicatorSeries | null> {
  const indicator = allIndicators.find((item) => item.id === indicatorId);
  if (!indicator) return null;
  const worldBankSource = indicator.sources.primary.provider === "worldBank"
    ? indicator.sources.primary
    : indicator.sources.fallback?.find((item) => item.provider === "worldBank") ?? null;

  if (!worldBankSource) return null;

  try {
    const query = new URLSearchParams({
      format: "json",
      per_page: "70",
    });

    if (worldBankSource.sourceId) {
      query.set("source", worldBankSource.sourceId);
    }

    const url = `${WORLD_BANK_BASE_URL}/country/${iso3}/indicator/${worldBankSource.sourceCode}?${query.toString()}`;
    const response = await fetch(url, {
      next: { revalidate: 60 * 60 * 24 * 7 },
    } as RequestInit & { next: { revalidate: number } });
    if (!response.ok) return null;
    const json = (await response.json()) as unknown;
    return normalizeWorldBankSeries(indicatorId, json);
  } catch {
    return null;
  }
}

function getWorldBankSourceForIndicator(indicatorId: IndicatorId) {
  const indicator = allIndicators.find((item) => item.id === indicatorId);
  if (!indicator) return null;

  return indicator.sources.primary.provider === "worldBank"
    ? indicator.sources.primary
    : indicator.sources.fallback?.find((item) => item.provider === "worldBank") ?? null;
}

export async function fetchIndicatorMapFromWorldBank(
  indicatorId: IndicatorId,
): Promise<Map<string, IndicatorSeries>> {
  const worldBankSource = getWorldBankSourceForIndicator(indicatorId);
  if (!worldBankSource) {
    return new Map();
  }

  try {
    const query = new URLSearchParams({
      format: "json",
      per_page: "20000",
    });

    if (worldBankSource.sourceId) {
      query.set("source", worldBankSource.sourceId);
    }

    const url = `${WORLD_BANK_BASE_URL}/country/all/indicator/${worldBankSource.sourceCode}?${query.toString()}`;
    const response = await fetch(url, {
      next: { revalidate: 60 * 60 * 24 * 7 },
    } as RequestInit & { next: { revalidate: number } });

    if (!response.ok) {
      return new Map();
    }

    const json = (await response.json()) as unknown;
    const metadata = Array.isArray(json) ? json[0] : null;
    const rows = Array.isArray(json) && Array.isArray(json[1]) ? json[1] : [];

    const groupedRows = rows.reduce<Record<string, unknown[]>>((acc, row) => {
      const iso3 =
        typeof row === "object" &&
        row !== null &&
        "countryiso3code" in row &&
        typeof row.countryiso3code === "string"
          ? row.countryiso3code.toUpperCase()
          : "";

      if (!/^[A-Z]{3}$/.test(iso3)) {
        return acc;
      }

      acc[iso3] ??= [];
      acc[iso3].push(row);
      return acc;
    }, {});

    return new Map(
      Object.entries(groupedRows)
        .map(([iso3, countryRows]) => {
          const series = normalizeWorldBankSeries(indicatorId, [metadata, countryRows]);
          return series ? [iso3, series] : null;
        })
        .filter((entry): entry is [string, IndicatorSeries] => entry != null),
    );
  } catch {
    return new Map();
  }
}

export async function fetchCountryIndicators(
  iso3: string,
  indicatorIds: IndicatorId[] = allIndicators.map((indicator) => indicator.id),
) {
  const settled = await Promise.allSettled(
    indicatorIds.map((indicatorId) => fetchIndicatorSeries(iso3, indicatorId)),
  );

  return settled.reduce<Record<IndicatorId, IndicatorSeries | null>>((acc, result, index) => {
    acc[indicatorIds[index]] = result.status === "fulfilled" ? result.value : null;
    return acc;
  }, {} as Record<IndicatorId, IndicatorSeries | null>);
}

export async function fetchCountryIndicatorsFromWorldBank(
  iso3: string,
  indicatorIds: IndicatorId[] = allIndicators.map((indicator) => indicator.id),
) {
  const settled = await Promise.allSettled(
    indicatorIds.map((indicatorId) => fetchIndicatorSeries(iso3, indicatorId)),
  );

  return settled.reduce<Record<IndicatorId, IndicatorSeries | null>>((acc, result, index) => {
    acc[indicatorIds[index]] = result.status === "fulfilled" ? result.value : null;
    return acc;
  }, {} as Record<IndicatorId, IndicatorSeries | null>);
}
