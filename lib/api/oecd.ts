import {
  normalizeOecdInflationCsv,
  normalizeOecdInterestRateCsv,
  normalizeOecdQuarterlyGrowthCsv,
  normalizeOecdUnemploymentCsv,
} from "@/lib/normalizers/oecd";
import type { IndicatorSeries } from "@/lib/types";

const OECD_BASE_URL = "https://sdmx.oecd.org/public/rest/data";
const OECD_PRICES_DATAFLOW = "OECD.SDD.TPS,DSD_PRICES@DF_PRICES_ALL,1.0";
const OECD_UNEMPLOYMENT_DATAFLOW = "OECD.SDD.TPS,DSD_LFS@DF_IALFS_UNE_M,1.0";
const OECD_GDP_GROWTH_DATAFLOW = "OECD.SDD.NAD,DSD_NAMAIN1@DF_QNA_EXPENDITURE_GROWTH_OECD,1.0";
const OECD_FINMARK_DATAFLOW = "OECD.SDD.STES,DSD_STES@DF_FINMARK,4.0";

async function fetchOecdCsv(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.sdmx.data+csv;version=2.0.0",
      "Accept-Language": "en",
      Referer: "https://sdmx.oecd.org/",
    },
    next: { revalidate: 60 * 60 * 12 },
  } as RequestInit & { next: { revalidate: number } });

  if (!response.ok) {
    return null;
  }

  const csv = await response.text();
  if (!csv || csv.startsWith("<") || csv.trim() === "languageTag1") {
    return null;
  }

  return {
    csv,
    lastModified: response.headers.get("last-modified"),
  };
}

export async function fetchInflationSeriesFromOecd(
  iso3: string,
): Promise<IndicatorSeries | null> {
  const query = `${iso3}.M.N.CPI.PA._T.N.GY`;
  const url =
    `${OECD_BASE_URL}/${OECD_PRICES_DATAFLOW}/${query}` +
    "?startPeriod=2000-01&dimensionAtObservation=AllDimensions&format=csvfilewithlabels";

  try {
    const payload = await fetchOecdCsv(url);
    if (!payload) return null;
    return normalizeOecdInflationCsv(payload.csv, iso3, payload.lastModified);
  } catch {
    return null;
  }
}

export async function fetchUnemploymentSeriesFromOecd(
  iso3: string,
): Promise<IndicatorSeries | null> {
  const query = `${iso3}.UNE_LF_M.PT_LF_SUB._Z.Y._T.Y_GE15._Z.M`;
  const url =
    `${OECD_BASE_URL}/${OECD_UNEMPLOYMENT_DATAFLOW}/${query}` +
    "?startPeriod=2000-01&dimensionAtObservation=AllDimensions&format=csvfilewithlabels";

  try {
    const payload = await fetchOecdCsv(url);
    if (!payload) return null;
    return normalizeOecdUnemploymentCsv(payload.csv, iso3, payload.lastModified);
  } catch {
    return null;
  }
}

export async function fetchGdpGrowthSeriesFromOecd(
  iso3: string,
): Promise<IndicatorSeries | null> {
  const query = `Q.Y.${iso3}.S1.S1.B1GQ._Z._Z._Z.PC.L.GY.T0102`;
  const url =
    `${OECD_BASE_URL}/${OECD_GDP_GROWTH_DATAFLOW}/${query}` +
    "?startPeriod=2000-Q1&dimensionAtObservation=AllDimensions&format=csvfilewithlabels";

  try {
    const payload = await fetchOecdCsv(url);
    if (!payload) return null;
    return normalizeOecdQuarterlyGrowthCsv(payload.csv, iso3, "gdpGrowth", payload.lastModified);
  } catch {
    return null;
  }
}

export async function fetchInterestRateSeriesFromOecd(
  iso3: string,
): Promise<IndicatorSeries | null> {
  const query = `${iso3}.M.IR3TIB.PA._Z._Z._Z._Z.N`;
  const url =
    `${OECD_BASE_URL}/${OECD_FINMARK_DATAFLOW}/${query}` +
    "?startPeriod=2000-01&dimensionAtObservation=AllDimensions&format=csvfilewithlabels";

  try {
    const payload = await fetchOecdCsv(url);
    if (!payload) return null;
    return normalizeOecdInterestRateCsv(payload.csv, iso3, payload.lastModified);
  } catch {
    return null;
  }
}
