import { cache } from "react";
import { unstable_cache } from "next/cache";

import {
  fetchDebtProxySeriesFromImf,
  fetchDebtProxySeriesMapFromImf,
  fetchGdpGrowthSeriesMapFromImfWeo,
  fetchGdpSeriesMapFromImfWeo,
  fetchInflationSeriesMapFromImfWeo,
} from "@/lib/api/imf";
import { fetchCountryIndicators } from "@/lib/api/indicators";
import { fetchIndicatorMapFromWorldBank } from "@/lib/api/worldBank";
import {
  getCountryBySlug,
  getCountries,
  getCountriesByRegion,
  getSearchCountries,
} from "@/lib/countries";
import { getFreshnessStatus, getQualityFlags } from "@/lib/data-quality";
import { featuredCountrySlugs } from "@/lib/data/countryCatalog";
import { buildFinancialRankingRows } from "@/lib/financial-rankings";
import { formatPercent } from "@/lib/formatters";
import { getIndicatorDefinition, indicatorRegistry } from "@/lib/indicators/registry";
import type {
  ComparisonCountry,
  CountryProfile,
  IndicatorSeries,
  FinancialRankingId,
  FinancialRankingRow,
  IndicatorId,
  MetricSnapshot,
  RankingRow,
} from "@/lib/types";

function toMetricSnapshot(
  countryPopulation: number | null,
  indicatorId: IndicatorId,
  series: Awaited<ReturnType<typeof fetchCountryIndicators>>[IndicatorId],
): MetricSnapshot {
  const definition = getIndicatorDefinition(indicatorId);
  const fallbackPopulationValue =
    indicatorId === "population" && series?.latestValue == null ? countryPopulation : null;
  const resolvedValue = series?.latestValue ?? fallbackPopulationValue;
  const isDebtProxy = indicatorId === "externalDebt" && series?.sourceCode === "GGXWDG_NGDP";
  const isInterestProxy = indicatorId === "interestRate" && series?.sourceCode === "FR.INR.LEND";

  return {
    indicatorId,
    label: isDebtProxy ? "Debt proxy" : isInterestProxy ? "Interest-rate proxy" : definition.shortLabel,
    value: resolvedValue,
    formattedValue: isDebtProxy ? formatPercent(resolvedValue) : definition.formatter(resolvedValue),
    latestYear: series?.latestYear ?? null,
    latestLabel:
      series?.latestAvailableLabel ??
      (fallbackPopulationValue != null ? "Current metadata snapshot" : null),
    sourceProvider:
      series?.sourceProvider ?? (fallbackPopulationValue != null ? "national" : null),
    sourceName:
      series?.sourceName ?? (fallbackPopulationValue != null ? "REST Countries metadata" : null),
    freshnessStatus: getFreshnessStatus(
      series?.frequency ?? (fallbackPopulationValue != null ? "annual" : null),
      series?.latestAvailableLabel ?? (fallbackPopulationValue != null ? "Current metadata snapshot" : null),
      series?.latestYear ?? null,
    ),
    qualityFlags: getQualityFlags(
      indicatorId,
      series
        ? {
            sourceProvider: series.sourceProvider,
            sourceName: series.sourceName,
            sourceCode: series.sourceCode,
            latestYear: series.latestYear,
          }
        : fallbackPopulationValue != null
          ? {
              sourceProvider: "national",
              sourceName: "REST Countries metadata",
              sourceCode: "metadata",
              latestYear: null,
            }
          : null,
      isDebtProxy ? "Debt proxy" : isInterestProxy ? "Interest-rate proxy" : definition.shortLabel,
    ),
    trend: series?.points.slice(-12) ?? [],
  };
}

export const getHomePageData = cache(async function getHomePageData() {
  const countries = await getSearchCountries();
  const featuredCountries = featuredCountrySlugs
    .map((slug) => countries.find((country) => country.slug === slug))
    .filter(Boolean);

  const rankingCountries = featuredCountries.slice(0, 4);

  return {
    countries,
    featuredCountries,
    popularComparisons: [
      ["mexico", "brazil"],
      ["united-states", "china"],
      ["india", "indonesia"],
    ],
    rankingCountries,
  };
});

export const getCountryProfile = cache(async function getCountryProfile(
  slug: string,
): Promise<CountryProfile | null> {
  const country = await getCountryBySlug(slug);
  if (!country) return null;

  const [indicatorMap, debtProxySeries, regionPeers, allCountries] = await Promise.all([
    fetchCountryIndicators(country.iso3),
    fetchDebtProxySeriesFromImf(country.iso3),
    getCountriesByRegion(country.region.toLowerCase().replaceAll(" ", "-")),
    getCountries(),
  ]);

  const metrics = Object.keys(indicatorRegistry).reduce<Record<IndicatorId, MetricSnapshot>>(
    (acc, key) => {
      const indicatorId = key as IndicatorId;
      const series =
        indicatorId === "externalDebt" &&
        (indicatorMap[indicatorId] == null || indicatorMap[indicatorId]?.latestValue == null)
          ? debtProxySeries
          : indicatorMap[indicatorId];

      acc[indicatorId] = toMetricSnapshot(country.population, indicatorId, series);
      return acc;
    },
    {} as Record<IndicatorId, MetricSnapshot>,
  );

  return {
    country,
    metrics,
    compareSuggestions: allCountries
      .filter((item) => item.slug !== slug && item.region === country.region)
      .slice(0, 4),
    regionPeers: regionPeers.filter((item) => item.slug !== slug).slice(0, 6),
  };
});

const getComparisonDataByKey = cache(async (slugKey: string): Promise<ComparisonCountry[]> => {
  const slugs = slugKey.split("|").filter(Boolean);
  const countries = await getCountries();
  const selected = countries.filter((country) => slugs.includes(country.slug));

  const settled = await Promise.all(
    selected.map(async (country) => ({
      country,
      metrics: (await fetchCountryIndicators(country.iso3)) as ComparisonCountry["metrics"],
    })),
  );

  return settled;
});

export async function getComparisonData(slugs: string[]): Promise<ComparisonCountry[]> {
  return getComparisonDataByKey([...slugs].sort().join("|"));
}

const getRankingDataByKey = cache(async (indicatorId: IndicatorId, regionKey: string) => {
  const regionSlug = regionKey || undefined;
  const countries = regionSlug ? await getCountriesByRegion(regionSlug) : await getCountries();

  const data = await Promise.all(
    countries.map(async (country) => {
      const metrics = await fetchCountryIndicators(country.iso3, [indicatorId]);
      const series = metrics[indicatorId];
      const definition = getIndicatorDefinition(indicatorId);

      return {
        country,
        value: series?.latestValue ?? null,
        formattedValue: definition.formatter(series?.latestValue ?? null),
        latestYear: series?.latestYear ?? null,
        sparkline: series?.points.slice(-10) ?? [],
      } satisfies RankingRow;
    }),
  );

  return data
    .filter((row) => row.value != null)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
    .slice(0, 50);
});

const getCachedRankingSnapshot = unstable_cache(
  async (indicatorId: IndicatorId, regionKey: string) => getRankingDataByKey(indicatorId, regionKey),
  ["ranking-snapshot"],
  {
    revalidate: 60 * 30,
    tags: ["rankings"],
  },
);

export async function getRankingData(indicatorId: IndicatorId, regionSlug?: string) {
  return getCachedRankingSnapshot(indicatorId, regionSlug ?? "");
}

const getFinancialRankingDataByKey = cache(async (
  rankingId: FinancialRankingId,
  regionKey: string,
): Promise<FinancialRankingRow[]> => {
  const regionSlug = regionKey || undefined;
  const countries = regionSlug ? await getCountriesByRegion(regionSlug) : await getCountries();
  const [inflationMap, growthMap, gdpMap, debtProxyMap, interestRateMap] = await Promise.all([
    fetchInflationSeriesMapFromImfWeo(),
    fetchGdpGrowthSeriesMapFromImfWeo(),
    fetchGdpSeriesMapFromImfWeo(),
    fetchDebtProxySeriesMapFromImf(),
    fetchIndicatorMapFromWorldBank("interestRate"),
  ]);

  const profiles = countries.map((country) => {
    const inflationSeries = inflationMap.get(country.iso3) ?? null;
    const growthSeries = growthMap.get(country.iso3) ?? null;
    const gdpSeries = gdpMap.get(country.iso3) ?? null;
    const debtSeries = debtProxyMap.get(country.iso3) ?? null;
    const interestRateSeries = interestRateMap.get(country.iso3) ?? null;

    return {
      country,
      metrics: {
        inflation: toMetricSnapshot(country.population, "inflation", inflationSeries),
        gdpGrowth: toMetricSnapshot(country.population, "gdpGrowth", growthSeries),
        interestRate: toMetricSnapshot(country.population, "interestRate", interestRateSeries),
        externalDebt: toMetricSnapshot(country.population, "externalDebt", debtSeries),
        gdp: toMetricSnapshot(country.population, "gdp", gdpSeries),
      },
    };
  });

  return buildFinancialRankingRows(profiles, rankingId).slice(0, 50);
});

const getCachedFinancialRankingSnapshot = unstable_cache(
  async (rankingId: FinancialRankingId, regionKey: string) =>
    getFinancialRankingDataByKey(rankingId, regionKey),
  ["financial-ranking-snapshot"],
  {
    revalidate: 60 * 30,
    tags: ["financial-rankings", "rankings"],
  },
);

export async function getFinancialRankingData(
  rankingId: FinancialRankingId,
  regionSlug?: string,
): Promise<FinancialRankingRow[]> {
  return getCachedFinancialRankingSnapshot(rankingId, regionSlug ?? "");
}
