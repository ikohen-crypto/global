import { getIndicatorDefinition } from "@/lib/indicators/registry";
import type { IndicatorId, IndicatorSeries } from "@/lib/types";

type OecdRow = {
  REF_AREA?: string;
  TIME_PERIOD?: string;
  OBS_VALUE?: string;
};

type ParsedPeriod =
  | {
      year: number;
      order: number;
      label: string;
    }
  | null;

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current);
  return values;
}

function parseCsvRows(input: string): OecdRow[] {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);

    return headers.reduce<OecdRow>((row, header, index) => {
      row[header as keyof OecdRow] = cells[index] ?? "";
      return row;
    }, {});
  });
}

function parseMonthlyPeriod(value: string): ParsedPeriod {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;

  return {
    year: Number(match[1]),
    order: Number(match[2]),
    label: value,
  };
}

function parseQuarterlyPeriod(value: string): ParsedPeriod {
  const match = /^(\d{4})-Q([1-4])$/.exec(value);
  if (!match) return null;

  return {
    year: Number(match[1]),
    order: Number(match[2]),
    label: value,
  };
}

function normalizeOecdSeriesCsv({
  input,
  iso3,
  indicatorId,
  sourceLastUpdated,
  parsePeriod,
}: {
  input: string;
  iso3: string;
  indicatorId: IndicatorId;
  sourceLastUpdated: string | null;
  parsePeriod: (value: string) => ParsedPeriod;
}): IndicatorSeries | null {
  const definition = getIndicatorDefinition(indicatorId);
  const source = definition.sources.primary.provider === "oecd"
    ? definition.sources.primary
    : definition.sources.fallback?.find((item) => item.provider === "oecd") ?? null;
  if (!source) {
    return null;
  }

  const rows = parseCsvRows(input);
  const latestByYear = new Map<number, { year: number; order: number; label: string; value: number }>();

  rows.forEach((row) => {
    if (row.REF_AREA !== iso3) return;

    const period = typeof row.TIME_PERIOD === "string" ? parsePeriod(row.TIME_PERIOD) : null;
    const numericValue = typeof row.OBS_VALUE === "string" ? Number(row.OBS_VALUE) : NaN;

    if (!period || !Number.isFinite(numericValue)) return;

    const current = latestByYear.get(period.year);
    if (!current || period.order >= current.order) {
      latestByYear.set(period.year, {
        year: period.year,
        order: period.order,
        label: period.label,
        value: Number(numericValue.toFixed(2)),
      });
    }
  });

  const ordered = [...latestByYear.values()].sort((a, b) => a.year - b.year);
  const latest = ordered.at(-1) ?? null;

  if (!latest) {
    return null;
  }

  return {
    indicatorId,
    sourceProvider: source.provider,
    sourceName: source.sourceName,
    sourceCode: source.sourceCode,
    countryIso3: iso3,
    sourceLastUpdated,
    frequency: source.frequency,
    coverageStartYear: ordered[0]?.year ?? null,
    coverageEndYear: latest.year,
    latestAvailableLabel: latest.label,
    comparableAcrossCountries: source.comparableAcrossCountries,
    latestYear: latest.year,
    latestValue: latest.value,
    points: ordered.map((item) => ({
      year: item.year,
      value: item.value,
    })),
  };
}

export function normalizeOecdInflationCsv(
  input: string,
  iso3: string,
  sourceLastUpdated: string | null,
): IndicatorSeries | null {
  return normalizeOecdSeriesCsv({
    input,
    iso3,
    indicatorId: "inflation",
    sourceLastUpdated,
    parsePeriod: parseMonthlyPeriod,
  });
}

export function normalizeOecdUnemploymentCsv(
  input: string,
  iso3: string,
  sourceLastUpdated: string | null,
): IndicatorSeries | null {
  return normalizeOecdSeriesCsv({
    input,
    iso3,
    indicatorId: "unemployment",
    sourceLastUpdated,
    parsePeriod: parseMonthlyPeriod,
  });
}

export function normalizeOecdInterestRateCsv(
  input: string,
  iso3: string,
  sourceLastUpdated: string | null,
): IndicatorSeries | null {
  return normalizeOecdSeriesCsv({
    input,
    iso3,
    indicatorId: "interestRate",
    sourceLastUpdated,
    parsePeriod: parseMonthlyPeriod,
  });
}

export function normalizeOecdQuarterlyGrowthCsv(
  input: string,
  iso3: string,
  indicatorId: "gdpGrowth",
  sourceLastUpdated: string | null,
): IndicatorSeries | null {
  return normalizeOecdSeriesCsv({
    input,
    iso3,
    indicatorId,
    sourceLastUpdated,
    parsePeriod: parseQuarterlyPeriod,
  });
}
