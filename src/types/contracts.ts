import type {
  BudgetCategoryKey,
  CurrencyCode,
  DataSourceType,
  DestinationOption,
  FinalBudgetSummary,
  PriceConfidence,
  TripSearchInput
} from "./budget.js";

export type ApiErrorCode =
  | "network_error"
  | "timeout"
  | "rate_limited"
  | "unauthorized"
  | "invalid_response"
  | "empty_response"
  | "not_configured"
  | "upstream_unavailable";

export interface AdapterError {
  sourceName: string;
  code: ApiErrorCode;
  message: string;
  retriable: boolean;
  statusCode?: number;
  details?: unknown;
}

export interface AdapterSuccess<TNormalized> {
  ok: true;
  sourceName: string;
  sourceType: Exclude<DataSourceType, "manual">;
  fetchedAt: string;
  confidence: PriceConfidence;
  currency: CurrencyCode;
  rawValue: unknown;
  normalizedValue: TNormalized;
  limitations: string[];
}

export interface AdapterFailure {
  ok: false;
  error: AdapterError;
  limitations: string[];
}

export type AdapterResult<TNormalized> =
  | AdapterSuccess<TNormalized>
  | AdapterFailure;

export interface AdapterExecutionOptions {
  timeoutMs?: number;
  useMock?: boolean;
}

export interface ApiAdapter<TInput, TNormalized> {
  readonly sourceName: string;
  readonly sourceType: Exclude<DataSourceType, "manual">;
  isConfigured(): boolean;
  execute(
    input: TInput,
    options?: AdapterExecutionOptions
  ): Promise<AdapterResult<TNormalized>>;
}

export interface NormalizedBudgetRequest {
  input: TripSearchInput;
  requestedAt: string;
}

export interface BudgetComputationSnapshot<TReferenceData> {
  input: TripSearchInput;
  destination: DestinationOption;
  referenceData: TReferenceData;
}

export interface InternalEstimator<TContext, TResult> {
  readonly estimatorName: string;
  estimate(context: TContext): TResult;
}

export interface ManualOverrideAware<TResult> {
  applyManualOverrides(
    result: TResult,
    overrides: Partial<Record<BudgetCategoryKey, { value: number; reason?: string }>>
  ): TResult;
}

export interface BudgetApiResponse {
  requestedAt: string;
  summaries: FinalBudgetSummary[];
  warnings: string[];
}

export interface BudgetApiErrorResponse {
  requestedAt: string;
  message: string;
  code: ApiErrorCode | "validation_error" | "internal_error";
  retryable: boolean;
  details?: unknown;
}
