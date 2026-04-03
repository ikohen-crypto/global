import type {
  BudgetCategoryKey,
  ComparisonScenario,
  CurrencyCode,
  FinalBudgetSummary,
  ScenarioKey
} from "@/types";

export interface ComparisonMetric {
  destinationId: string;
  destinationLabel: string;
  summary: FinalBudgetSummary;
  scenarioKey: ScenarioKey;
  scenarioTotal: number;
  totalPerPerson: number;
  totalPerDay: number;
  rank: number;
  savingsFromCheapest: number;
  confidenceScore: number;
}

export interface ComparisonWorkspaceResult {
  scenarios: ComparisonScenario[];
  rankedDestinations: ComparisonMetric[];
  cheapestDestinationId?: string;
  highestConfidenceDestinationId?: string;
}

export interface ComparisonCategoryCell {
  destinationId: string;
  destinationLabel: string;
  value: number;
  sourceType: FinalBudgetSummary["sourceType"];
  confidence: FinalBudgetSummary["confidence"];
  currency: CurrencyCode;
  isCheapest: boolean;
}

export interface ComparisonCategoryRow {
  key: BudgetCategoryKey;
  label: string;
  currency: CurrencyCode;
  cells: ComparisonCategoryCell[];
  spread: number;
}

export interface SavedComparisonSimulation {
  id: string;
  name: string;
  notes?: string;
  scenarioKey: ScenarioKey;
  createdAt: string;
  updatedAt: string;
  summaries: FinalBudgetSummary[];
}

export interface SaveComparisonInput {
  name: string;
  notes?: string;
  scenarioKey: ScenarioKey;
  summaries: FinalBudgetSummary[];
}
