import type { CountryProfile, MetricSnapshot } from "@/lib/types";

export type ScoreTone = "good" | "neutral" | "warn" | "risk";
export type ScoreCardData = {
  id: string;
  score: number | null;
  tone: ScoreTone;
  summary: string;
};

export type ChangeDirection = "improved" | "worsened";
export type ChangeSignalData = {
  id: string;
  metricKey: "inflation" | "gdpGrowth" | "unemployment" | "interestRate" | "debtPressure";
  direction: ChangeDirection;
  delta: number;
  countryName?: string;
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
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

function weightedAverage(items: Array<{ value: number | null; weight: number }>) {
  const valid = items.filter((item) => item.value != null) as Array<{ value: number; weight: number }>;
  if (valid.length === 0) return null;

  const totalWeight = valid.reduce((sum, item) => sum + item.weight, 0);
  return valid.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight;
}

function latest(metric: MetricSnapshot) {
  return metric.value;
}

function getRecentPair(metric: MetricSnapshot) {
  const points = metric.trend.filter((point) => point.value != null);
  if (points.length < 2) return null;

  const latestPoint = points[points.length - 1];
  const comparisonPoint = points[Math.max(0, points.length - 4)] ?? points[0];
  const latestValue = latestPoint.value;
  const previousValue = comparisonPoint.value;

  if (latestValue == null || previousValue == null) return null;

  return {
    latestValue,
    previousValue,
    latestYear: latestPoint.year,
    previousYear: comparisonPoint.year,
    delta: latestValue - previousValue,
  };
}

function getDebtPressure(profile: CountryProfile) {
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

function classifyTone(score: number | null): ScoreTone {
  if (score == null) return "neutral";
  if (score >= 70) return "good";
  if (score >= 50) return "neutral";
  if (score >= 35) return "warn";
  return "risk";
}

export function buildCountryScorecards(profile: CountryProfile): ScoreCardData[] {
  const inflationScore = scaleLowGood(latest(profile.metrics.inflation), 0, 40);
  const growthScore = scaleHighGood(latest(profile.metrics.gdpGrowth), -5, 10);
  const unemploymentScore = scaleLowGood(latest(profile.metrics.unemployment), 2, 20);
  const fundingScore = scaleLowGood(latest(profile.metrics.interestRate), 0, 15);
  const debtScore = scaleLowGood(getDebtPressure(profile), 0, 150);
  const sizeScore = weightedAverage([
    { value: scaleHighGood(latest(profile.metrics.gdp), 0, 2_500_000_000_000), weight: 0.55 },
    { value: scaleHighGood(latest(profile.metrics.population), 500_000, 350_000_000), weight: 0.25 },
    { value: scaleHighGood(latest(profile.metrics.gdpPerCapita), 1_500, 90_000), weight: 0.2 },
  ]);

  const cards: Array<{ id: ScoreCardData["id"]; score: number | null }> = [
    {
      id: "macro-stability",
      score: weightedAverage([
        { value: inflationScore, weight: 0.4 },
        { value: unemploymentScore, weight: 0.15 },
        { value: fundingScore, weight: 0.2 },
        { value: debtScore, weight: 0.25 },
      ]),
    },
    {
      id: "growth-quality",
      score: weightedAverage([
        { value: growthScore, weight: 0.45 },
        { value: inflationScore, weight: 0.2 },
        { value: unemploymentScore, weight: 0.15 },
        { value: scaleHighGood(latest(profile.metrics.gdpPerCapita), 1_500, 90_000), weight: 0.2 },
      ]),
    },
    {
      id: "funding-conditions",
      score: weightedAverage([
        { value: fundingScore, weight: 0.6 },
        { value: inflationScore, weight: 0.25 },
        { value: growthScore, weight: 0.15 },
      ]),
    },
    {
      id: "debt-risk",
      score: weightedAverage([
        { value: debtScore, weight: 0.65 },
        { value: growthScore, weight: 0.2 },
        { value: inflationScore, weight: 0.15 },
      ]),
    },
    {
      id: "market-scale",
      score: sizeScore,
    },
  ];

  return cards.map((card) => ({
    ...card,
    tone: classifyTone(card.score),
    summary: card.score == null ? "insufficient-data" : card.score >= 70 ? "strong" : card.score >= 50 ? "balanced" : card.score >= 35 ? "mixed" : "fragile",
  }));
}

export function buildCountryRecentChanges(profile: CountryProfile): {
  improvements: ChangeSignalData[];
  deteriorations: ChangeSignalData[];
} {
  const inflation = getRecentPair(profile.metrics.inflation);
  const growth = getRecentPair(profile.metrics.gdpGrowth);
  const unemployment = getRecentPair(profile.metrics.unemployment);
  const rates = getRecentPair(profile.metrics.interestRate);
  const debt = getRecentPair(profile.metrics.externalDebt);

  const changes: ChangeSignalData[] = [];

  if (inflation && Math.abs(inflation.delta) >= 1) {
    changes.push({
      id: "inflation",
      metricKey: "inflation",
      direction: inflation.delta < 0 ? "improved" : "worsened",
      delta: Math.abs(inflation.delta),
    });
  }

  if (growth && Math.abs(growth.delta) >= 0.75) {
    changes.push({
      id: "gdpGrowth",
      metricKey: "gdpGrowth",
      direction: growth.delta > 0 ? "improved" : "worsened",
      delta: Math.abs(growth.delta),
    });
  }

  if (unemployment && Math.abs(unemployment.delta) >= 0.5) {
    changes.push({
      id: "unemployment",
      metricKey: "unemployment",
      direction: unemployment.delta < 0 ? "improved" : "worsened",
      delta: Math.abs(unemployment.delta),
    });
  }

  if (rates && Math.abs(rates.delta) >= 0.75) {
    changes.push({
      id: "interestRate",
      metricKey: "interestRate",
      direction: rates.delta < 0 ? "improved" : "worsened",
      delta: Math.abs(rates.delta),
    });
  }

  if (debt && Math.abs(debt.delta) >= 2) {
    changes.push({
      id: "debtPressure",
      metricKey: "debtPressure",
      direction: debt.delta < 0 ? "improved" : "worsened",
      delta: Math.abs(debt.delta),
    });
  }

  return {
    improvements: changes.filter((item) => item.direction === "improved").sort((a, b) => b.delta - a.delta).slice(0, 3),
    deteriorations: changes.filter((item) => item.direction === "worsened").sort((a, b) => b.delta - a.delta).slice(0, 3),
  };
}

export function buildCompareScoreLeaders(profiles: CountryProfile[]) {
  const scoreMap = profiles.map((profile) => ({
    profile,
    scores: buildCountryScorecards(profile),
  }));

  const ids = ["macro-stability", "growth-quality", "funding-conditions", "debt-risk", "market-scale"] as const;

  return ids
    .map((id) => {
      const sorted = scoreMap
        .map((entry) => ({ profile: entry.profile, score: entry.scores.find((item) => item.id === id)?.score ?? null }))
        .filter((entry): entry is { profile: CountryProfile; score: number } => entry.score != null)
        .sort((a, b) => b.score - a.score);

      return sorted[0] ? { id, countryName: sorted[0].profile.country.name, score: sorted[0].score } : null;
    })
    .filter((item): item is { id: (typeof ids)[number]; countryName: string; score: number } => item != null);
}

export function buildCompareRecentMovers(profiles: CountryProfile[]): ChangeSignalData[] {
  return profiles
    .flatMap((profile) => {
      const changes = buildCountryRecentChanges(profile);
      return [...changes.improvements, ...changes.deteriorations].map((change) => ({
        ...change,
        countryName: profile.country.name,
      }));
    })
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 4);
}
