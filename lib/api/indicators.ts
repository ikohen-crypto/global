import { cache } from "react";

import {
  fetchGdpGrowthSeriesFromImfWeo,
  fetchGdpPerCapitaSeriesFromImfWeo,
  fetchGdpSeriesFromImfWeo,
  fetchInflationSeriesFromImf,
  fetchInflationSeriesFromImfWeo,
  fetchUnemploymentSeriesFromImfWeo,
} from "@/lib/api/imf";
import { getFreshnessStatus, getQualityFlags } from "@/lib/data-quality";
import { fetchInflationSeriesFromOecd } from "@/lib/api/oecd";
import {
  fetchGdpGrowthSeriesFromOecd,
  fetchInterestRateSeriesFromOecd,
  fetchUnemploymentSeriesFromOecd,
} from "@/lib/api/oecd";
import { fetchPopulationSeriesFromUn } from "@/lib/api/unPopulation";
import { fetchCountryIndicatorsFromWorldBank } from "@/lib/api/worldBank";
import { allIndicators } from "@/lib/indicators/registry";
import { getIndicatorDefinition } from "@/lib/indicators/registry";
import type { IndicatorId, IndicatorSeries } from "@/lib/types";

const providerPreference = {
  oecd: 5,
  imf: 4,
  un: 3,
  worldBank: 2,
  national: 1,
} as const;

function normalizePeriodScore(series: IndicatorSeries) {
  const label = series.latestAvailableLabel ?? (series.latestYear != null ? String(series.latestYear) : "");

  const monthly = /^(\d{4})-(\d{2})$/.exec(label);
  if (monthly) {
    return Number(monthly[1]) * 100 + Number(monthly[2]);
  }

  const quarterly = /^(\d{4})-Q([1-4])$/.exec(label);
  if (quarterly) {
    return Number(quarterly[1]) * 100 + Number(quarterly[2]) * 3;
  }

  if (series.latestYear != null) {
    return series.latestYear * 100 + 12;
  }

  return -1;
}

function chooseFreshestSeries(candidates: IndicatorSeries[]) {
  return [...candidates].sort((left, right) => {
    const periodGap = normalizePeriodScore(right) - normalizePeriodScore(left);
    if (periodGap !== 0) {
      return periodGap;
    }

    const providerGap =
      providerPreference[right.sourceProvider] - providerPreference[left.sourceProvider];
    if (providerGap !== 0) {
      return providerGap;
    }

    const pointGap = (right.points.length ?? 0) - (left.points.length ?? 0);
    return pointGap;
  })[0] ?? null;
}

function decorateSeries(indicatorId: IndicatorId, series: IndicatorSeries | null) {
  if (!series) {
    return null;
  }

  const label = getIndicatorDefinition(indicatorId).shortLabel;

  return {
    ...series,
    freshnessStatus: getFreshnessStatus(series.frequency, series.latestAvailableLabel, series.latestYear),
    qualityFlags: getQualityFlags(indicatorId, series, label),
  } satisfies IndicatorSeries;
}

async function fetchFromProvider(
  iso3: string,
  indicatorId: IndicatorId,
  provider: string,
): Promise<IndicatorSeries | null> {
  if (indicatorId === "gdp" && provider === "imf") {
    return fetchGdpSeriesFromImfWeo(iso3);
  }

  if (indicatorId === "gdpPerCapita" && provider === "imf") {
    return fetchGdpPerCapitaSeriesFromImfWeo(iso3);
  }

  if (indicatorId === "inflation" && provider === "oecd") {
    return fetchInflationSeriesFromOecd(iso3);
  }

  if (indicatorId === "unemployment" && provider === "oecd") {
    return fetchUnemploymentSeriesFromOecd(iso3);
  }

  if (indicatorId === "gdpGrowth" && provider === "oecd") {
    return fetchGdpGrowthSeriesFromOecd(iso3);
  }

  if (indicatorId === "interestRate" && provider === "oecd") {
    return fetchInterestRateSeriesFromOecd(iso3);
  }

  if (indicatorId === "inflation" && provider === "imf") {
    return (await fetchInflationSeriesFromImf(iso3)) ?? fetchInflationSeriesFromImfWeo(iso3);
  }

  if (indicatorId === "unemployment" && provider === "imf") {
    return fetchUnemploymentSeriesFromImfWeo(iso3);
  }

  if (indicatorId === "gdpGrowth" && provider === "imf") {
    return fetchGdpGrowthSeriesFromImfWeo(iso3);
  }

  if (indicatorId === "population" && provider === "un") {
    return fetchPopulationSeriesFromUn(iso3);
  }

  if (provider === "worldBank") {
    const result = await fetchCountryIndicatorsFromWorldBank(iso3, [indicatorId]);
    return result[indicatorId];
  }

  return null;
}

async function fetchSingleIndicator(
  iso3: string,
  indicatorId: IndicatorId,
): Promise<IndicatorSeries | null> {
  const indicator = getIndicatorDefinition(indicatorId);
  const orderedSources = [indicator.sources.primary, ...(indicator.sources.fallback ?? [])];
  const candidates: IndicatorSeries[] = [];

  for (const source of orderedSources) {
    const series = await fetchFromProvider(iso3, indicatorId, source.provider);
    if (series?.latestValue != null) {
      candidates.push(series);
    }
  }

  return decorateSeries(indicatorId, chooseFreshestSeries(candidates));
}

const fetchSingleIndicatorCached = cache(fetchSingleIndicator);

export async function fetchCountryIndicators(
  iso3: string,
  indicatorIds: IndicatorId[] = allIndicators.map((indicator) => indicator.id),
): Promise<Record<IndicatorId, IndicatorSeries | null>> {
  const settled = await Promise.allSettled(
    indicatorIds.map((indicatorId) => fetchSingleIndicatorCached(iso3, indicatorId)),
  );

  return settled.reduce<Record<IndicatorId, IndicatorSeries | null>>((acc, result, index) => {
    acc[indicatorIds[index]] = result.status === "fulfilled" ? result.value : null;
    return acc;
  }, {} as Record<IndicatorId, IndicatorSeries | null>);
}
