import { z } from "zod";

import { getIndicatorDefinition } from "@/lib/indicators/registry";
import type { IndicatorId, IndicatorPoint, IndicatorSeries } from "@/lib/types";

const worldBankItemSchema = z.object({
  countryiso3code: z.string(),
  date: z.string(),
  value: z.number().nullable(),
});

const worldBankMetadataSchema = z.object({
  lastupdated: z.string().optional(),
});

export function normalizeWorldBankSeries(
  indicatorId: IndicatorId,
  input: unknown,
): IndicatorSeries | null {
  const seriesSchema = z.tuple([worldBankMetadataSchema.passthrough(), z.array(worldBankItemSchema)]);
  const parsed = seriesSchema.safeParse(input);

  if (!parsed.success || parsed.data[1].length === 0) {
    return null;
  }

  const rawPoints: IndicatorPoint[] = parsed.data[1]
    .map((row) => ({
      year: Number(row.date),
      value: row.value,
    }))
    .filter((point) => Number.isFinite(point.year))
    .sort((a, b) => a.year - b.year);

  const latest = [...rawPoints].reverse().find((point) => point.value != null) ?? null;
  const definition = getIndicatorDefinition(indicatorId);
  const source = definition.sources.primary.provider === "worldBank"
    ? definition.sources.primary
    : definition.sources.fallback?.find((item) => item.provider === "worldBank") ?? null;

  if (!source) {
    return null;
  }

  const countryIso3 = parsed.data[1][0]?.countryiso3code || "UNK";
  const points =
    latest == null ? rawPoints.filter((point) => point.value != null) : rawPoints.filter((point) => point.year <= latest.year);
  const coverageStartYear = points.find((point) => point.value != null)?.year ?? null;
  const coverageEndYear = latest?.year ?? null;

  return {
    indicatorId,
    sourceProvider: source.provider,
    sourceName: source.sourceName,
    sourceCode: source.sourceCode,
    countryIso3,
    sourceLastUpdated: parsed.data[0].lastupdated ?? null,
    frequency: source.frequency,
    coverageStartYear,
    coverageEndYear,
    latestAvailableLabel: latest ? String(latest.year) : null,
    comparableAcrossCountries: source.comparableAcrossCountries,
    latestYear: latest?.year ?? null,
    latestValue: latest?.value ?? null,
    points,
  };
}
