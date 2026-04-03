import { describe, expect, it } from "vitest";

import { allIndicators, indicatorRegistry } from "@/lib/indicators/registry";

describe("indicatorRegistry", () => {
  it("keeps all required fields for every indicator", () => {
    for (const indicator of allIndicators) {
      expect(indicator.id).toBeTruthy();
      expect(indicator.shortLabel).toBeTruthy();
      expect(indicator.fullLabel).toBeTruthy();
      expect(indicator.category).toBeTruthy();
      expect(indicator.unit).toBeTruthy();
      expect(indicator.formatter(1)).toBeTruthy();
      expect(indicator.seoSummary).toBeTruthy();
      expect(indicator.sources.primary.sourceCode).toBeTruthy();
    }
  });

  it("formats selected indicators consistently", () => {
    expect(indicatorRegistry.gdp.formatter(1_500_000_000_000)).toContain("$");
    expect(indicatorRegistry.inflation.formatter(6.2)).toBe("6.2%");
    expect(indicatorRegistry.co2PerCapita.formatter(4.5)).toContain("t");
    expect(indicatorRegistry.externalDebt.premiumGate).toBe("extendedHistory");
  });

  it("prefers OECD for inflation with fallbacks behind it", () => {
    expect(indicatorRegistry.inflation.sources.primary.provider).toBe("oecd");
    expect(indicatorRegistry.inflation.sources.fallback?.map((source) => source.provider)).toEqual([
      "imf",
      "imf",
      "worldBank",
    ]);
  });

  it("uses OECD as the fresher source for unemployment, GDP growth, and short-term rates", () => {
    expect(indicatorRegistry.unemployment.sources.primary.provider).toBe("oecd");
    expect(indicatorRegistry.gdpGrowth.sources.primary.provider).toBe("oecd");
    expect(indicatorRegistry.interestRate.sources.primary.provider).toBe("oecd");
  });
});
