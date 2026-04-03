import { describe, expect, it } from "vitest";

import { generateComparisonInsights } from "@/lib/insights";
import type { ComparisonCountry, IndicatorSeries } from "@/lib/types";
import { seedCountries } from "@/lib/data/seedCountries";

function series(values: Array<[number, number]>): IndicatorSeries {
  return {
    indicatorId: "gdp",
    sourceProvider: "worldBank",
    sourceName: "Test Source",
    sourceCode: "TEST",
    countryIso3: "TST",
    sourceLastUpdated: null,
    frequency: "annual",
    coverageStartYear: values[0]?.[0] ?? null,
    coverageEndYear: values[values.length - 1]?.[0] ?? null,
    latestAvailableLabel: String(values[values.length - 1][0]),
    comparableAcrossCountries: true,
    latestYear: values[values.length - 1][0],
    latestValue: values[values.length - 1][1],
    points: values.map(([year, value]) => ({ year, value })),
  };
}

function comparisonCountry(index: number, overrides: Partial<ComparisonCountry["metrics"]>): ComparisonCountry {
  return {
    country: seedCountries[index],
    metrics: {
      gdp: series([
        [2015, 100],
        [2024, 200 + index * 50],
      ]),
      gdpPerCapita: {
        ...series([
          [2015, 10],
          [2024, 20 + index * 5],
        ]),
        indicatorId: "gdpPerCapita",
      },
      inflation: {
        ...series([
          [2015, 5],
          [2024, 3 + index],
        ]),
        indicatorId: "inflation",
      },
      population: {
        ...series([
          [2015, 100],
          [2024, 1000 + index * 500],
        ]),
        indicatorId: "population",
      },
      unemployment: { ...series([[2024, 6]]), indicatorId: "unemployment" },
      gdpGrowth: { ...series([[2024, 4]]), indicatorId: "gdpGrowth" },
      interestRate: { ...series([[2024, 5]]), indicatorId: "interestRate" },
      externalDebt: { ...series([[2024, 50]]), indicatorId: "externalDebt" },
      co2PerCapita: { ...series([[2024, 4]]), indicatorId: "co2PerCapita" },
      lifeExpectancy: { ...series([[2024, 74]]), indicatorId: "lifeExpectancy" },
      ...overrides,
    },
  };
}

describe("generateComparisonInsights", () => {
  it("returns deterministic top-level comparison insights", () => {
    const insights = generateComparisonInsights([
      comparisonCountry(0, {}),
      comparisonCountry(1, {}),
    ]);

    expect(insights).toHaveLength(4);
    expect(insights[0]?.title).toContain(seedCountries[1].name);
    expect(insights[1]?.id).toBe("gdp-growth-over-range");
  });
});
