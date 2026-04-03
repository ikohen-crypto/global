import type {
  MarketOpportunityCompareResponse,
  MarketOpportunityResponse,
  OpportunityAnalyzeInput,
  OpportunityCompareRequest,
  OpportunityAnalyzeRequest
} from "@/types/opportunity";

import { fetchJson } from "@/services/apis/httpClient";

export async function analyzeOpportunity(
  input: OpportunityAnalyzeInput
): Promise<MarketOpportunityResponse> {
  const payload: OpportunityAnalyzeRequest = {
    input
  };

  return fetchJson<MarketOpportunityResponse>("/api/opportunity/analyze", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function compareOpportunities(
  inputs: OpportunityAnalyzeInput[]
): Promise<MarketOpportunityCompareResponse> {
  const payload: OpportunityCompareRequest = {
    inputs
  };

  return fetchJson<MarketOpportunityCompareResponse>("/api/opportunity/compare", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
