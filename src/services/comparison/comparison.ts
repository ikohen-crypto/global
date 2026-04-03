import { DEFAULT_COMPARISON_SCENARIOS } from "@/config/app";
import type {
  BudgetCategoryKey,
  ComparisonScenario,
  FinalBudgetSummary,
  ScenarioKey
} from "@/types";

import type {
  ComparisonCategoryRow,
  ComparisonMetric,
  ComparisonWorkspaceResult
} from "@/services/comparison/types";

const CATEGORY_LABELS: Record<BudgetCategoryKey, string> = {
  flights: "Flights",
  lodging: "Lodging",
  food: "Food",
  localTransport: "Local transport",
  activities: "Activities",
  extras: "Extras"
};

const CATEGORY_KEYS: BudgetCategoryKey[] = [
  "flights",
  "lodging",
  "food",
  "localTransport",
  "activities",
  "extras"
];

function getScenarioDefinition(
  scenarioKey: ScenarioKey,
  scenarios: ComparisonScenario[]
): ComparisonScenario {
  return (
    scenarios.find((scenario) => scenario.key === scenarioKey) ??
    DEFAULT_COMPARISON_SCENARIOS.find((scenario) => scenario.key === scenarioKey) ??
    DEFAULT_COMPARISON_SCENARIOS[1]
  );
}

function getCategoryValue(
  summary: FinalBudgetSummary,
  category: BudgetCategoryKey
): number {
  return summary[category].value;
}

function getCategorySourceWeight(summary: FinalBudgetSummary, category: BudgetCategoryKey): number {
  const sourceType = summary[category].sourceType;
  if (sourceType === "api") return 3;
  if (sourceType === "mixed") return 2.5;
  if (sourceType === "manual") return 2.25;
  if (sourceType === "mock") return 1.5;
  return 1;
}

function getSummaryConfidenceWeight(summary: FinalBudgetSummary): number {
  if (summary.confidence === "high") return 3;
  if (summary.confidence === "medium") return 2;
  return 1;
}

function getScenarioTotal(
  summary: FinalBudgetSummary,
  scenarioKey: ScenarioKey,
  scenarios: ComparisonScenario[]
): number {
  if (scenarioKey === "expected") {
    return summary.value;
  }

  const existing = summary.scenarioTotals?.[scenarioKey];
  if (typeof existing === "number" && Number.isFinite(existing) && existing > 0) {
    return existing;
  }

  const scenario = getScenarioDefinition(scenarioKey, scenarios);
  return CATEGORY_KEYS.reduce((total, categoryKey) => {
    const multiplier = scenario.multipliers[categoryKey] ?? 1;
    return total + getCategoryValue(summary, categoryKey) * multiplier;
  }, 0);
}

function getPerPersonScale(summary: FinalBudgetSummary, scenarioTotal: number): number {
  if (summary.value <= 0) return 1;
  return scenarioTotal / summary.value;
}

function getConfidenceScore(summary: FinalBudgetSummary): number {
  const categoryAverage =
    CATEGORY_KEYS.reduce((sum, categoryKey) => sum + getCategorySourceWeight(summary, categoryKey), 0) /
    CATEGORY_KEYS.length;

  return getSummaryConfidenceWeight(summary) * 0.6 + categoryAverage * 0.4;
}

export function compareDestinationSummaries(
  summaries: FinalBudgetSummary[],
  scenarioKey: ScenarioKey = "expected",
  scenarios: ComparisonScenario[] = DEFAULT_COMPARISON_SCENARIOS
): ComparisonWorkspaceResult {
  const scored = summaries.map<ComparisonMetric>((summary) => {
    const scenarioTotal = getScenarioTotal(summary, scenarioKey, scenarios);
    const scale = getPerPersonScale(summary, scenarioTotal);

    return {
      destinationId: summary.destination.id,
      destinationLabel: summary.destination.label,
      summary,
      scenarioKey,
      scenarioTotal,
      totalPerPerson: summary.totalPerPerson * scale,
      totalPerDay: summary.totalPerDay * scale,
      rank: 0,
      savingsFromCheapest: 0,
      confidenceScore: getConfidenceScore(summary)
    };
  });

  scored.sort((left, right) => {
    if (left.scenarioTotal !== right.scenarioTotal) {
      return left.scenarioTotal - right.scenarioTotal;
    }

    if (right.confidenceScore !== left.confidenceScore) {
      return right.confidenceScore - left.confidenceScore;
    }

    return left.destinationLabel.localeCompare(right.destinationLabel);
  });

  const cheapestScenarioTotal = scored[0]?.scenarioTotal ?? 0;
  const rankedDestinations = scored.map((entry, index) => ({
    ...entry,
    rank: index + 1,
    savingsFromCheapest: Math.max(0, entry.scenarioTotal - cheapestScenarioTotal)
  }));

  const highestConfidenceDestinationId =
    [...rankedDestinations].sort((left, right) => {
      if (right.confidenceScore !== left.confidenceScore) {
        return right.confidenceScore - left.confidenceScore;
      }

      return left.scenarioTotal - right.scenarioTotal;
    })[0]?.destinationId ?? undefined;

  return {
    scenarios,
    rankedDestinations,
    cheapestDestinationId: rankedDestinations[0]?.destinationId,
    highestConfidenceDestinationId
  };
}

export function buildCategoryRows(
  summaries: FinalBudgetSummary[]
): ComparisonCategoryRow[] {
  if (summaries.length === 0) {
    return CATEGORY_KEYS.map((categoryKey) => ({
      key: categoryKey,
      label: CATEGORY_LABELS[categoryKey],
      currency: "USD",
      cells: [],
      spread: 0
    }));
  }

  return CATEGORY_KEYS.map((categoryKey) => {
    const values = summaries.map((summary) => ({
      destinationId: summary.destination.id,
      destinationLabel: summary.destination.label,
      value: getCategoryValue(summary, categoryKey),
      sourceType: summary[categoryKey].sourceType,
      confidence: summary[categoryKey].confidence,
      currency: summary[categoryKey].currency,
      isCheapest: false
    }));

    const cheapestValue = Math.min(...values.map((cell) => cell.value));
    const mostExpensiveValue = Math.max(...values.map((cell) => cell.value));

    return {
      key: categoryKey,
      label: CATEGORY_LABELS[categoryKey],
      currency: values[0]?.currency ?? "USD",
      cells: values.map((cell) => ({
        ...cell,
        isCheapest: cell.value === cheapestValue
      })),
      spread: Math.max(0, mostExpensiveValue - cheapestValue)
    };
  });
}

export function getScenarioSummary(
  summary: FinalBudgetSummary,
  scenarioKey: ScenarioKey,
  scenarios: ComparisonScenario[] = DEFAULT_COMPARISON_SCENARIOS
): ComparisonMetric {
  const scenarioTotal = getScenarioTotal(summary, scenarioKey, scenarios);
  const scale = getPerPersonScale(summary, scenarioTotal);

  return {
    destinationId: summary.destination.id,
    destinationLabel: summary.destination.label,
    summary,
    scenarioKey,
    scenarioTotal,
    totalPerPerson: summary.totalPerPerson * scale,
    totalPerDay: summary.totalPerDay * scale,
    rank: 0,
    savingsFromCheapest: 0,
    confidenceScore: getConfidenceScore(summary)
  };
}
