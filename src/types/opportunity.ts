export type OpportunityLabel =
  | "Oportunidad fuerte"
  | "Oportunidad moderada"
  | "Riesgoso / saturado"
  | "Mercado en descenso";

export type OpportunityVerdict =
  | "enter_now"
  | "enter_with_subniche"
  | "validate_carefully"
  | "avoid_for_now";

export type DataStatus = "live" | "fallback" | "unavailable";

export interface OpportunityAnalyzeInput {
  keyword: string;
  locale?: string;
  geo?: string;
  language?: "es" | "en";
  timeRange?: "12m" | "5y";
  maxSubniches?: number;
  includeDebug?: boolean;
}

export interface OpportunityAnalyzeRequest {
  input: OpportunityAnalyzeInput;
  useMock?: boolean;
}

export interface OpportunityCompareRequest {
  inputs: OpportunityAnalyzeInput[];
}

export interface ScoreBreakdownItem {
  key: string;
  label: string;
  value: number;
  impact: "positive" | "negative" | "neutral";
  description: string;
}

export interface ScoreCard {
  value: number;
  label: string;
  summary: string;
  breakdown: ScoreBreakdownItem[];
}

export interface TrendPoint {
  date: string;
  value: number;
}

export interface TrendMetrics {
  recentGrowth: number;
  slope: number;
  acceleration: number;
  consistency: number;
  volatility: number;
  seasonality: number;
}

export interface SaturationMetrics {
  genericity: number;
  conversationDensity: number;
  maturity: number;
  crowdedness: number;
  differentiationPotential: number;
  noiseRatio: number;
}

export interface ConfidenceSummary {
  value: number;
  label: string;
  summary: string;
}

export interface OpportunityDiagnosis {
  summary: string;
  reasons: string[];
  risks: string[];
  upside: string[];
}

export interface RecommendedSubniche {
  label: string;
  angle: string;
  why: string;
  score: number;
  exampleKeywords: string[];
}

export interface MarketSignalSummary {
  source: "googleTrends" | "autocomplete" | "heuristics";
  status: DataStatus;
  detail: string;
}

export interface SourceTransparencyItem {
  source: "googleTrends" | "autocomplete" | "heuristics";
  label: string;
  officialStatus: "official" | "public-unofficial" | "public-open" | "internal-heuristic";
  role: string;
  whyItMatters: string;
  limitation: string;
  fallbackBehavior: string;
}

export interface MarketOpportunityResponse {
  requestedAt: string;
  query: {
    keyword: string;
    normalizedKeyword: string;
    locale: string;
    geo: string;
    language: "es" | "en";
    timeRange: "12m" | "5y";
  };
  scores: {
    trend: ScoreCard;
    saturation: ScoreCard;
    opportunity: ScoreCard;
  };
  label: OpportunityLabel;
  verdict: OpportunityVerdict;
  diagnosis: OpportunityDiagnosis;
  trend: {
    series: TrendPoint[];
    metrics: TrendMetrics;
  };
  saturation: {
    metrics: SaturationMetrics;
  };
  confidence: ConfidenceSummary;
  subniches: RecommendedSubniche[];
  signals: MarketSignalSummary[];
  sourceTransparency: SourceTransparencyItem[];
  warnings: string[];
  limitations: string[];
  comparedToFuture: {
    enabled: false;
    message: string;
  };
  debug?: {
    relatedQueries: string[];
    autocompleteSuggestions: string[];
  };
}

export interface MarketOpportunityCompareResponse {
  requestedAt: string;
  items: MarketOpportunityResponse[];
  deltas:
    | {
        trend: number;
        saturation: number;
        opportunity: number;
      }
    | null;
  winner:
    | {
        keyword: string;
        opportunityScore: number;
        reason: string;
        reasons: string[];
      }
    | null;
  bestEntryStrategy:
    | {
        keyword: string;
        entryMode: "go-now" | "go-with-subniche" | "validate-before-entry";
        positioning: string;
        firstMove: string;
        caution: string;
        why: string[];
        launchHypothesis: string;
        landingAngle: string;
        firstOffer: string;
        firstAcquisitionChannel: string;
        recommendedSubniche:
          | {
              label: string;
              angle: string;
              why: string;
              score: number;
              exampleKeywords: string[];
            }
          | null;
      }
    | null;
  summary: string;
}
