import type {
  BudgetApiErrorResponse,
  BudgetApiResponse
} from "./contracts.js";
import type {
  ComparisonScenario,
  DataSourceType,
  DestinationOption,
  TripSearchInput
} from "./budget.js";

export interface DestinationSearchRequest {
  query: string;
}

export interface DestinationSearchResponse {
  requestedAt?: string;
  destinations: DestinationOption[];
  sourceType: Exclude<DataSourceType, "manual">;
  limitations: string[];
}

export interface CompareBudgetsRequest {
  input: TripSearchInput;
  useMock?: boolean;
}

export interface ReferenceConfigResponse {
  requestedAt?: string;
  appName: string;
  defaultCurrency: string;
  defaultOrigin: DestinationOption;
  supportedCurrencies: string[];
  dataAvailability: {
    flights: "api-ready" | "demo-fallback";
    lodging: "api-ready" | "demo-fallback";
    activities: "api-ready" | "demo-fallback";
    exchangeRates: "api-ready" | "demo-fallback";
    destinationSearch: "api-ready" | "demo-fallback";
  };
  assumptionNotes: string[];
  lastUpdatedAt: string;
  supportsMockMode?: boolean;
  scenarios: ComparisonScenario[];
  providers: Array<{
    key: string;
    label: string;
    configured: boolean;
    coverage: string[];
  }>;
}

export type CompareBudgetsResponse = BudgetApiResponse;

export type ApiErrorResponse = BudgetApiErrorResponse;
