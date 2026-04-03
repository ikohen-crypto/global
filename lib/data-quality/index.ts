import { getIndicatorDefinition } from "@/lib/indicators/registry";
import type {
  DataQualityFlag,
  FreshnessStatus,
  IndicatorId,
  IndicatorSeries,
  MetricSnapshot,
} from "@/lib/types";

function extractYearMonth(label: string | null, latestYear: number | null) {
  if (label) {
    const monthly = /^(\d{4})-(\d{2})$/.exec(label);
    if (monthly) {
      return { year: Number(monthly[1]), month: Number(monthly[2]) };
    }

    const quarterly = /^(\d{4})-Q([1-4])$/.exec(label);
    if (quarterly) {
      return { year: Number(quarterly[1]), month: Number(quarterly[2]) * 3 };
    }

    const annual = /^(\d{4})$/.exec(label);
    if (annual) {
      return { year: Number(annual[1]), month: 12 };
    }
  }

  if (latestYear != null) {
    return { year: latestYear, month: 12 };
  }

  return null;
}

function monthsBehind(label: string | null, latestYear: number | null) {
  const resolved = extractYearMonth(label, latestYear);
  if (!resolved) {
    return null;
  }

  const now = new Date();
  return (now.getUTCFullYear() - resolved.year) * 12 + (now.getUTCMonth() + 1 - resolved.month);
}

export function getFreshnessStatus(
  frequency: IndicatorSeries["frequency"] | MetricSnapshot["freshnessStatus"] | null,
  latestLabel: string | null,
  latestYear: number | null,
): FreshnessStatus | null {
  if (!frequency) {
    return null;
  }

  const lag = monthsBehind(latestLabel, latestYear);
  if (lag == null) {
    return null;
  }

  const thresholds =
    frequency === "monthly"
      ? { fresh: 4, lagged: 12 }
      : frequency === "quarterly"
        ? { fresh: 6, lagged: 15 }
        : { fresh: 18, lagged: 33 };

  if (lag <= thresholds.fresh) {
    return "fresh";
  }

  if (lag <= thresholds.lagged) {
    return "lagged";
  }

  return "stale";
}

export function getQualityFlags(
  indicatorId: IndicatorId,
  series: Pick<IndicatorSeries, "sourceProvider" | "sourceName" | "sourceCode" | "latestYear"> | null,
  label: string,
): DataQualityFlag[] {
  const flags = new Set<DataQualityFlag>();
  const currentYear = new Date().getUTCFullYear();

  if (!series) {
    return [];
  }

  if (label === "Debt proxy" || label === "Interest-rate proxy") {
    flags.add("proxy");
  }

  const primaryProvider = getIndicatorDefinition(indicatorId).sources.primary.provider;
  if (series.sourceProvider !== primaryProvider) {
    flags.add("fallback");
  }

  if (series.sourceProvider === "imf" && series.sourceName.toLowerCase().includes("includes estimates/projections")) {
    if (series.latestYear != null && series.latestYear > currentYear) {
      flags.add("projection");
    } else if (series.latestYear != null && series.latestYear === currentYear) {
      flags.add("estimate");
    }
  }

  if (series.sourceProvider === "un" && series.latestYear != null && series.latestYear >= 2024) {
    flags.add("estimate");
  }

  return [...flags];
}
