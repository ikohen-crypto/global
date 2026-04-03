import { formatNumber } from "@/lib/formatters";
import type { CountrySummary, FinancialRankingId, FinancialRankingRow, MetricSnapshot } from "@/lib/types";

type FinancialRankingMetrics = {
  inflation: MetricSnapshot;
  gdpGrowth: MetricSnapshot;
  interestRate: MetricSnapshot;
  externalDebt: MetricSnapshot;
  gdp: MetricSnapshot;
};

type FinancialRankingProfile = {
  country: CountrySummary;
  metrics: FinancialRankingMetrics;
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

function latest(metric: MetricSnapshot) {
  return metric.value;
}

function scaleHighGood(value: number | null, min: number, max: number) {
  if (value == null) return null;
  if (max <= min) return 50;
  return clampScore(((value - min) / (max - min)) * 100);
}

function scaleLowGood(value: number | null, min: number, max: number) {
  const scaled = scaleHighGood(value, min, max);
  return scaled == null ? null : clampScore(100 - scaled);
}

function weightAverage(items: Array<{ value: number | null; weight: number }>) {
  const valid = items.filter((item) => item.value != null) as Array<{ value: number; weight: number }>;
  if (valid.length === 0) return null;

  const totalWeight = valid.reduce((sum, item) => sum + item.weight, 0);
  return valid.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight;
}

function debtPressureMetric(profile: FinancialRankingProfile) {
  const debt = latest(profile.metrics.externalDebt);
  const gdp = latest(profile.metrics.gdp);

  if (profile.metrics.externalDebt.label === "Debt proxy") {
    return debt;
  }

  if (debt == null || gdp == null || gdp <= 0) {
    return null;
  }

  return (debt / gdp) * 100;
}

function fundingMetric(profile: FinancialRankingProfile) {
  return latest(profile.metrics.interestRate);
}

function buildSummary(profile: FinancialRankingProfile, rankingId: FinancialRankingId) {
  const inflation = profile.metrics.inflation.formattedValue;
  const growth = profile.metrics.gdpGrowth.formattedValue;
  const funding = profile.metrics.interestRate.formattedValue;
  const debt = profile.metrics.externalDebt.label === "Debt proxy"
    ? profile.metrics.externalDebt.formattedValue
    : profile.metrics.externalDebt.value != null && profile.metrics.gdp.value != null && profile.metrics.gdp.value > 0
      ? `${formatNumber((profile.metrics.externalDebt.value / profile.metrics.gdp.value) * 100, "%")}`
      : profile.metrics.externalDebt.formattedValue;

  if (rankingId === "macro-stability") {
    return `Inflation ${inflation}, funding ${funding}, debt pressure ${debt}.`;
  }

  if (rankingId === "growth-vs-inflation") {
    return `Growth ${growth} against inflation ${inflation}.`;
  }

  if (rankingId === "debt-pressure") {
    return `Debt pressure around ${debt} with GDP growth at ${growth}.`;
  }

  return `Funding backdrop at ${funding} with inflation at ${inflation}.`;
}

export const financialRankingDefinitions = {
  "macro-stability": {
    title: "Macro stability rankings",
    description: "Countries with the cleanest mix of inflation, funding backdrop, and debt pressure.",
  },
  "growth-vs-inflation": {
    title: "Growth vs inflation rankings",
    description: "Countries balancing stronger growth momentum against lower inflation pressure.",
  },
  "debt-pressure": {
    title: "Debt pressure rankings",
    description: "Countries with the lightest debt burden relative to output or the cleanest debt proxy available.",
  },
  "funding-cost": {
    title: "Funding cost rankings",
    description: "Countries with the least restrictive financing backdrop based on short-term rates or clean fallbacks.",
  },
} satisfies Record<FinancialRankingId, { title: string; description: string }>;

export function buildFinancialRankingRows(
  profiles: FinancialRankingProfile[],
  rankingId: FinancialRankingId,
): FinancialRankingRow[] {
  return profiles
    .map((profile) => {
      const inflationScore = scaleLowGood(latest(profile.metrics.inflation), 0, 40);
      const growthScore = scaleHighGood(latest(profile.metrics.gdpGrowth), -5, 10);
      const debtScore = scaleLowGood(debtPressureMetric(profile), 0, 150);
      const fundingScore = scaleLowGood(fundingMetric(profile), 0, 15);

      const score =
        rankingId === "macro-stability"
          ? weightAverage([
              { value: inflationScore, weight: 0.4 },
              { value: debtScore, weight: 0.35 },
              { value: fundingScore, weight: 0.25 },
            ])
          : rankingId === "growth-vs-inflation"
            ? weightAverage([
                { value: growthScore, weight: 0.55 },
                { value: inflationScore, weight: 0.45 },
              ])
            : rankingId === "debt-pressure"
              ? weightAverage([
                  { value: debtScore, weight: 0.8 },
                  { value: growthScore, weight: 0.2 },
                ])
              : weightAverage([
                  { value: fundingScore, weight: 0.75 },
                  { value: inflationScore, weight: 0.25 },
                ]);

      return score == null
        ? null
        : ({
            country: profile.country,
            score: Number(score.toFixed(1)),
            formattedScore: `${Number(score.toFixed(1))}/100`,
            summary: buildSummary(profile, rankingId),
            latestPeriodLabel:
              profile.metrics.inflation.latestLabel ??
              profile.metrics.gdpGrowth.latestLabel ??
              profile.metrics.interestRate.latestLabel ??
              profile.metrics.externalDebt.latestLabel ??
              null,
          } satisfies FinancialRankingRow);
    })
    .filter((row): row is FinancialRankingRow => row != null)
    .sort((left, right) => right.score - left.score);
}
