import { describe, expect, it } from "vitest";

import { compareArticles, dedupeFeed, detectTemplateSimilarity, isTemplatedHeadline } from "@/lib/news/dedupe";
import type { NewsItem } from "@/lib/types";

function buildItem(overrides: Partial<NewsItem> = {}): NewsItem {
  return {
    id: "test",
    slug: "test",
    title: "Bitcoin jumps above 90000 after ETF inflows",
    summary: "Bitcoin rises as ETF inflows increase and liquidity improves.",
    source: "CoinDesk",
    sourceId: "coindesk",
    sourceType: "rss",
    publishedAt: "2026-04-06T10:00:00.000Z",
    url: "https://www.coindesk.com/markets/2026/04/06/bitcoin-jumps",
    canonicalUrl: "https://www.coindesk.com/markets/2026/04/06/bitcoin-jumps",
    countries: [],
    topics: ["crypto"],
    assetClasses: ["crypto", "macro"],
    importance: "high",
    signalType: "crypto-liquidity",
    relevanceScore: 92,
    language: "en",
    whyItMatters: "Testing",
    whatHappened: "Testing",
    watchNow: "Testing",
    relatedIndicators: ["inflation", "interestRate"],
    relatedCountries: [],
    tags: ["bitcoin", "etf"],
    tickers: ["BTC"],
    ...overrides,
  };
}

describe("news dedupe engine", () => {
  it("dedupes the same url with different tracking params", () => {
    const first = buildItem({
      id: "tracking-1",
      url: "https://example.com/story?utm_source=x&fbclid=123",
      canonicalUrl: null,
    });
    const second = buildItem({
      id: "tracking-2",
      sourceId: "theblock",
      source: "The Block",
      url: "https://example.com/story?utm_medium=email&gclid=abc",
      canonicalUrl: null,
      publishedAt: "2026-04-06T11:00:00.000Z",
    });

    const result = dedupeFeed([first, second]);

    expect(result.deduped_articles).toHaveLength(1);
    expect(result.stats.exact_url_matches).toBeGreaterThanOrEqual(1);
  });

  it("dedupes exact title matches across two sources", () => {
    const first = buildItem({ id: "title-1", canonicalUrl: null, url: "https://a.com/1" });
    const second = buildItem({
      id: "title-2",
      sourceId: "blockworks",
      source: "Blockworks",
      canonicalUrl: null,
      url: "https://b.com/2",
      publishedAt: "2026-04-06T12:00:00.000Z",
    });

    const result = dedupeFeed([first, second]);

    expect(result.deduped_articles).toHaveLength(1);
  });

  it("clusters very similar titles with hour-level date differences and shows one card", () => {
    const first = buildItem({
      id: "hour-1",
      title: "Bitcoin jumps above 90,000 after ETF inflows",
      canonicalUrl: null,
      url: "https://a.com/hour-1",
      publishedAt: "2026-04-06T08:00:00.000Z",
    });
    const second = buildItem({
      id: "hour-2",
      sourceId: "theblock",
      source: "The Block",
      title: "BTC rises past 90000 as ETF demand increases",
      summary: "BTC moves higher as ETF inflows strengthen.",
      canonicalUrl: null,
      url: "https://b.com/hour-2",
      publishedAt: "2026-04-06T13:30:00.000Z",
    });

    const result = dedupeFeed([first, second]);

    expect(result.deduped_articles).toHaveLength(1);
    expect(result.clusters.some((cluster) => cluster.articleCount === 2)).toBe(true);
  });

  it("groups same event with different wording when score reaches the cluster threshold", () => {
    const first = buildItem({
      id: "event-1",
      title: "Bitcoin jumps above 90K after ETF inflows",
      canonicalUrl: null,
      url: "https://a.com/event-1",
    });
    const second = buildItem({
      id: "event-2",
      sourceId: "messari",
      source: "Messari",
      title: "BTC rises past 90,000 as ETF demand increases",
      summary: "Bitcoin climbs as exchange-traded fund demand improves.",
      canonicalUrl: null,
      url: "https://b.com/event-2",
      publishedAt: "2026-04-07T09:00:00.000Z",
    });

    const comparison = compareArticles(first, second);
    const result = dedupeFeed([first, second]);

    expect(comparison.score).toBeGreaterThanOrEqual(0.65);
    expect(result.clusters.some((cluster) => cluster.articleCount === 2)).toBe(true);
  });

  it("does not dedupe similar-looking titles for different events", () => {
    const first = buildItem({
      id: "different-1",
      title: "Bitcoin jumps above 90K after ETF inflows",
      summary: "Bitcoin rises on stronger ETF demand.",
      canonicalUrl: null,
      url: "https://a.com/different-1",
    });
    const second = buildItem({
      id: "different-2",
      sourceId: "theblock",
      source: "The Block",
      title: "Bitcoin rebounds as exchange trading resumes in Asia",
      summary: "Bitcoin recovers after a major exchange restores trading and order flow stabilizes.",
      canonicalUrl: null,
      url: "https://b.com/different-2",
      publishedAt: "2026-04-06T12:00:00.000Z",
      tags: ["bitcoin", "exchange"],
    });

    const result = dedupeFeed([first, second]);

    expect(result.deduped_articles).toHaveLength(2);
  });

  it("handles same-source republication by updating the cluster instead of creating a new card", () => {
    const first = buildItem({
      id: "republish-1",
      canonicalUrl: null,
      url: "https://coindesk.com/story",
      publishedAt: "2026-04-06T09:00:00.000Z",
    });
    const second = buildItem({
      id: "republish-2",
      canonicalUrl: null,
      url: "https://coindesk.com/story",
      publishedAt: "2026-04-06T14:00:00.000Z",
      summary: "Updated summary with more details.",
    });

    const result = dedupeFeed([first, second]);

    expect(result.deduped_articles).toHaveLength(1);
    expect(result.clusters[0]?.articleCount).toBe(2);
  });

  it("dedupes when canonical url matches even if the title changes", () => {
    const first = buildItem({
      id: "canonical-1",
      title: "Bitcoin jumps above 90K after ETF inflows",
      canonicalUrl: "https://example.com/story",
      url: "https://example.com/story?utm_source=x",
    });
    const second = buildItem({
      id: "canonical-2",
      sourceId: "theblock",
      source: "The Block",
      title: "Bitcoin gains as demand rises",
      canonicalUrl: "https://example.com/story",
      url: "https://m.example.com/story?ref=homepage",
      publishedAt: "2026-04-06T11:00:00.000Z",
    });

    const result = dedupeFeed([first, second]);

    expect(result.deduped_articles).toHaveLength(1);
    expect(result.stats.duplicates_removed).toBeGreaterThanOrEqual(1);
  });

  it("dedupes same source stories when only one keyword changes in a templated title", () => {
    const first = buildItem({
      id: "template-keyword-1",
      sourceId: "fed",
      source: "Federal Reserve Press",
      signalType: "central-bank-shift",
      topics: ["central-banks", "inflation"],
      title: "Novedad de politica monetaria sobre tasas",
      summary: "Comunicacion oficial del banco central para Estados Unidos. La publicacion mantiene la misma estructura base y solo cambia una keyword secundaria.",
      publishedAt: "2026-04-06T08:00:00.000Z",
      url: "https://example.com/template-keyword-1",
    });
    const second = buildItem({
      id: "template-keyword-2",
      sourceId: "fed",
      source: "Federal Reserve Press",
      signalType: "central-bank-shift",
      topics: ["central-banks", "inflation"],
      title: "Novedad de politica monetaria sobre inflacion",
      summary: "Comunicacion oficial del banco central para Estados Unidos. La publicacion mantiene la misma estructura base y solo cambia una keyword secundaria.",
      publishedAt: "2026-04-06T10:00:00.000Z",
      url: "https://example.com/template-keyword-2",
    });

    const comparison = compareArticles(first, second);
    const result = dedupeFeed([first, second]);

    expect(isTemplatedHeadline(first.title)).toBe(true);
    expect(comparison.reasons).toContain("same_source_template_duplicate");
    expect(result.deduped_articles).toHaveLength(1);
  });

  it("dedupes same source templated titles when only the country changes", () => {
    const first = buildItem({
      id: "template-country-1",
      sourceId: "marketaux",
      source: "Marketaux",
      title: "Actualizacion de politica monetaria en Argentina",
      summary: "Reporte oficial sobre politica monetaria en Argentina con la misma estructura base.",
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
      url: "https://example.com/template-country-1",
    });
    const second = buildItem({
      id: "template-country-2",
      sourceId: "marketaux",
      source: "Marketaux",
      title: "Actualizacion de politica monetaria en Brazil",
      summary: "Reporte oficial sobre politica monetaria en Brazil con la misma estructura base.",
      relatedCountries: [
        {
          iso2: "BR",
          iso3: "BRA",
          slug: "brazil",
          name: "Brazil",
          shortName: "Brazil",
          region: "Latin America",
          subregion: "South America",
          capital: "Brasilia",
          population: null,
          flagUrl: "",
          latlng: null,
          currencies: ["BRL"],
          languages: ["Portuguese"],
        },
      ],
      countries: ["BRA"],
      publishedAt: "2026-04-06T11:00:00.000Z",
      url: "https://example.com/template-country-2",
    });

    const templateSimilarity = detectTemplateSimilarity(first, second);
    const result = dedupeFeed([first, second]);

    expect(templateSimilarity.titleSkeletonMatch).toBe(true);
    expect(result.deduped_articles).toHaveLength(1);
  });

  it("clusters or dedupes templated same-source stories when summary base is nearly identical", () => {
    const first = buildItem({
      id: "template-summary-1",
      sourceId: "fed",
      source: "Federal Reserve Press",
      title: "Comunicacion oficial sobre tasas",
      summary: "La nota mantiene la misma narrativa base, cambia solo un tema macro y reutiliza casi todo el cuerpo.",
      url: "https://example.com/template-summary-1",
    });
    const second = buildItem({
      id: "template-summary-2",
      sourceId: "fed",
      source: "Federal Reserve Press",
      title: "Comunicacion oficial sobre inflacion",
      summary: "La nota mantiene la misma narrativa base, cambia solo un tema macro y reutiliza casi todo el cuerpo.",
      publishedAt: "2026-04-06T09:00:00.000Z",
      url: "https://example.com/template-summary-2",
    });

    const result = dedupeFeed([first, second]);

    expect(result.deduped_articles).toHaveLength(1);
  });
});
