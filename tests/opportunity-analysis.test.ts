import { describe, expect, it } from "vitest";

import { buildOpportunityResponse } from "@server/services/opportunity/analysis";
import type { MarketSignalBundle } from "@server/services/opportunity/contracts";

function createBundle(keyword: string): MarketSignalBundle {
  return {
    input: {
      keyword,
      locale: "es-ES",
      geo: "US",
      language: "es",
      timeRange: "12m",
      maxSubniches: 6,
      includeDebug: false
    },
    trendSeries: Array.from({ length: 12 }, (_, index) => ({
      date: `2025-${String(index + 1).padStart(2, "0")}-01`,
      value: 28 + index * 4
    })),
    relatedQueries: [`${keyword} for beginners`, `${keyword} software`],
    autocompleteSuggestions: [`${keyword} para estudiantes`, `${keyword} templates`],
    sourceCoverage: {
      googleTrends: "live",
      autocomplete: "live"
    },
    providerWarnings: [],
    limitations: []
  };
}

describe("buildOpportunityResponse", () => {
  it("returns bounded scores and actionable subniches", () => {
    const result = buildOpportunityResponse(createBundle("ai for lawyers"));

    expect(result.scores.trend.value).toBeGreaterThanOrEqual(0);
    expect(result.scores.trend.value).toBeLessThanOrEqual(100);
    expect(result.scores.saturation.value).toBeGreaterThanOrEqual(0);
    expect(result.scores.saturation.value).toBeLessThanOrEqual(100);
    expect(result.scores.opportunity.value).toBeGreaterThanOrEqual(0);
    expect(result.scores.opportunity.value).toBeLessThanOrEqual(100);
    expect(result.subniches.length).toBeGreaterThan(0);
    expect(result.diagnosis.summary.length).toBeGreaterThan(10);
  });
});
