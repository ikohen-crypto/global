import { describe, expect, it } from "vitest";

import { buildNewsInvestorLens, classifyNewsText } from "@/lib/news/rss";
import type { NewsItem } from "@/lib/types";

describe("news classification", () => {
  it("detects inflation and currency stress headlines", () => {
    const result = classifyNewsText(
      "Argentina inflation accelerates as peso faces devaluation pressure",
      "Consumer prices rose faster while the currency weakened sharply.",
    );

    expect(result.topics).toContain("inflation");
    expect(result.topics).toContain("forex");
    expect(result.signalType).toBe("currency-stress");
    expect(result.relatedCountries.map((country) => country.iso3)).toContain("ARG");
  });

  it("detects central-bank headlines", () => {
    const result = classifyNewsText(
      "Federal Reserve signals higher-for-longer policy path",
      "The central bank kept rates unchanged but warned inflation remains sticky.",
    );

    expect(result.topics).toContain("central-banks");
    expect(result.signalType).toBe("central-bank-shift");
    expect(result.importance).toBe("high");
  });

  it("builds investor lens copy in spanish", () => {
    const item = {
      id: "test",
      slug: "test",
      title: "Test headline",
      summary: "Test summary",
      source: "IMF News",
      sourceId: "imf",
      sourceType: "rss",
      publishedAt: new Date().toISOString(),
      url: "https://example.com",
      countries: [],
      topics: ["inflation"],
      assetClasses: ["macro"],
      importance: "high",
      signalType: "inflation-pressure",
      relevanceScore: 90,
      language: "en",
      whyItMatters: "Testing",
      whatHappened: "Testing",
      watchNow: "Testing",
      relatedIndicators: ["inflation"],
      relatedCountries: [],
    } satisfies NewsItem;

    const lens = buildNewsInvestorLens(item, "es");
    expect(lens.signalLabel).toBe("Presion inflacionaria");
    expect(lens.watch).toBe("Que mirar ahora");
  });
});
