import { inflateRawSync } from "node:zlib";

import { getIndicatorDefinition } from "@/lib/indicators/registry";
import type { IndicatorPoint, IndicatorSeries } from "@/lib/types";

type SdmxObservation = {
  periodLabel: string;
  rawValue: number;
};

type SdmxJsonResponse = {
  data?: {
    dataSets?: Array<{
      series?: Record<string, { observations?: Record<string, unknown[]> }>;
    }>;
    structure?: {
      dimensions?: {
        observation?: Array<{
          id?: string;
          values?: Array<{ id?: string; name?: string }>;
        }>;
      };
    };
  };
};

const IMF_API_KEY = process.env.IMF_API_KEY;
const IMF_CPI_URL_TEMPLATE = process.env.IMF_CPI_URL_TEMPLATE;
const IMF_WEO_XLSX_URL =
  process.env.IMF_WEO_XLSX_URL ??
  "https://data.imf.org/-/media/iData/External%20Storage/Documents/5661B7CB2FCC4A56866765D4281AEF01/en/WEOOct2025all";

let imfWeoWorkbookCache: {
  rows: Map<string, string>[];
  yearColumns: Array<{ column: string; year: number }>;
} | null = null;

type ImfWeoSeriesConfig = {
  indicatorId: IndicatorSeries["indicatorId"];
  codes: string[];
  sourceName: string;
  valueTransform?: (value: number) => number;
};

const IMF_WEO_SERIES_CONFIG: Record<string, ImfWeoSeriesConfig> = {
  debtProxy: {
    indicatorId: "externalDebt",
    codes: ["GGXWDG_NGDP"],
    sourceName: "IMF WEO gross debt proxy (% of GDP)",
  },
  inflation: {
    indicatorId: "inflation",
    codes: ["PCPIPCH"],
    sourceName: "IMF WEO inflation (avg consumer prices; includes estimates/projections)",
  },
  unemployment: {
    indicatorId: "unemployment",
    codes: ["LUR"],
    sourceName: "IMF WEO unemployment rate (includes estimates/projections)",
  },
  gdpGrowth: {
    indicatorId: "gdpGrowth",
    codes: ["NGDP_RPCH"],
    sourceName: "IMF WEO real GDP growth (includes estimates/projections)",
  },
  gdp: {
    indicatorId: "gdp",
    codes: ["NGDPD"],
    sourceName: "IMF WEO GDP (current US$, includes estimates/projections)",
    valueTransform: (value) => value * 1_000_000_000,
  },
  gdpPerCapita: {
    indicatorId: "gdpPerCapita",
    codes: ["NGDPDPC"],
    sourceName: "IMF WEO GDP per capita (current US$, includes estimates/projections)",
  },
};

function isLikelyHtml(value: string) {
  const trimmed = value.trim().toLowerCase();
  return trimmed.startsWith("<!doctype html") || trimmed.startsWith("<html");
}

function parsePeriodLabel(periodLabel: string) {
  const monthlyMatch = /^(\d{4})-(\d{2})$/.exec(periodLabel);
  if (monthlyMatch) {
    return {
      year: Number(monthlyMatch[1]),
      month: Number(monthlyMatch[2]),
      normalized: periodLabel,
      comparisonKey: `${monthlyMatch[2]}`,
    };
  }

  const quarterlyMatch = /^(\d{4})-Q([1-4])$/.exec(periodLabel);
  if (quarterlyMatch) {
    return {
      year: Number(quarterlyMatch[1]),
      month: Number(quarterlyMatch[2]) * 3,
      normalized: periodLabel,
      comparisonKey: `Q${quarterlyMatch[2]}`,
    };
  }

  const annualMatch = /^(\d{4})$/.exec(periodLabel);
  if (annualMatch) {
    return {
      year: Number(annualMatch[1]),
      month: 12,
      normalized: periodLabel,
      comparisonKey: "A",
    };
  }

  return null;
}

function decodeXml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function stripXml(text: string) {
  return decodeXml(text.replace(/<[^>]+>/g, ""));
}

function extractColumn(ref: string) {
  const match = ref.match(/[A-Z]+/);
  return match?.[0] ?? "";
}

function parseNumber(value: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function readZipEntryFromBuffer(buffer: Buffer, entryName: string) {
  const bytes = new Uint8Array(buffer);
  const localHeaderSignature = [0x50, 0x4b, 0x03, 0x04];
  let offset = 0;

  while (offset < bytes.length - 4) {
    const isLocalHeader = localHeaderSignature.every((byte, index) => bytes[offset + index] === byte);
    if (!isLocalHeader) {
      offset += 1;
      continue;
    }

    const flags = bytes[offset + 6] | (bytes[offset + 7] << 8);
    const compressionMethod = bytes[offset + 8] | (bytes[offset + 9] << 8);
    const compressedSize =
      bytes[offset + 18] |
      (bytes[offset + 19] << 8) |
      (bytes[offset + 20] << 16) |
      (bytes[offset + 21] << 24);
    const fileNameLength = bytes[offset + 26] | (bytes[offset + 27] << 8);
    const extraLength = bytes[offset + 28] | (bytes[offset + 29] << 8);
    const fileNameStart = offset + 30;
    const fileName = new TextDecoder().decode(bytes.slice(fileNameStart, fileNameStart + fileNameLength));
    const dataStart = fileNameStart + fileNameLength + extraLength;

    if ((flags & 0x08) !== 0) {
      throw new Error("Unsupported XLSX entry with data descriptor.");
    }

    const dataEnd = dataStart + compressedSize;
    if (fileName === entryName) {
      const compressed = Buffer.from(bytes.slice(dataStart, dataEnd));
      if (compressionMethod === 0) {
        return compressed.toString("utf8");
      }

      if (compressionMethod !== 8) {
        throw new Error(`Unsupported XLSX compression method: ${compressionMethod}`);
      }

      return inflateRawSync(compressed).toString("utf8");
    }

    offset = dataEnd;
  }

  throw new Error(`XLSX entry not found: ${entryName}`);
}

async function parseWEOSharedStrings(buffer: Buffer) {
  const sharedStringsXml = await readZipEntryFromBuffer(buffer, "xl/sharedStrings.xml");
  return [...sharedStringsXml.matchAll(/<si\b[\s\S]*?<\/si>/g)].map((match) =>
    stripXml(match[0]).trim(),
  );
}

function parseSheetRows(sheetXml: string, sharedStrings: string[]) {
  const rows = [...sheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)];

  return rows.map((rowMatch) => {
    const cellMap = new Map<string, string>();
    const rowXml = rowMatch[1];

    for (const cellMatch of rowXml.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>|<c\b([^>]*)\/>/g)) {
      const attrs = cellMatch[1] ?? cellMatch[3] ?? "";
      const cellBody = cellMatch[2] ?? "";
      const ref = attrs.match(/\br="([^"]+)"/)?.[1] ?? "";
      const column = extractColumn(ref);
      if (!column) continue;

      const type = attrs.match(/\bt="([^"]+)"/)?.[1] ?? null;
      const inlineString = cellBody.match(/<is\b[^>]*>([\s\S]*?)<\/is>/)?.[1] ?? "";
      const valueTag = cellBody.match(/<v\b[^>]*>([\s\S]*?)<\/v>/)?.[1] ?? "";

      let value = valueTag ? stripXml(valueTag).trim() : stripXml(inlineString).trim();
      if (type === "s" && value) {
        value = sharedStrings[Number(value)] ?? "";
      }

      cellMap.set(column, value);
    }

    return cellMap;
  });
}

async function loadImfWeoWorkbook() {
  if (imfWeoWorkbookCache) {
    return imfWeoWorkbookCache;
  }

  const response = await fetch(IMF_WEO_XLSX_URL, {
    next: { revalidate: 60 * 60 * 24 * 14 },
  } as RequestInit & { next: { revalidate: number } });

  if (!response.ok) {
    throw new Error("Failed to fetch IMF WEO workbook.");
  }

  const workbookBuffer = Buffer.from(await response.arrayBuffer());
  const [sheetXml, sharedStrings] = await Promise.all([
    readZipEntryFromBuffer(workbookBuffer, "xl/worksheets/sheet2.xml"),
    parseWEOSharedStrings(workbookBuffer),
  ]);

  const rows = parseSheetRows(sheetXml, sharedStrings);
  const headerRow = rows[0] ?? new Map<string, string>();
  const yearColumns = Array.from(headerRow.entries())
    .map(([column, label]) => ({ column, year: Number(label) }))
    .filter((item) => Number.isFinite(item.year));

  imfWeoWorkbookCache = {
    rows,
    yearColumns,
  };

  return imfWeoWorkbookCache;
}

function buildImfWeoSeriesMap(config: ImfWeoSeriesConfig) {
  let cache: Map<string, IndicatorSeries> | null = null;
  const currentYear = new Date().getUTCFullYear();

  return async function loadSeriesMap() {
    if (cache) {
      return cache;
    }

    const { rows, yearColumns } = await loadImfWeoWorkbook();
    const nextCache = new Map<string, IndicatorSeries>();

    for (const row of rows.slice(1)) {
      const countryIso3 = (row.get("C") ?? "").trim().toUpperCase();
      const sourceCode = (row.get("E") ?? "").trim().toUpperCase();

      if (!countryIso3 || !config.codes.includes(sourceCode)) {
        continue;
      }

      const allPoints = yearColumns.reduce<IndicatorPoint[]>((acc, { column, year }) => {
        const rawValue = parseNumber(row.get(column) ?? "");
        if (rawValue == null) {
          return acc;
        }

        acc.push({
          year,
          value: config.valueTransform ? config.valueTransform(rawValue) : rawValue,
        });

        return acc;
      }, []);

      const points = allPoints.filter((point) => point.year <= currentYear);

      if (points.length === 0) {
        continue;
      }

      const latest = points.at(-1) ?? null;
      nextCache.set(countryIso3, {
        indicatorId: config.indicatorId,
        sourceProvider: "imf",
        sourceName: config.sourceName,
        sourceCode,
        countryIso3,
        sourceLastUpdated: row.get("L") ?? null,
        frequency: "annual",
        coverageStartYear: points[0]?.year ?? null,
        coverageEndYear: latest?.year ?? null,
        latestAvailableLabel: latest ? String(latest.year) : null,
        comparableAcrossCountries: true,
        latestYear: latest?.year ?? null,
        latestValue: latest?.value ?? null,
        points,
      });
    }

    cache = nextCache;
    return cache;
  };
}

const loadImfDebtProxySeries = buildImfWeoSeriesMap(IMF_WEO_SERIES_CONFIG.debtProxy);
const loadImfInflationWeoSeries = buildImfWeoSeriesMap(IMF_WEO_SERIES_CONFIG.inflation);
const loadImfUnemploymentWeoSeries = buildImfWeoSeriesMap(IMF_WEO_SERIES_CONFIG.unemployment);
const loadImfGdpGrowthWeoSeries = buildImfWeoSeriesMap(IMF_WEO_SERIES_CONFIG.gdpGrowth);
const loadImfGdpWeoSeries = buildImfWeoSeriesMap(IMF_WEO_SERIES_CONFIG.gdp);
const loadImfGdpPerCapitaWeoSeries = buildImfWeoSeriesMap(IMF_WEO_SERIES_CONFIG.gdpPerCapita);

export async function fetchDebtProxySeriesMapFromImf(): Promise<Map<string, IndicatorSeries>> {
  return loadImfDebtProxySeries();
}

export async function fetchInflationSeriesMapFromImfWeo(): Promise<Map<string, IndicatorSeries>> {
  return loadImfInflationWeoSeries();
}

export async function fetchGdpGrowthSeriesMapFromImfWeo(): Promise<Map<string, IndicatorSeries>> {
  return loadImfGdpGrowthWeoSeries();
}

export async function fetchGdpSeriesMapFromImfWeo(): Promise<Map<string, IndicatorSeries>> {
  return loadImfGdpWeoSeries();
}

function extractObservations(payload: SdmxJsonResponse): SdmxObservation[] {
  const timeDimension = payload.data?.structure?.dimensions?.observation?.find(
    (dimension) => dimension.id === "TIME_PERIOD" || dimension.id === "TIME_PERIODS",
  ) ?? payload.data?.structure?.dimensions?.observation?.[0];

  const timeValues = timeDimension?.values ?? [];
  const seriesCollection = payload.data?.dataSets?.[0]?.series ?? {};
  const extracted: SdmxObservation[] = [];

  Object.values(seriesCollection).forEach((series) => {
    Object.entries(series.observations ?? {}).forEach(([observationIndex, values]) => {
      const rawValue = typeof values?.[0] === "number" ? values[0] : Number(values?.[0]);
      if (!Number.isFinite(rawValue)) {
        return;
      }

      const period = timeValues[Number(observationIndex)];
      const periodLabel = period?.id ?? period?.name ?? null;
      if (!periodLabel) {
        return;
      }

      extracted.push({
        periodLabel,
        rawValue,
      });
    });
  });

  return extracted.sort((a, b) => a.periodLabel.localeCompare(b.periodLabel));
}

function computeYearlyYoYPoints(observations: SdmxObservation[]) {
  const parsed = observations
    .map((observation) => {
      const period = parsePeriodLabel(observation.periodLabel);
      if (!period) {
        return null;
      }

      return {
        ...period,
        rawValue: observation.rawValue,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item != null)
    .sort((a, b) => a.normalized.localeCompare(b.normalized));

  if (parsed.length === 0) {
    return {
      points: [] as IndicatorPoint[],
      latestAvailableLabel: null as string | null,
      latestYear: null as number | null,
      latestValue: null as number | null,
      coverageStartYear: null as number | null,
      coverageEndYear: null as number | null,
    };
  }

  const lookup = new Map(parsed.map((item) => [`${item.year}:${item.comparisonKey}`, item.rawValue]));
  const yearlyLatest = new Map<number, { year: number; value: number; periodLabel: string; month: number }>();

  parsed.forEach((item) => {
    const previous = lookup.get(`${item.year - 1}:${item.comparisonKey}`);
    if (previous == null || previous === 0) {
      return;
    }

    const yoyValue = ((item.rawValue - previous) / Math.abs(previous)) * 100;
    const existing = yearlyLatest.get(item.year);

    if (!existing || item.month >= existing.month) {
      yearlyLatest.set(item.year, {
        year: item.year,
        value: yoyValue,
        periodLabel: item.normalized,
        month: item.month,
      });
    }
  });

  const ordered = [...yearlyLatest.values()].sort((a, b) => a.year - b.year);
  const latest = ordered.at(-1) ?? null;

  return {
    points: ordered.map((item) => ({
      year: item.year,
      value: Number(item.value.toFixed(2)),
    })),
    latestAvailableLabel: latest?.periodLabel ?? null,
    latestYear: latest?.year ?? null,
    latestValue: latest?.value != null ? Number(latest.value.toFixed(2)) : null,
    coverageStartYear: ordered[0]?.year ?? null,
    coverageEndYear: latest?.year ?? null,
  };
}

export async function fetchInflationSeriesFromImf(iso3: string): Promise<IndicatorSeries | null> {
  if (!IMF_API_KEY || !IMF_CPI_URL_TEMPLATE) {
    return null;
  }

  const source =
    getIndicatorDefinition("inflation").sources.fallback?.find((item) => item.provider === "imf") ?? {
      provider: "imf",
      sourceName: "IMF CPI / IFS",
      sourceCode: "CPI",
      frequency: "monthly",
      expectedStartYear: 2016,
      expectedEndYear: "latest-available",
      comparableAcrossCountries: true,
      notes: null,
    };
  const url = IMF_CPI_URL_TEMPLATE.replaceAll("{iso3}", encodeURIComponent(iso3));

  try {
    const response = await fetch(url, {
      headers: {
        "Ocp-Apim-Subscription-Key": IMF_API_KEY,
        Accept: "application/json, application/vnd.sdmx.data+json;version=1.0.0-wd",
      },
      next: { revalidate: 60 * 60 * 24 },
    } as RequestInit & { next: { revalidate: number } });

    if (!response.ok) {
      return null;
    }

    const rawText = await response.text();
    if (!rawText || isLikelyHtml(rawText)) {
      return null;
    }

    const payload = JSON.parse(rawText) as SdmxJsonResponse;
    const observations = extractObservations(payload);
    const series = computeYearlyYoYPoints(observations);

    if (series.points.length === 0) {
      return null;
    }

    return {
      indicatorId: "inflation",
      sourceProvider: source.provider,
      sourceName: source.sourceName,
      sourceCode: source.sourceCode,
      countryIso3: iso3,
      sourceLastUpdated: response.headers.get("last-modified"),
      frequency: source.frequency,
      coverageStartYear: series.coverageStartYear,
      coverageEndYear: series.coverageEndYear,
      latestAvailableLabel: series.latestAvailableLabel,
      comparableAcrossCountries: source.comparableAcrossCountries,
      latestYear: series.latestYear,
      latestValue: series.latestValue,
      points: series.points,
    };
  } catch {
    return null;
  }
}

export async function fetchDebtProxySeriesFromImf(iso3: string): Promise<IndicatorSeries | null> {
  try {
    const cache = await loadImfDebtProxySeries();
    return cache.get(iso3.toUpperCase()) ?? null;
  } catch {
    return null;
  }
}

export async function fetchInflationSeriesFromImfWeo(iso3: string): Promise<IndicatorSeries | null> {
  try {
    const cache = await loadImfInflationWeoSeries();
    return cache.get(iso3.toUpperCase()) ?? null;
  } catch {
    return null;
  }
}

export async function fetchUnemploymentSeriesFromImfWeo(iso3: string): Promise<IndicatorSeries | null> {
  try {
    const cache = await loadImfUnemploymentWeoSeries();
    return cache.get(iso3.toUpperCase()) ?? null;
  } catch {
    return null;
  }
}

export async function fetchGdpGrowthSeriesFromImfWeo(iso3: string): Promise<IndicatorSeries | null> {
  try {
    const cache = await loadImfGdpGrowthWeoSeries();
    return cache.get(iso3.toUpperCase()) ?? null;
  } catch {
    return null;
  }
}

export async function fetchGdpSeriesFromImfWeo(iso3: string): Promise<IndicatorSeries | null> {
  try {
    const cache = await loadImfGdpWeoSeries();
    return cache.get(iso3.toUpperCase()) ?? null;
  } catch {
    return null;
  }
}

export async function fetchGdpPerCapitaSeriesFromImfWeo(
  iso3: string,
): Promise<IndicatorSeries | null> {
  try {
    const cache = await loadImfGdpPerCapitaWeoSeries();
    return cache.get(iso3.toUpperCase()) ?? null;
  } catch {
    return null;
  }
}
