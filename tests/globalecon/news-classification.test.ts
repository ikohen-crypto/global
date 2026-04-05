import { describe, expect, it } from "vitest";

import {
  buildNewsInvestorLens,
  classifyNewsText,
  dedupeNews,
  getLocalizedNewsNarrativeSafe,
  getLocalizedNewsSummarySafe,
  getLocalizedNewsTitle,
  getLocalizedNewsTitleSafe,
} from "@/lib/news/rss";
import type { NewsItem } from "@/lib/types";

describe("news classification", () => {
  function buildItem(overrides: Partial<NewsItem> = {}) {
    return {
      id: "test",
      slug: "test",
      title: "Test headline",
      summary: "Test summary",
      source: "IMF News",
      sourceId: "imf",
      sourceType: "rss",
      publishedAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
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
      ...overrides,
    } satisfies NewsItem;
  }

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
    const item = buildItem({ publishedAt: new Date().toISOString() });

    const lens = buildNewsInvestorLens(item, "es");
    expect(lens.signalLabel).toBe("Presion inflacionaria");
    expect(lens.watch).toBe("Que mirar ahora");
  });

  it("keeps only the newest story when similar headlines repeat", () => {
    const older = buildItem({
      id: "older",
      slug: "argentina-inflation-jumps",
      title: "Argentina inflation jumps as peso remains under pressure",
      summary: "Consumer prices accelerate while the peso stays weak and funding pressure builds.",
      publishedAt: "2026-01-02T08:00:00.000Z",
      url: "https://example.com/older",
      signalType: "currency-stress",
      topics: ["inflation", "forex"],
      relatedCountries: [
        {
          iso2: "AR",
          iso3: "ARG",
          slug: "argentina",
          name: "Argentina",
          shortName: "Argentina",
          region: "Latin America",
          subregion: "South America",
          capital: "Buenos Aires",
          population: null,
          flagUrl: "",
          latlng: null,
          currencies: ["ARS"],
          languages: ["Spanish"],
        },
      ],
      countries: ["ARG"],
      relatedIndicators: ["inflation"],
    });
    const newer = buildItem({
      ...older,
      id: "newer",
      title: "Argentina inflation jumps with fresh peso pressure",
      publishedAt: "2026-01-03T08:00:00.000Z",
      url: "https://example.com/newer",
    });

    const result = dedupeNews([older, newer]);

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("newer");
  });

  it("dedupes stories by canonical url before other heuristics", () => {
    const older = buildItem({
      id: "canonical-older",
      url: "https://example.com/older-url",
      canonicalUrl: "https://example.com/canonical-story",
      publishedAt: "2026-01-02T08:00:00.000Z",
    });
    const newer = buildItem({
      id: "canonical-newer",
      url: "https://example.com/newer-url",
      canonicalUrl: "https://example.com/canonical-story",
      publishedAt: "2026-01-03T08:00:00.000Z",
    });

    const result = dedupeNews([older, newer]);

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("canonical-newer");
  });

  it("dedupes rss stories that share url even across different crypto providers", () => {
    const first = buildItem({
      id: "rss-1",
      sourceId: "cointelegraph",
      source: "CoinTelegraph",
      signalType: "crypto-liquidity",
      topics: ["crypto"],
      url: "https://example.com/shared-story",
    });
    const second = buildItem({
      id: "rss-2",
      sourceId: "messari",
      source: "Messari",
      signalType: "crypto-liquidity",
      topics: ["crypto"],
      url: "https://example.com/shared-story",
      publishedAt: "2026-01-03T08:00:00.000Z",
    });

    const result = dedupeNews([first, second]);

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("rss-2");
  });

  it("dedupes same-source crypto stories that describe the same setup across days", () => {
    const older = buildItem({
      id: "btc-older",
      slug: "bitcoin-rises-on-etf-flows",
      title: "Bitcoin rises as ETF inflows improve and rate fears ease",
      summary: "CoinDesk says bitcoin gains momentum as ETF inflows recover and traders see easier rate pressure.",
      publishedAt: "2026-04-03T08:00:00.000Z",
      sourceId: "coindesk",
      source: "CoinDesk",
      signalType: "crypto-liquidity",
      topics: ["crypto"],
      url: "https://example.com/btc-older",
    });
    const newer = buildItem({
      id: "btc-newer",
      slug: "bitcoin-gains-on-renewed-etf-flows",
      title: "Bitcoin gains as ETF flows return and rate worries cool",
      summary: "CoinDesk reports stronger bitcoin tone as ETF flows rebound and rate worries soften.",
      publishedAt: "2026-04-04T08:00:00.000Z",
      sourceId: "coindesk",
      source: "CoinDesk",
      signalType: "crypto-liquidity",
      topics: ["crypto"],
      url: "https://example.com/btc-newer",
    });

    const result = dedupeNews([older, newer]);

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("btc-newer");
  });

  it("dedupes crypto stories that repeat the same investor thesis", () => {
    const first = buildItem({
      id: "btc-thesis-1",
      title: "Bitcoin rallies as ETF inflows improve and traders cut rate fears",
      summary: "CoinDesk says bitcoin gains momentum as ETF inflows recover and traders see easier rate pressure.",
      sourceId: "coindesk",
      source: "CoinDesk",
      signalType: "crypto-liquidity",
      topics: ["crypto"],
      publishedAt: "2026-04-04T08:00:00.000Z",
      url: "https://example.com/btc-thesis-1",
    });
    const second = buildItem({
      id: "btc-thesis-2",
      title: "Bitcoin rebounds as ETF flows return and rate worries cool",
      summary: "A fresh CoinDesk update highlights stronger bitcoin tone as ETF demand returns and rate pressure eases.",
      sourceId: "coindesk",
      source: "CoinDesk",
      signalType: "crypto-liquidity",
      topics: ["crypto"],
      publishedAt: "2026-04-05T08:00:00.000Z",
      url: "https://example.com/btc-thesis-2",
    });

    const result = dedupeNews([first, second]);

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("btc-thesis-2");
  });

  it("keeps only the most recent crypto story when the editorial output is identical", () => {
    const older = buildItem({
      id: "btc-editorial-older",
      title: "Bitcoin update as macro backdrop shifts",
      summary: "Macro backdrop shifts for bitcoin and digital assets.",
      sourceId: "coindesk",
      source: "CoinDesk",
      signalType: "crypto-liquidity",
      topics: ["crypto"],
      publishedAt: "2026-04-03T22:18:00.000Z",
      url: "https://example.com/btc-editorial-older",
    });
    const newer = buildItem({
      ...older,
      id: "btc-editorial-newer",
      publishedAt: "2026-04-04T05:30:00.000Z",
      url: "https://example.com/btc-editorial-newer",
    });

    const result = dedupeNews([older, newer]);

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("btc-editorial-newer");
  });

  it("adds investor context to localized summaries", () => {
    const summary = getLocalizedNewsSummarySafe(buildItem(), "es");

    expect(summary).toContain("aporta una senal de presion inflacionaria");
    expect(summary).toContain("puede cambiar el escenario de inflacion y tasas");
    expect(summary).toContain("La inflacion cambia la trayectoria esperada de tasas");
  });

  it("keeps crypto localized titles in spanish", () => {
    const item = buildItem({
      signalType: "crypto-liquidity",
      title: "Bitcoin rallies as ETF flows rebound and traders cut rate fears",
      summary: "Crypto markets move higher after stronger ETF inflows.",
      sourceId: "coindesk",
      source: "CoinDesk",
      topics: ["crypto"],
      relatedIndicators: ["inflation"],
    });

    expect(getLocalizedNewsTitleSafe(item, "es")).toMatch(/^Bitcoin (sube|rebota) con foco en flujos de ETF$/);
  });

  it("avoids raw english fragments in spanish summaries", () => {
    const item = buildItem({
      signalType: "crypto-liquidity",
      title: "Bitcoin rallies as ETF flows rebound and traders cut rate fears",
      summary: "Crypto markets move higher after stronger ETF inflows and looser liquidity expectations.",
      sourceId: "coindesk",
      source: "CoinDesk",
      topics: ["crypto"],
    });

    const summary = getLocalizedNewsSummarySafe(item, "es");

    expect(summary).not.toContain("ETF flows");
    expect(summary).not.toContain("Crypto markets move higher");
    expect(summary).toContain("bitcoin");
    expect(summary).toContain("liquidez");
  });

  it("adds practical crypto guidance in spanish narrative copy", () => {
    const item = buildItem({
      signalType: "crypto-liquidity",
      title: "Bitcoin rallies as ETF flows rebound and traders cut rate fears",
      summary: "Crypto markets move higher after stronger ETF inflows and looser liquidity expectations.",
      sourceId: "coindesk",
      source: "CoinDesk",
      topics: ["crypto"],
    });

    const narrative = getLocalizedNewsNarrativeSafe(item, "es");

    expect(narrative.why).toContain("flujos de ETF");
    expect(narrative.watch).toContain("flujos de ETF");
    expect(narrative.watch).toContain("dolar");
  });

  it("avoids redundant stablecoin wording in crypto titles", () => {
    const item = buildItem({
      signalType: "crypto-liquidity",
      title: "Stablecoin market sees renewed attention amid liquidity debate",
      summary: "CoinDesk covers a fresh stablecoin discussion tied to market liquidity and regulation.",
      sourceId: "coindesk",
      source: "CoinDesk",
      topics: ["crypto"],
    });

    expect(getLocalizedNewsTitleSafe(item, "es")).toBe("Stablecoins bajo foco por liquidez y regulacion");
    expect(getLocalizedNewsSummarySafe(item, "es")).not.toContain("foco en stablecoins con foco en stablecoins");
  });

  it("avoids repeating foco twice in crypto titles", () => {
    const item = buildItem({
      signalType: "crypto-liquidity",
      title: "Ethereum macro update as rate backdrop shifts",
      summary: "CoinDesk reviews ethereum against changing rates and liquidity conditions.",
      sourceId: "coindesk",
      source: "CoinDesk",
      topics: ["crypto"],
    });

    const title = getLocalizedNewsTitleSafe(item, "es");

    expect(title).not.toContain("bajo foco con foco");
    expect(title).toMatch(/(bajo foco por|con foco en)/);
  });

  it("localizes country names in spanish narrative copy", () => {
    const item = buildItem({
      signalType: "growth-improvement",
      topics: ["growth"],
      relatedCountries: [
        {
          iso2: "US",
          iso3: "USA",
          slug: "united-states",
          name: "United States",
          shortName: "United States",
          region: "Americas",
          subregion: "North America",
          capital: "Washington, D.C.",
          population: null,
          flagUrl: "",
          latlng: null,
          currencies: ["USD"],
          languages: ["English"],
        },
      ],
      countries: ["USA"],
    });

    expect(getLocalizedNewsTitleSafe(item, "es")).toContain("Estados Unidos");
    expect(getLocalizedNewsSummarySafe(item, "es")).toContain("Estados Unidos");
    expect(getLocalizedNewsNarrativeSafe(item, "es").happened).toContain("Estados Unidos");
  });

  it("translates United States inside source-based spanish headlines", () => {
    expect(getLocalizedNewsTitle("Growth improves in United States as inflation cools", "es")).toContain(
      "Estados Unidos",
    );
  });
});
