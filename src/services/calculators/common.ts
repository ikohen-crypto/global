import type {
  BudgetCategoryKey,
  BudgetValue,
  ComparisonScenario,
  DataSourceType,
  EstimateExplanation,
  MoneyRange,
  PriceConfidence
} from "@/types";
import { roundCurrency } from "@/utils/currency";

export interface ManualOverrideInput {
  value: number;
  currency: string;
  reason?: string;
  appliedAt?: string;
}

export interface BudgetBuildInput {
  value: number;
  currency: string;
  sourceType?: DataSourceType;
  confidence?: PriceConfidence;
  explanation: EstimateExplanation;
  range?: MoneyRange;
  sourceName?: string;
  limitations?: string[];
  lastUpdatedAt?: string;
}

export interface MaybeExplainedValue {
  value: number;
  currency: string;
  sourceType: DataSourceType;
  confidence: PriceConfidence;
  explanation: EstimateExplanation;
  range: MoneyRange;
}

export function money(value: number): number {
  return roundCurrency(value);
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function sum(values: number[]): number {
  return money(values.reduce((accumulator, current) => accumulator + current, 0));
}

export function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return money(sum(values) / values.length);
}

export function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return money((sorted[middle - 1] + sorted[middle]) / 2);
  }

  return money(sorted[middle]);
}

export function createExplanation(
  summary: string,
  methodology: string,
  inputs: EstimateExplanation["inputs"],
  options?: {
    formula?: string;
    sourceNotes?: string[];
    technicalNotes?: string[];
    limitations?: string[];
  }
): EstimateExplanation {
  return {
    summary,
    methodology,
    inputs,
    formula: options?.formula,
    sourceNotes: options?.sourceNotes,
    technicalNotes: options?.technicalNotes,
    limitations: options?.limitations
  };
}

export function createRange(
  value: number,
  minimumMultiplier: number,
  highMultiplier: number,
  currency: string
): MoneyRange {
  const expected = money(value);
  return {
    minimum: money(expected * minimumMultiplier),
    expected,
    high: money(expected * highMultiplier),
    currency
  };
}

export function createBudgetValue(input: BudgetBuildInput): BudgetValue {
  return {
    value: money(input.value),
    currency: input.currency,
    sourceType: input.sourceType ?? "estimated",
    confidence: input.confidence ?? "medium",
    explanation: input.explanation,
    range:
      input.range ?? createRange(input.value, 0.85, 1.25, input.currency),
    sourceName: input.sourceName,
    limitations: input.limitations,
    lastUpdatedAt: input.lastUpdatedAt
  };
}

export function applyManualOverride<T extends BudgetValue>(
  result: T,
  override: ManualOverrideInput | undefined,
  buildExplanation: (override: ManualOverrideInput, original: T) => EstimateExplanation
): T {
  if (!override) {
    return result;
  }

  return {
    ...result,
    value: money(override.value),
    currency: override.currency,
    sourceType: "manual",
    confidence: "high",
    range: {
      minimum: money(override.value),
      expected: money(override.value),
      high: money(override.value),
      currency: override.currency
    },
    explanation: buildExplanation(override, result)
  };
}

export function combineConfidence(values: PriceConfidence[]): PriceConfidence {
  if (values.length === 0) {
    return "low";
  }

  const score = values.reduce((accumulator, confidence) => {
    if (confidence === "high") {
      return accumulator + 3;
    }

    if (confidence === "medium") {
      return accumulator + 2;
    }

    return accumulator + 1;
  }, 0);

  const average = score / values.length;

  if (average >= 2.6) {
    return "high";
  }

  if (average >= 1.8) {
    return "medium";
  }

  return "low";
}

export function combineSourceType(values: DataSourceType[]): DataSourceType {
  const unique = [...new Set(values)];

  if (unique.length === 1) {
    return unique[0];
  }

  if (unique.includes("mixed")) {
    return "mixed";
  }

  if (unique.includes("manual") && unique.length === 1) {
    return "manual";
  }

  return "mixed";
}

export function applyScenarioMultiplier(value: number, multiplier: number | undefined): number {
  if (typeof multiplier !== "number" || !Number.isFinite(multiplier)) {
    return money(value);
  }

  return money(value * multiplier);
}

export function scenarioTotal(
  categories: Record<BudgetCategoryKey, BudgetValue>,
  scenario: ComparisonScenario
): number {
  return sum(
    (Object.keys(categories) as BudgetCategoryKey[]).map((key) =>
      applyScenarioMultiplier(categories[key].value, scenario.multipliers[key] ?? 1)
    )
  );
}

export function preserveOriginalExplanation(
  original: EstimateExplanation,
  note: string
): EstimateExplanation {
  return {
    ...original,
    sourceNotes: [...(original.sourceNotes ?? []), note]
  };
}
