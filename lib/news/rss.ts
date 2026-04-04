import { cache } from "react";

import { countryCatalog } from "@/lib/data/countryCatalog";
import { getIndicatorDefinition } from "@/lib/indicators/registry";
import type { Locale } from "@/lib/i18n";
import { newsSourceDefinitions } from "@/lib/news/sources";
import { allNewsTopics, newsTopicDefinitions } from "@/lib/news/topics";
import { toKebabCase, uniqueBy } from "@/lib/utils";
import type {
  CountrySummary,
  IndicatorId,
  NewsAssetClass,
  NewsImportance,
  NewsItem,
  NewsSignalType,
  NewsSourceId,
  NewsTopic,
} from "@/lib/types";

type ParsedFeedEntry = {
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  category?: string;
};

type NewsSection = {
  id: string;
  title: { en: string; es: string };
  description: { en: string; es: string };
  items: NewsItem[];
};

type ImfArticleMetadata = {
  title: string;
  summary: string;
  publishedAt: string;
  countryName: string | null;
  countryIso3: string | null;
  articleType: string | null;
  topic: string | null;
};

function decodeXml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function stripTags(value: string) {
  return decodeXml(value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function extractItems(xml: string) {
  return [...xml.matchAll(/<item\b[\s\S]*?<\/item>/g)].map((match) => match[0]);
}

function extractTag(block: string, tag: string) {
  return (
    block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1] ??
    block.match(new RegExp(`<${tag}\\b[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i"))?.[1] ??
    ""
  );
}

function extractMetaContent(html: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (
    html.match(new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']*)["']`, "i"))?.[1] ??
    html.match(new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']*)["']`, "i"))?.[1] ??
    null
  );
}

function parseRss(xml: string): ParsedFeedEntry[] {
  if (!xml.includes("<rss") && !xml.includes("<feed")) {
    return [];
  }

  return extractItems(xml)
    .map((item) => ({
      title: stripTags(extractTag(item, "title")),
      summary: stripTags(extractTag(item, "description")),
      url: stripTags(extractTag(item, "link")),
      publishedAt:
        stripTags(extractTag(item, "pubDate")) ||
        stripTags(extractTag(item, "dc:date")) ||
        new Date().toISOString(),
      category: stripTags(extractTag(item, "category")),
    }))
    .filter((item) => item.title && item.url);
}

function parseMarketaux(payload: unknown): ParsedFeedEntry[] {
  const response = payload as
    | {
        data?: Array<{
          title?: string;
          description?: string;
          url?: string;
          published_at?: string;
        }>;
      }
    | undefined;

  return (response?.data ?? [])
    .map((item) => ({
      title: item.title?.trim() ?? "",
      summary: item.description?.trim() ?? "",
      url: item.url?.trim() ?? "",
      publishedAt: item.published_at?.trim() ?? new Date().toISOString(),
    }))
    .filter((item) => item.title && item.url);
}

function parseImfIndex(html: string) {
  const matches = [
    ...html.matchAll(
      /(?:https:\/\/www\.imf\.org)?(\/en\/news\/articles\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9][^"'\\s<]*)/gi,
    ),
    ...html.matchAll(
      /href=['"]((?:https:\/\/www\.imf\.org)?\/en\/news\/articles\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9][^'"]*)['"]/gi,
    ),
  ];
  const priorityByType: Record<string, number> = { pr: 0, cs: 1, cf: 2, sp: 3 };

  return uniqueBy(
    matches
      .map((match) => {
        const raw = (match[1] ?? match[0]).replace(/&amp;/g, "&");
        return raw.startsWith("http") ? raw : `https://www.imf.org${raw}`;
      })
      .sort((left, right) => {
        const leftType = left.match(/\/([a-z]{2})[^/]*$/i)?.[1]?.toLowerCase() ?? "zz";
        const rightType = right.match(/\/([a-z]{2})[^/]*$/i)?.[1]?.toLowerCase() ?? "zz";
        const leftPriority = priorityByType[leftType] ?? 9;
        const rightPriority = priorityByType[rightType] ?? 9;
        if (leftPriority !== rightPriority) return leftPriority - rightPriority;
        return right.localeCompare(left);
      }),
    (url) => url,
  ).slice(0, 12);
}

function parseImfArticle(html: string, url: string): ImfArticleMetadata | null {
  const title =
    stripTags(extractMetaContent(html, "og:title") ?? "") ||
    stripTags(extractMetaContent(html, "parsely-title") ?? "") ||
    stripTags(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  const summary =
    stripTags(extractMetaContent(html, "Description") ?? "") ||
    stripTags(extractMetaContent(html, "og:description") ?? "") ||
    stripTags(extractMetaContent(html, "twitter:description") ?? "");
  const publishedAt =
    extractMetaContent(html, "Date") ??
    extractMetaContent(html, "parsely-pub-date") ??
    extractMetaContent(html, "imf_search_date") ??
    new Date().toISOString();

  if (!title) {
    return null;
  }

  return {
    title,
    summary,
    publishedAt,
    countryName: stripTags(extractMetaContent(html, "Country") ?? ""),
    countryIso3: stripTags(extractMetaContent(html, "ISOCode") ?? ""),
    articleType: stripTags(extractMetaContent(html, "Type") ?? ""),
    topic: stripTags(extractMetaContent(html, "Topic") ?? ""),
  };
}

function matchCountries(text: string) {
  const haystack = text.toLowerCase();
  return uniqueBy(
    countryCatalog.filter((country) => {
      const aliases =
        country.iso3 === "USA"
          ? ["united states", "us", "u.s.", "america"]
          : country.iso3 === "GBR"
            ? ["united kingdom", "uk", "britain"]
            : country.iso3 === "BOL"
              ? ["bolivia"]
              : country.iso3 === "ARE"
                ? ["uae", "united arab emirates"]
                : [];

      return [country.name, country.shortName, ...aliases].some((value) =>
        haystack.includes(value.toLowerCase()),
      );
    }),
    (country) => country.iso3,
  ).slice(0, 5);
}

function inferRegions(countries: CountrySummary[]) {
  return uniqueBy(
    countries.map((country) => country.region).filter(Boolean),
    (region) => region,
  );
}

function matchTopics(text: string): NewsTopic[] {
  const haystack = text.toLowerCase();
  const topics = Object.entries(newsTopicDefinitions)
    .filter(([, definition]) => definition.keywords.some((keyword) => haystack.includes(keyword)))
    .map(([topic]) => topic as NewsTopic);

  return topics.length > 0 ? topics : ["growth"];
}

function inferAssetClasses(topics: NewsTopic[]): NewsAssetClass[] {
  return uniqueBy(
    topics.flatMap((topic) => newsTopicDefinitions[topic].assetClasses),
    (assetClass) => assetClass,
  );
}

function inferIndicators(topics: NewsTopic[]): IndicatorId[] {
  const ids = new Set<IndicatorId>();

  for (const topic of topics) {
    if (topic === "inflation") ids.add("inflation");
    if (topic === "central-banks") ids.add("interestRate");
    if (topic === "debt") ids.add("externalDebt");
    if (topic === "growth") ids.add("gdpGrowth");
    if (topic === "labor") ids.add("unemployment");
    if (topic === "energy") ids.add("inflation");
    if (topic === "forex") ids.add("inflation");
    if (topic === "crypto") ids.add("inflation");
  }

  return Array.from(ids);
}

function inferSignalType(text: string, topics: NewsTopic[]): NewsSignalType {
  const haystack = text.toLowerCase();

  if (topics.includes("forex") || haystack.includes("devaluation") || haystack.includes("currency")) {
    return "currency-stress";
  }

  if (topics.includes("debt") || haystack.includes("default") || haystack.includes("refinancing")) {
    return "debt-risk";
  }

  if (topics.includes("central-banks")) {
    return "central-bank-shift";
  }

  if (topics.includes("crypto")) {
    return "crypto-liquidity";
  }

  if (topics.includes("inflation") || haystack.includes("price pressure")) {
    return "inflation-pressure";
  }

  if (haystack.includes("slowdown") || haystack.includes("contracts") || haystack.includes("recession")) {
    return "growth-slowdown";
  }

  return "growth-improvement";
}

function inferImportance(
  signalType: NewsSignalType,
  topics: NewsTopic[],
  countries: CountrySummary[],
): NewsImportance {
  if (
    signalType === "central-bank-shift" ||
    signalType === "currency-stress" ||
    signalType === "debt-risk" ||
    topics.includes("inflation") ||
    countries.length >= 2
  ) {
    return "high";
  }

  if (signalType === "growth-slowdown" || topics.includes("energy")) {
    return "medium";
  }

  return "low";
}

function computeRelevanceScore(
  signalType: NewsSignalType,
  importance: NewsImportance,
  countries: CountrySummary[],
  topics: NewsTopic[],
  publishedAt: string,
) {
  const importanceScore = importance === "high" ? 40 : importance === "medium" ? 25 : 15;
  const signalScore =
    signalType === "central-bank-shift" || signalType === "currency-stress" || signalType === "debt-risk"
      ? 25
      : signalType === "inflation-pressure" || signalType === "crypto-liquidity"
        ? 18
        : 12;
  const countryScore = Math.min(countries.length * 6, 18);
  const topicScore = Math.min(topics.length * 4, 12);
  const ageDays = Math.max(0, (Date.now() - Date.parse(publishedAt)) / (1000 * 60 * 60 * 24));
  const freshnessScore = Math.max(0, 20 - ageDays);

  return Number((importanceScore + signalScore + countryScore + topicScore + freshnessScore).toFixed(1));
}

function buildWhyItMatters(signalType: NewsSignalType, countries: CountrySummary[]) {
  if (signalType === "central-bank-shift") {
    return "Central-bank moves can reprice yields, FX, credit conditions, and valuation multiples very quickly.";
  }

  if (signalType === "inflation-pressure") {
    return "Inflation pressure changes rate expectations, real returns, and margin visibility across markets.";
  }

  if (signalType === "currency-stress") {
    return "Currency stress matters for imported inflation, hard-currency returns, and sovereign risk perception.";
  }

  if (signalType === "debt-risk") {
    return "Debt stress can weaken the currency, raise refinancing risk, and compress investor appetite.";
  }

  if (signalType === "crypto-liquidity") {
    return "Crypto-sensitive macro news matters when liquidity, rate expectations, and hedge demand start to shift.";
  }

  if (countries.length > 0) {
    return "This macro headline can change the near-term investment case for the linked countries and sectors.";
  }

  return "This macro headline can change rates, currencies, and country-risk expectations even before hard data moves.";
}

function buildWhatHappened(title: string, summary: string) {
  const text = summary || title;
  return text.length > 180 ? `${text.slice(0, 177).trim()}...` : text;
}

const fedHighSignalKeywords = ["fomc", "economic projections", "minutes", "rate", "rates", "discount rate"] as const;
const fedUsefulOtherKeywords = [
  "financial statements",
  "economic projections",
  "liquidity",
  "balance sheet",
  "banking system",
  "credit",
] as const;
const ecbHighPriorityKeywords = [
  "monetary policy decisions",
  "monetary policy statement",
  "interest rates",
  "governing council",
  "consumer expectations survey",
  "wage tracker",
] as const;
const ecbMacroKeywords = [
  "inflation",
  "wage",
  "consumer expectations",
  "outlook",
  "euro area economy",
  "energy shocks",
  "growth",
  "digital euro",
  "tokenised",
  "tokenized",
  "ai",
] as const;
const ecbExcludedKeywords = ["night of the museums", "interview with"] as const;
const investingMacroKeywords = [
  "inflation",
  "cpi",
  "central bank",
  "fed",
  "ecb",
  "boj",
  "boe",
  "rates",
  "rate cut",
  "rate hike",
  "yields",
  "yield",
  "oil",
  "crude",
  "dollar",
  "forex",
  "euro",
  "recession",
  "slowdown",
  "growth",
  "debt",
  "tariffs",
  "crypto",
  "bitcoin",
  "ethereum",
  "liquidity",
  "jobs",
  "unemployment",
  "payrolls",
  "pmi",
  "stocks",
  "equities",
  "nasdaq",
  "dow",
  "s&p",
  "wall street",
  "treasury",
  "treasuries",
  "market",
] as const;
const investingExcludedKeywords = [
  "ipo",
  "injunction",
  "settles",
  "settlement",
  "user data",
  "stocks mixed at close",
  "stocks lower at close",
  "stocks higher at close",
  "dow jones industrial average up",
  "s&p/tsx composite",
  "bovespa up",
] as const;
const investingFeedUrls = [
  "https://www.investing.com/rss/news_14.rss",
  "https://www.investing.com/rss/news_95.rss",
  "https://www.investing.com/rss/news_1.rss",
  "https://www.investing.com/rss/central_banks.rss",
] as const;

function classifyFedEntry(entry: ParsedFeedEntry, fallbackCountries: CountrySummary[]) {
  const category = (entry.category ?? "").trim();
  const haystack = `${entry.title} ${entry.summary} ${category}`.toLowerCase();
  const defaultCountries =
    fallbackCountries.length > 0 ? fallbackCountries : countryCatalog.filter((country) => country.iso3 === "USA");

  if (category === "Monetary Policy") {
    return {
      topics: ["central-banks", "inflation", "forex"] as NewsTopic[],
      signalType: "central-bank-shift" as NewsSignalType,
      relatedIndicators: ["interestRate", "inflation", "gdpGrowth"] as IndicatorId[],
      importance: "high" as NewsImportance,
      assetClasses: ["macro", "forex", "bonds", "equities"] as NewsAssetClass[],
      relatedCountries: defaultCountries,
    };
  }

  if (category === "Banking and Consumer Regulatory Policy") {
    const topics: NewsTopic[] = haystack.includes("tokenized") || haystack.includes("crypto")
      ? ["crypto", "debt", "growth"]
      : ["debt", "growth"];

    return {
      topics,
      signalType: haystack.includes("capital") || haystack.includes("banking system") ? "debt-risk" as NewsSignalType : "growth-slowdown" as NewsSignalType,
      relatedIndicators: ["externalDebt", "gdpGrowth", "interestRate"] as IndicatorId[],
      importance: "medium" as NewsImportance,
      assetClasses: ["macro", "equities", "bonds"] as NewsAssetClass[],
      relatedCountries: defaultCountries,
    };
  }

  if (category === "Other Announcements") {
    return {
      topics: ["central-banks", "growth"] as NewsTopic[],
      signalType: fedHighSignalKeywords.some((keyword) => haystack.includes(keyword))
        ? "central-bank-shift" as NewsSignalType
        : "growth-improvement" as NewsSignalType,
      relatedIndicators: ["gdpGrowth", "interestRate"] as IndicatorId[],
      importance: fedHighSignalKeywords.some((keyword) => haystack.includes(keyword)) ? "high" as NewsImportance : "medium" as NewsImportance,
      assetClasses: ["macro", "equities", "bonds"] as NewsAssetClass[],
      relatedCountries: defaultCountries,
    };
  }

  if (category === "Orders on Banking Applications") {
    return {
      topics: ["debt", "growth"] as NewsTopic[],
      signalType: "debt-risk" as NewsSignalType,
      relatedIndicators: ["externalDebt", "gdpGrowth"] as IndicatorId[],
      importance: "medium" as NewsImportance,
      assetClasses: ["macro", "equities", "bonds"] as NewsAssetClass[],
      relatedCountries: defaultCountries,
    };
  }

  if (category === "Enforcement Actions") {
    return {
      topics: ["debt", "growth"] as NewsTopic[],
      signalType: "debt-risk" as NewsSignalType,
      relatedIndicators: ["externalDebt", "interestRate"] as IndicatorId[],
      importance: "medium" as NewsImportance,
      assetClasses: ["macro", "equities", "bonds"] as NewsAssetClass[],
      relatedCountries: defaultCountries,
    };
  }

  return null;
}

function classifyEcbEntry(entry: ParsedFeedEntry) {
  const title = entry.title.trim();
  const url = entry.url.toLowerCase();
  const haystack = `${title} ${url}`.toLowerCase();

  if (
    ecbHighPriorityKeywords.some((keyword) => haystack.includes(keyword)) ||
    url.includes("/press/press_conference/monetary-policy-statement/") ||
    url.includes("/press/govcdec/")
  ) {
    return {
      topics: ["central-banks", "inflation", "forex"] as NewsTopic[],
      signalType: "central-bank-shift" as NewsSignalType,
      relatedIndicators: ["interestRate", "inflation", "gdpGrowth"] as IndicatorId[],
      importance: "high" as NewsImportance,
      assetClasses: ["macro", "forex", "bonds", "equities"] as NewsAssetClass[],
      relatedCountries: [] as CountrySummary[],
    };
  }

  if (haystack.includes("digital euro") || haystack.includes("tokenised") || haystack.includes("tokenized")) {
    return {
      topics: ["crypto", "central-banks"] as NewsTopic[],
      signalType: "central-bank-shift" as NewsSignalType,
      relatedIndicators: ["interestRate", "inflation"] as IndicatorId[],
      importance: "medium" as NewsImportance,
      assetClasses: ["crypto", "macro", "equities"] as NewsAssetClass[],
      relatedCountries: [] as CountrySummary[],
    };
  }

  if (haystack.includes("inflation") || haystack.includes("wage") || haystack.includes("consumer expectations")) {
    return {
      topics: haystack.includes("wage")
        ? (["inflation", "central-banks", "labor"] as NewsTopic[])
        : (["inflation", "central-banks"] as NewsTopic[]),
      signalType: "inflation-pressure" as NewsSignalType,
      relatedIndicators: ["inflation", "interestRate"] as IndicatorId[],
      importance: "high" as NewsImportance,
      assetClasses: ["macro", "forex", "bonds", "equities"] as NewsAssetClass[],
      relatedCountries: [] as CountrySummary[],
    };
  }

  if (haystack.includes("energy shocks") || haystack.includes("outlook") || haystack.includes("economy") || haystack.includes("growth") || haystack.includes("ai")) {
    return {
      topics: haystack.includes("energy") ? (["growth", "energy"] as NewsTopic[]) : (["growth"] as NewsTopic[]),
      signalType: haystack.includes("slow") || haystack.includes("risk") ? "growth-slowdown" as NewsSignalType : "growth-improvement" as NewsSignalType,
      relatedIndicators: ["gdpGrowth", "inflation"] as IndicatorId[],
      importance: "medium" as NewsImportance,
      assetClasses: ["macro", "equities", "bonds"] as NewsAssetClass[],
      relatedCountries: [] as CountrySummary[],
    };
  }

  return null;
}

function classifyImfEntry(
  entry: ParsedFeedEntry,
  metadata: ImfArticleMetadata,
  fallbackCountries: CountrySummary[],
) {
  const haystack = `${entry.title} ${entry.summary} ${metadata.articleType ?? ""} ${metadata.topic ?? ""}`.toLowerCase();
  const matchedCountry =
    (metadata.countryIso3 ?? "").length === 3
      ? countryCatalog.find((country) => country.iso3 === (metadata.countryIso3 ?? "").toUpperCase()) ?? null
      : null;
  const relatedCountries = matchedCountry
    ? [matchedCountry]
    : metadata.countryName
      ? matchCountries(metadata.countryName)
      : fallbackCountries;

  if ((metadata.articleType ?? "").toLowerCase().includes("press release")) {
    return {
      topics: ["growth", "debt"] as NewsTopic[],
      signalType: haystack.includes("inflation")
        ? "inflation-pressure" as NewsSignalType
        : haystack.includes("debt") || haystack.includes("facility") || haystack.includes("agreement")
          ? "debt-risk" as NewsSignalType
          : "growth-improvement" as NewsSignalType,
      relatedIndicators: haystack.includes("inflation")
        ? (["inflation", "gdpGrowth", "externalDebt"] as IndicatorId[])
        : (["gdpGrowth", "externalDebt"] as IndicatorId[]),
      importance: "high" as NewsImportance,
      assetClasses: ["macro", "bonds", "forex"] as NewsAssetClass[],
      relatedCountries,
    };
  }

  if ((metadata.articleType ?? "").toLowerCase().includes("statement") || haystack.includes("article iv")) {
    return {
      topics: haystack.includes("inflation")
        ? (["growth", "inflation"] as NewsTopic[])
        : (["growth", "debt"] as NewsTopic[]),
      signalType: haystack.includes("inflation")
        ? "inflation-pressure" as NewsSignalType
        : haystack.includes("debt")
          ? "debt-risk" as NewsSignalType
          : "growth-slowdown" as NewsSignalType,
      relatedIndicators: ["gdpGrowth", "inflation", "externalDebt"] as IndicatorId[],
      importance: "high" as NewsImportance,
      assetClasses: ["macro", "bonds", "forex"] as NewsAssetClass[],
      relatedCountries,
    };
  }

  return {
    topics: matchTopics(haystack),
    signalType: inferSignalType(haystack, matchTopics(haystack)),
    relatedIndicators: inferIndicators(matchTopics(haystack)),
    importance: "medium" as NewsImportance,
    assetClasses: inferAssetClasses(matchTopics(haystack)),
    relatedCountries,
  };
}

function classifyInvestingEntry(entry: ParsedFeedEntry) {
  const haystack = `${entry.title} ${entry.summary} ${entry.url}`.toLowerCase();

  if (
    haystack.includes("crypto") ||
    haystack.includes("bitcoin") ||
    haystack.includes("ethereum") ||
    haystack.includes("stablecoin") ||
    haystack.includes("digital asset") ||
    haystack.includes("tokenized") ||
    haystack.includes("tokenised") ||
    haystack.includes("crypto etf") ||
    haystack.includes("bitcoin etf") ||
    haystack.includes("ethereum etf")
  ) {
    return {
      topics: ["crypto", "forex"] as NewsTopic[],
      signalType: "crypto-liquidity" as NewsSignalType,
      relatedIndicators: ["inflation", "interestRate"] as IndicatorId[],
      importance: "medium" as NewsImportance,
      assetClasses: ["crypto", "macro", "forex"] as NewsAssetClass[],
      relatedCountries: matchCountries(haystack),
    };
  }

  if (
    haystack.includes("central bank") ||
    haystack.includes("fed") ||
    haystack.includes("ecb") ||
    haystack.includes("boj") ||
    haystack.includes("boe") ||
    haystack.includes("rates") ||
    haystack.includes("yield")
  ) {
    return {
      topics: ["central-banks", "inflation", "forex"] as NewsTopic[],
      signalType: "central-bank-shift" as NewsSignalType,
      relatedIndicators: ["interestRate", "inflation", "gdpGrowth"] as IndicatorId[],
      importance: "high" as NewsImportance,
      assetClasses: ["macro", "forex", "bonds", "equities"] as NewsAssetClass[],
      relatedCountries: matchCountries(haystack),
    };
  }

  if (
    haystack.includes("inflation") ||
    haystack.includes("cpi") ||
    haystack.includes("jobs") ||
    haystack.includes("unemployment") ||
    haystack.includes("payrolls") ||
    haystack.includes("wages")
  ) {
    return {
      topics:
        haystack.includes("jobs") ||
        haystack.includes("unemployment") ||
        haystack.includes("payrolls") ||
        haystack.includes("wages")
          ? (["inflation", "growth", "labor"] as NewsTopic[])
          : (["inflation", "growth"] as NewsTopic[]),
      signalType: "inflation-pressure" as NewsSignalType,
      relatedIndicators: ["inflation", "unemployment"] as IndicatorId[],
      importance: "high" as NewsImportance,
      assetClasses: ["macro", "forex", "bonds", "equities"] as NewsAssetClass[],
      relatedCountries: matchCountries(haystack),
    };
  }

  if (
    haystack.includes("oil") ||
    haystack.includes("crude") ||
    haystack.includes("brent") ||
    haystack.includes("wti") ||
    haystack.includes("gas") ||
    haystack.includes("energy") ||
    haystack.includes("tariffs")
  ) {
    return {
      topics: ["energy", "inflation"] as NewsTopic[],
      signalType: "inflation-pressure" as NewsSignalType,
      relatedIndicators: ["inflation", "gdpGrowth"] as IndicatorId[],
      importance: "medium" as NewsImportance,
      assetClasses: ["macro", "equities", "forex"] as NewsAssetClass[],
      relatedCountries: matchCountries(haystack),
    };
  }

  if (haystack.includes("recession") || haystack.includes("slowdown") || haystack.includes("growth") || haystack.includes("pmi")) {
    return {
      topics: ["growth"] as NewsTopic[],
      signalType: haystack.includes("recession") || haystack.includes("slowdown")
        ? "growth-slowdown" as NewsSignalType
        : "growth-improvement" as NewsSignalType,
      relatedIndicators: ["gdpGrowth", "inflation"] as IndicatorId[],
      importance: "medium" as NewsImportance,
      assetClasses: ["macro", "equities", "bonds"] as NewsAssetClass[],
      relatedCountries: matchCountries(haystack),
    };
  }

  if (haystack.includes("dollar") || haystack.includes("forex") || haystack.includes("euro")) {
    return {
      topics: ["forex", "inflation"] as NewsTopic[],
      signalType: "currency-stress" as NewsSignalType,
      relatedIndicators: ["inflation", "interestRate"] as IndicatorId[],
      importance: "medium" as NewsImportance,
      assetClasses: ["forex", "macro", "bonds"] as NewsAssetClass[],
      relatedCountries: matchCountries(haystack),
    };
  }

  return null;
}

function classifyCoinDeskEntry(entry: ParsedFeedEntry) {
  const haystack = `${entry.title} ${entry.summary} ${entry.url}`.toLowerCase();

  if (
    haystack.includes("bitcoin") ||
    haystack.includes("ethereum") ||
    haystack.includes("crypto") ||
    haystack.includes("stablecoin") ||
    haystack.includes("digital asset") ||
    haystack.includes("etf") ||
    haystack.includes("tokenized") ||
    haystack.includes("tokenised")
  ) {
    return {
      topics: haystack.includes("dollar") || haystack.includes("forex")
        ? (["crypto", "forex"] as NewsTopic[])
        : (["crypto"] as NewsTopic[]),
      signalType: "crypto-liquidity" as NewsSignalType,
      relatedIndicators: ["inflation", "interestRate"] as IndicatorId[],
      importance: haystack.includes("etf") || haystack.includes("stablecoin")
        ? "high" as NewsImportance
        : "medium" as NewsImportance,
      assetClasses: haystack.includes("forex")
        ? (["crypto", "macro", "forex"] as NewsAssetClass[])
        : (["crypto", "macro"] as NewsAssetClass[]),
      relatedCountries: matchCountries(haystack),
    };
  }

  return {
    topics: matchTopics(haystack),
    signalType: inferSignalType(haystack, matchTopics(haystack)),
    relatedIndicators: inferIndicators(matchTopics(haystack)),
    importance: "medium" as NewsImportance,
    assetClasses: inferAssetClasses(matchTopics(haystack)),
    relatedCountries: matchCountries(haystack),
  };
}

function shouldKeepSourceEntry(sourceId: NewsSourceId, entry: ParsedFeedEntry) {
  if (sourceId === "imf") {
    return /\/en\/news\/articles\/\d{4}\/\d{2}\/\d{2}\/(pr|cs|cf|sp)/i.test(entry.url);
  }

  if (sourceId === "fed") {
    const category = (entry.category ?? "").trim();
    const haystack = `${entry.title} ${entry.summary}`.toLowerCase();

    if (
      category === "Monetary Policy" ||
      category === "Banking and Consumer Regulatory Policy" ||
      category === "Orders on Banking Applications" ||
      category === "Enforcement Actions"
    ) {
      return true;
    }

    if (category === "Other Announcements") {
      return fedUsefulOtherKeywords.some((keyword) => haystack.includes(keyword));
    }

    return false;
  }

  if (sourceId === "ecb") {
    const haystack = `${entry.title} ${entry.summary} ${entry.url}`.toLowerCase();
    if (ecbExcludedKeywords.some((keyword) => haystack.includes(keyword))) {
      return false;
    }

    return ecbHighPriorityKeywords.some((keyword) => haystack.includes(keyword)) ||
      ecbMacroKeywords.some((keyword) => haystack.includes(keyword)) ||
      entry.url.toLowerCase().includes("/press/press_conference/monetary-policy-statement/") ||
      entry.url.toLowerCase().includes("/press/govcdec/");
  }

  if (sourceId === "investing") {
    const haystack = `${entry.title} ${entry.summary} ${entry.url}`.toLowerCase();
    if (investingExcludedKeywords.some((keyword) => haystack.includes(keyword))) {
      return false;
    }

    return investingMacroKeywords.some((keyword) => haystack.includes(keyword));
  }

  if (sourceId === "coindesk") {
    const haystack = `${entry.title} ${entry.summary} ${entry.url}`.toLowerCase();
    return (
      haystack.includes("bitcoin") ||
      haystack.includes("ethereum") ||
      haystack.includes("crypto") ||
      haystack.includes("stablecoin") ||
      haystack.includes("digital asset") ||
      haystack.includes("etf") ||
      haystack.includes("tokenized") ||
      haystack.includes("tokenised") ||
      haystack.includes("dollar") ||
      haystack.includes("forex")
    );
  }

  return true;
}

function buildWatchNow(signalType: NewsSignalType, indicators: IndicatorId[], countries: CountrySummary[]) {
  const indicatorLabels = indicators.map((indicatorId) => getIndicatorDefinition(indicatorId).shortLabel);
  const countryLabel = countries.slice(0, 2).map((country) => country.name).join(" and ");

  if (signalType === "central-bank-shift") {
    return `Watch rates, FX, and local equity sensitivity${countryLabel ? ` in ${countryLabel}` : ""}.`;
  }

  if (signalType === "inflation-pressure") {
    return `Watch ${indicatorLabels.join(", ") || "inflation and rates"} for confirmation of persistent price pressure.`;
  }

  if (signalType === "currency-stress") {
    return `Watch FX, inflation pass-through, and funding stress${countryLabel ? ` in ${countryLabel}` : ""}.`;
  }

  if (signalType === "debt-risk") {
    return `Watch debt metrics, refinancing signals, and sovereign spreads${countryLabel ? ` in ${countryLabel}` : ""}.`;
  }

  if (signalType === "crypto-liquidity") {
    return "Watch BTC, ETH, real yields, and rate expectations for confirmation of liquidity shifts.";
  }

  return `Watch ${indicatorLabels.join(", ") || "growth and inflation"} for follow-through.`;
}

export function buildNewsInvestorLens(item: NewsItem, locale: Locale) {
  const copy = {
    en: {
      happened: "What happened",
      why: "Why it matters",
      watch: "What to watch",
      affectedAssets: "Affected assets",
      source: "Source",
      countries: "Countries",
      indicators: "Indicators",
      open: "Open source",
      sections: {
        top: ["Top macro stories", "The highest-priority stories across inflation, rates, FX, debt, and growth."],
        central: ["Central banks", "Policy moves and communication that can quickly reprice rates, FX, and equities."],
        inflation: ["Inflation watch", "Price-pressure stories that matter for rate expectations and real returns."],
        debt: ["Debt risk", "Debt and refinancing stories that can change sovereign and currency risk quickly."],
        forex: ["Forex pressure", "Currency stories that matter for imported inflation and hard-currency returns."],
        crypto: ["Crypto macro", "Macro headlines with the clearest spillover into crypto liquidity and risk appetite."],
      },
      signalLabels: {
        "inflation-pressure": "Inflation pressure",
        "central-bank-shift": "Central-bank shift",
        "currency-stress": "Currency stress",
        "debt-risk": "Debt risk",
        "growth-slowdown": "Growth slowdown",
        "growth-improvement": "Growth improvement",
        "crypto-liquidity": "Crypto liquidity",
      },
    },
    es: {
      happened: "Que paso",
      why: "Por que importa",
      watch: "Que mirar ahora",
      affectedAssets: "Activos afectados",
      source: "Fuente",
      countries: "Paises",
      indicators: "Indicadores",
      open: "Abrir fuente",
      sections: {
        top: ["Principales historias macro", "Las historias de mayor prioridad en inflacion, tasas, FX, deuda y crecimiento."],
        central: ["Bancos centrales", "Movimientos de politica y comunicacion que pueden repricing rapido de tasas, FX y acciones."],
        inflation: ["Vigilancia de inflacion", "Historias de precios que importan para expectativas de tasas y retornos reales."],
        debt: ["Riesgo de deuda", "Historias de deuda y refinanciacion que pueden cambiar rapido el riesgo soberano y cambiario."],
        forex: ["Presion forex", "Historias de monedas que importan para inflacion importada y retornos en moneda dura."],
        crypto: ["Macro y crypto", "Titulares macro con el contagio mas claro hacia liquidez crypto y apetito por riesgo."],
      },
      signalLabels: {
        "inflation-pressure": "Presion inflacionaria",
        "central-bank-shift": "Cambio de banco central",
        "currency-stress": "Estres cambiario",
        "debt-risk": "Riesgo de deuda",
        "growth-slowdown": "Desaceleracion del crecimiento",
        "growth-improvement": "Mejora del crecimiento",
        "crypto-liquidity": "Liquidez crypto",
      },
    },
  }[locale];

  return {
    ...copy,
    signalLabel: copy.signalLabels[item.signalType],
    sectionTitles: copy.sections,
  };
}

export function getLocalizedNewsTitle(title: string, locale: Locale) {
  if (locale !== "es") return title.trim();

  const replacements: Array<[RegExp, string]> = [
    [/IMF News/gi, "Noticias FMI"],
    [/Federal Reserve Board/gi, "Reserva Federal"],
    [/Federal Reserve/gi, "Reserva Federal"],
    [/European Central Bank|ECB/gi, "BCE"],
    [/IMF/gi, "FMI"],
    [/reaches staff-level agreement/gi, "alcanza un acuerdo tecnico"],
    [/staff-level agreement/gi, "acuerdo tecnico"],
    [/third review/gi, "tercera revision"],
    [/second review/gi, "segunda revision"],
    [/first review/gi, "primera revision"],
    [/extended arrangement/gi, "acuerdo extendido"],
    [/extended fund facility/gi, "Servicio Ampliado del FMI"],
    [/resilience and sustainability facility/gi, "Servicio de Resiliencia y Sostenibilidad"],
    [/article iv mission to/gi, "mision del Articulo IV a"],
    [/article iv consultation/gi, "consulta del Articulo IV"],
    [/mission concluding statement/gi, "declaracion final de la mision"],
    [/reaches agreement on/gi, "alcanza un acuerdo sobre"],
    [/completes/gi, "completa"],
    [/releases/gi, "publica"],
    [/issues/gi, "emite"],
    [/announces/gi, "anuncia"],
    [/approval of application by/gi, "aprobacion de la solicitud de"],
    [/approval of notice by/gi, "aprobacion del aviso de"],
    [/Board and Federal Open Market Committee/gi, "la Reserva Federal y el Comite Federal de Mercado Abierto"],
    [/Federal Open Market Committee|FOMC/gi, "Comite Federal de Mercado Abierto"],
    [/Monetary policy decisions/gi, "Decisiones de politica monetaria"],
    [/Monetary policy statement/gi, "Declaracion de politica monetaria"],
    [/economic projections/gi, "proyecciones economicas"],
    [/Consumer Expectations Survey results/gi, "Resultados de la encuesta de expectativas del consumidor"],
    [/Consumer Expectations Survey/gi, "encuesta de expectativas del consumidor"],
    [/wage tracker/gi, "tracker salarial"],
    [/digital euro/gi, "euro digital"],
    [/tokeni[sz]ed/gi, "tokenizados"],
    [/interest rates/gi, "tasas de interes"],
    [/interest rate/gi, "tasa de interes"],
    [/rate hike/gi, "suba de tasas"],
    [/rate cut/gi, "baja de tasas"],
    [/rates/gi, "tasas"],
    [/yields/gi, "rendimientos"],
    [/yield/gi, "rendimiento"],
    [/inflation/gi, "inflacion"],
    [/growth/gi, "crecimiento"],
    [/debt/gi, "deuda"],
    [/outlook/gi, "perspectiva"],
    [/economy/gi, "economia"],
    [/energy shocks/gi, "shocks energeticos"],
    [/energy shock/gi, "shock energetico"],
    [/consumer/gi, "consumidor"],
    [/consumption/gi, "consumo"],
    [/expectations/gi, "expectativas"],
    [/survey/gi, "encuesta"],
    [/currency/gi, "moneda"],
    [/currencies/gi, "monedas"],
    [/dollar/gi, "dolar"],
    [/euro area/gi, "zona euro"],
    [/oil/gi, "petroleo"],
    [/crude/gi, "crudo"],
    [/crypto/gi, "crypto"],
    [/bitcoin/gi, "bitcoin"],
    [/ethereum/gi, "ethereum"],
    [/statement/gi, "declaracion"],
    [/decisions/gi, "decisiones"],
    [/press release/gi, "comunicado"],
    [/mission/gi, "mision"],
    [/article iv/gi, "Articulo IV"],
    [/staff/gi, "staff"],
    [/announce/gi, "anunciar"],
    [/issue /gi, "emitir "],
    [/release /gi, "publicar "],
    [/results/gi, "resultados"],
    [/update/gi, "actualizacion"],
    [/risk/gi, "riesgo"],
    [/liquidity/gi, "liquidez"],
    [/employment/gi, "empleo"],
    [/unemployment/gi, "desempleo"],
    [/jobs/gi, "empleo"],
    [/slowdown/gi, "desaceleracion"],
    [/recession/gi, "recesion"],
    [/pressures/gi, "presiones"],
    [/pressure/gi, "presion"],
    [/war-driven/gi, "impulsado por la guerra"],
    [/central bank/gi, "banco central"],
    [/banks/gi, "bancos"],
    [/bank/gi, "banco"],
    [/global fx market summary/gi, "Resumen global del mercado FX"],
    [/fx daily/gi, "FX diario"],
    [/what to watch/gi, "que mirar"],
    [/why it matters/gi, "por que importa"],
  ];

  let localized = title.trim();
  for (const [pattern, replacement] of replacements) {
    localized = localized.replace(pattern, replacement);
  }

  return localized
    .replace(/\s+/g, " ")
    .replace(/\s, /g, ", ")
    .replace(/\s\./g, ".")
    .trim();
}

export function getLocalizedNewsExcerpt(text: string, locale: Locale) {
  const localized = getLocalizedNewsTitle(text, locale);
  return localized.length > 220 ? `${localized.slice(0, 217).trim()}...` : localized;
}

export function getLocalizedNewsSourceLabelSafe(sourceId: NewsSourceId, locale: Locale) {
  const labels = locale === "es"
    ? {
        imf: "FMI",
        ecb: "BCE",
        fed: "Reserva Federal",
        investing: "Investing",
        coindesk: "CoinDesk",
        marketaux: "Mercados globales",
      }
    : {
        imf: "IMF News",
        ecb: "ECB Press",
        fed: "Federal Reserve Press",
        investing: "Investing.com RSS",
        coindesk: "CoinDesk",
        marketaux: "Marketaux",
      };

  return labels[sourceId];
}

export function getLocalizedNewsSummarySafe(item: NewsItem, locale: Locale) {
  if (locale !== "es") {
    return getLocalizedNewsExcerpt(item.summary || item.title, locale);
  }

  const subject = inferSpanishHeadlineSubject(item);
  const countryLabel =
    item.relatedCountries.length > 0
      ? item.relatedCountries.slice(0, 2).map((country) => country.name).join(" y ")
      : "los mercados vinculados";
  const primaryTopic = item.topics[0] ?? "growth";
  const topicLabel = {
    inflation: "inflacion",
    "central-banks": "bancos centrales",
    debt: "deuda",
    growth: "crecimiento",
    forex: "mercado cambiario",
    crypto: "activos digitales",
    energy: "energia",
    labor: "mercado laboral",
  }[primaryTopic];
  const focus = subject || topicLabel;

  const summary = {
    "central-bank-shift": `La noticia se centra en politica monetaria, tasas o guidance oficial con impacto potencial sobre bonos, monedas y acciones en ${countryLabel}.`,
    "inflation-pressure": `La noticia apunta a precios, expectativas o costos y puede cambiar el escenario de inflacion y tasas para ${countryLabel}.`,
    "currency-stress": `La noticia muestra tension cambiaria alrededor de ${focus}, algo clave para seguir tipo de cambio, inflacion importada y activos en moneda dura.`,
    "debt-risk": `La noticia gira en torno a deuda, refinanciacion o fragilidad fiscal en ${countryLabel}, con efecto potencial sobre spreads y acceso al financiamiento.`,
    "growth-slowdown": `La noticia sugiere una desaceleracion de la actividad o un deterioro del impulso economico en ${countryLabel}.`,
    "growth-improvement": `La noticia sugiere una mejora de crecimiento o una lectura mas constructiva para actividad y apetito por riesgo en ${countryLabel}.`,
    "crypto-liquidity": `La noticia se enfoca en ${focus} y su posible impacto sobre BTC, ETH, liquidez, regulacion y flujos hacia activos digitales.`,
  }[item.signalType];

  return summary.replace(/\s+/g, " ").trim();
}

function inferSpanishHeadlineSubject(item: NewsItem) {
  const haystack = `${item.title} ${item.summary}`.toLowerCase();

  if (haystack.includes("bitcoin etf")) return "bitcoin ETF";
  if (haystack.includes("ethereum etf")) return "ethereum ETF";
  if (haystack.includes("stablecoin")) return "stablecoins";
  if (haystack.includes("bitcoin")) return "bitcoin";
  if (haystack.includes("ethereum")) return "ethereum";
  if (haystack.includes("crypto")) return "crypto";
  if (haystack.includes("digital euro")) return "euro digital";
  if (haystack.includes("tokenized") || haystack.includes("tokenised")) return "activos tokenizados";
  if (haystack.includes("dollar")) return "dolar";
  if (haystack.includes("euro")) return "euro";
  if (haystack.includes("oil") || haystack.includes("crude")) return "petroleo";
  if (haystack.includes("rates") || haystack.includes("interest rate")) return "tasas";
  if (haystack.includes("inflation") || haystack.includes("cpi")) return "inflacion";
  if (haystack.includes("jobs") || haystack.includes("employment") || haystack.includes("payroll")) return "empleo";

  const countryLabel = item.relatedCountries[0]?.name;
  return countryLabel ?? "mercados";
}

export function getLocalizedNewsTitleSafe(item: NewsItem, locale: Locale) {
  if (locale !== "es") {
    return getLocalizedNewsTitle(item.title, locale);
  }

  const countryLabel =
    item.relatedCountries.length > 0
      ? item.relatedCountries.slice(0, 2).map((country) => country.name).join(" y ")
      : "mercados vinculados";
  const primaryTopic = item.topics[0] ?? "growth";
  const topicLabel = {
    inflation: "inflacion",
    "central-banks": "bancos centrales",
    debt: "deuda",
    growth: "crecimiento",
    forex: "mercado cambiario",
    crypto: "crypto",
    energy: "energia",
    labor: "mercado laboral",
  }[primaryTopic];
  const subject = inferSpanishHeadlineSubject(item);

  return {
    "central-bank-shift": `Novedad de politica monetaria sobre ${subject || topicLabel}`,
    "inflation-pressure": `Presion inflacionaria en ${countryLabel}`,
    "currency-stress": `Tension cambiaria sobre ${subject}`,
    "debt-risk": `Foco en deuda y financiamiento de ${countryLabel}`,
    "growth-slowdown": `Senales de desaceleracion en ${countryLabel}`,
    "growth-improvement": `Mejora de crecimiento en ${countryLabel}`,
    "crypto-liquidity": `Impacto macro en ${subject}`,
  }[item.signalType];
}

export function getLocalizedNewsNarrative(item: NewsItem, locale: Locale) {
  const countryLabel =
    item.relatedCountries.length > 0
      ? item.relatedCountries.slice(0, 2).map((country) => country.name).join(locale === "es" ? " y " : " and ")
      : locale === "es"
        ? "los mercados vinculados"
        : "the linked markets";

  if (locale === "es") {
    return {
      happened: {
        "central-bank-shift": `${item.source} publicÃ³ una actualizaciÃ³n de polÃ­tica o comunicaciÃ³n oficial que puede mover rÃ¡pido tasas, bonos, FX y valuaciones.`,
        "inflation-pressure": `${item.source} trae una seÃ±al de presiÃ³n inflacionaria o expectativas de precios que puede cambiar el escenario macro para ${countryLabel}.`,
        "currency-stress": `${item.source} marca tensiÃ³n cambiaria o presiÃ³n sobre la moneda, algo clave para seguir inflaciÃ³n importada y activos en moneda dura.`,
        "debt-risk": `${item.source} seÃ±ala riesgo de deuda, refinanciaciÃ³n o fragilidad fiscal con impacto potencial sobre spreads y apetito por riesgo.`,
        "growth-slowdown": `${item.source} apunta a una desaceleraciÃ³n del crecimiento o a un deterioro del impulso econÃ³mico en ${countryLabel}.`,
        "growth-improvement": `${item.source} sugiere una mejora del crecimiento o una seÃ±al mÃ¡s constructiva para la actividad y los activos vinculados.`,
        "crypto-liquidity": `${item.source} conecta la macro con crypto, liquidez o regulaciÃ³n de mercados digitales que puede afectar BTC, ETH y el apetito por riesgo.`,
      }[item.signalType],
      why: {
        "central-bank-shift": "Estos cambios suelen mover expectativas de tasas, rendimientos, divisas y mÃºltiplos de mercado antes de que cambien los datos duros.",
        "inflation-pressure": "La inflaciÃ³n cambia la trayectoria esperada de tasas, el retorno real y la visibilidad de mÃ¡rgenes en acciones y bonos.",
        "currency-stress": "La presiÃ³n cambiaria importa porque puede empeorar inflaciÃ³n, deuda en moneda dura y percepciÃ³n de riesgo paÃ­s.",
        "debt-risk": "Las noticias de deuda importan porque afectan refinanciaciÃ³n, spreads soberanos, moneda y acceso al financiamiento.",
        "growth-slowdown": "Una desaceleraciÃ³n suele pegar primero en expectativas, utilidades, crÃ©dito y posicionamiento de riesgo.",
        "growth-improvement": "Una mejora del crecimiento puede favorecer demanda, utilidades y una lectura mÃ¡s constructiva del riesgo macro.",
        "crypto-liquidity": "Cuando cambia la liquidez o la regulaciÃ³n macro, crypto suele reaccionar rÃ¡pido junto con tasas reales y dÃ³lar.",
      }[item.signalType],
      watch: {
        "central-bank-shift": "SeguÃ­ tasas, rendimientos, tipo de cambio y sensibilidad de acciones locales para confirmar el impacto.",
        "inflation-pressure": "SeguÃ­ inflaciÃ³n, tasas y expectativas de precios para ver si la presiÃ³n persiste o empieza a moderarse.",
        "currency-stress": "SeguÃ­ FX, pass-through inflacionario y seÃ±ales de tensiÃ³n financiera para medir si el shock se profundiza.",
        "debt-risk": "SeguÃ­ mÃ©tricas de deuda, spreads, rollover y titulares de financiamiento para detectar deterioro adicional.",
        "growth-slowdown": "SeguÃ­ crecimiento, empleo, actividad y guÃ­as oficiales para ver si la desaceleraciÃ³n se confirma.",
        "growth-improvement": "SeguÃ­ crecimiento, consumo, empleo y revisiones oficiales para ver si la mejora gana consistencia.",
        "crypto-liquidity": "SeguÃ­ BTC, ETH, tasas reales, dÃ³lar y cambios regulatorios para medir si la noticia se traslada al mercado.",
      }[item.signalType],
    };
  }

  return {
    happened: {
      "central-bank-shift": `${item.source} published a policy update or official communication that can move rates, bonds, FX, and valuation quickly.`,
      "inflation-pressure": `${item.source} adds a price-pressure or expectations signal that can change the macro backdrop for ${countryLabel}.`,
      "currency-stress": `${item.source} points to currency pressure, which matters for imported inflation and hard-currency returns.`,
      "debt-risk": `${item.source} signals debt, refinancing, or fiscal fragility that can affect spreads and risk appetite.`,
      "growth-slowdown": `${item.source} points to slower growth or weaker economic momentum across ${countryLabel}.`,
      "growth-improvement": `${item.source} suggests firmer growth or a more constructive activity backdrop for linked assets.`,
      "crypto-liquidity": `${item.source} links macro conditions with crypto liquidity or digital-asset regulation that can hit BTC, ETH, and risk appetite.`,
    }[item.signalType],
    why: {
      "central-bank-shift": "These updates can move rate expectations, yields, currencies, and equity multiples before the hard data fully adjusts.",
      "inflation-pressure": "Inflation shifts expected policy paths, real returns, and margin visibility across stocks and bonds.",
      "currency-stress": "Currency pressure matters because it can worsen imported inflation, hard-currency debt stress, and risk perception.",
      "debt-risk": "Debt headlines matter because they affect refinancing, sovereign spreads, currencies, and access to funding.",
      "growth-slowdown": "A slowdown usually hits expectations, earnings, credit, and positioning before it is obvious in the broad data.",
      "growth-improvement": "Stronger growth can support demand, earnings, and a more constructive reading of macro risk.",
      "crypto-liquidity": "When liquidity or macro regulation shifts, crypto often reacts quickly alongside real rates and the dollar.",
    }[item.signalType],
    watch: {
      "central-bank-shift": "Watch rates, yields, FX, and local equity sensitivity for confirmation.",
      "inflation-pressure": "Watch inflation prints, rates, and price expectations to see whether the pressure is persisting or easing.",
      "currency-stress": "Watch FX, inflation pass-through, and funding stress to judge whether the shock is deepening.",
      "debt-risk": "Watch debt metrics, spreads, rollover headlines, and funding access for further deterioration.",
      "growth-slowdown": "Watch growth, jobs, activity gauges, and official guidance to confirm the slowdown.",
      "growth-improvement": "Watch growth, consumption, labor, and official revisions to see whether the improvement is broadening.",
      "crypto-liquidity": "Watch BTC, ETH, real yields, the dollar, and regulation for spillover into market pricing.",
    }[item.signalType],
  };
}

export function getLocalizedNewsNarrativeSafe(item: NewsItem, locale: Locale) {
  const countryLabel =
    item.relatedCountries.length > 0
      ? item.relatedCountries.slice(0, 2).map((country) => country.name).join(locale === "es" ? " y " : " and ")
      : locale === "es"
        ? "los mercados vinculados"
        : "the linked markets";

  if (locale === "es") {
    const sourceLabel = getLocalizedNewsSourceLabelSafe(item.sourceId, locale);

    return {
      happened: {
        "central-bank-shift": `${sourceLabel} publico una actualizacion o comunicacion oficial capaz de mover rapido tasas, bonos, FX y valuaciones.`,
        "inflation-pressure": `${sourceLabel} aporta una senal de presion inflacionaria o expectativas de precios que puede cambiar el escenario macro para ${countryLabel}.`,
        "currency-stress": `${sourceLabel} muestra tension cambiaria o presion sobre la moneda, algo clave para seguir inflacion importada y activos en moneda dura.`,
        "debt-risk": `${sourceLabel} senala riesgo de deuda, refinanciacion o fragilidad fiscal con impacto potencial sobre spreads y apetito por riesgo.`,
        "growth-slowdown": `${sourceLabel} apunta a una desaceleracion del crecimiento o a un deterioro del impulso economico en ${countryLabel}.`,
        "growth-improvement": `${sourceLabel} sugiere una mejora del crecimiento o una senal mas constructiva para la actividad y los activos vinculados.`,
        "crypto-liquidity": `${sourceLabel} conecta la macro con crypto, liquidez o regulacion de mercados digitales que puede afectar BTC, ETH y el apetito por riesgo.`,
      }[item.signalType],
      why: {
        "central-bank-shift": "Estos cambios suelen mover expectativas de tasas, rendimientos, divisas y multiplos de mercado antes de que cambien los datos duros.",
        "inflation-pressure": "La inflacion cambia la trayectoria esperada de tasas, el retorno real y la visibilidad de margenes en acciones y bonos.",
        "currency-stress": "La presion cambiaria importa porque puede empeorar inflacion, deuda en moneda dura y percepcion de riesgo pais.",
        "debt-risk": "Las noticias de deuda importan porque afectan refinanciacion, spreads soberanos, moneda y acceso al financiamiento.",
        "growth-slowdown": "Una desaceleracion suele pegar primero en expectativas, utilidades, credito y posicionamiento de riesgo.",
        "growth-improvement": "Una mejora del crecimiento puede favorecer demanda, utilidades y una lectura mas constructiva del riesgo macro.",
        "crypto-liquidity": "Cuando cambia la liquidez o la regulacion macro, crypto suele reaccionar rapido junto con tasas reales y dolar.",
      }[item.signalType],
      watch: {
        "central-bank-shift": "Segui tasas, rendimientos, tipo de cambio y sensibilidad de acciones locales para confirmar el impacto.",
        "inflation-pressure": "Segui inflacion, tasas y expectativas de precios para ver si la presion persiste o empieza a moderarse.",
        "currency-stress": "Segui FX, pass-through inflacionario y senales de tension financiera para medir si el shock se profundiza.",
        "debt-risk": "Segui metricas de deuda, spreads, rollover y titulares de financiamiento para detectar deterioro adicional.",
        "growth-slowdown": "Segui crecimiento, empleo, actividad y guias oficiales para ver si la desaceleracion se confirma.",
        "growth-improvement": "Segui crecimiento, consumo, empleo y revisiones oficiales para ver si la mejora gana consistencia.",
        "crypto-liquidity": "Segui BTC, ETH, tasas reales, dolar y cambios regulatorios para medir si la noticia se traslada al mercado.",
      }[item.signalType],
    };
  }

  return getLocalizedNewsNarrative(item, locale);
}

export function classifyNewsText(title: string, summary: string) {
  const text = `${title} ${summary}`.trim();
  const relatedCountries = matchCountries(text);
  const topics = matchTopics(text);
  const signalType = inferSignalType(text, topics);
  const relatedIndicators = inferIndicators(topics);
  const importance = inferImportance(signalType, topics, relatedCountries);

  return {
    relatedCountries,
    topics,
    signalType,
    relatedIndicators,
    importance,
  };
}

function toNewsItem(sourceId: NewsSourceId, entry: ParsedFeedEntry): NewsItem {
  const source = newsSourceDefinitions[sourceId];
  const text = `${entry.title} ${entry.summary} ${entry.category ?? ""}`.trim();
  const fallbackCountries = matchCountries(text);
  const sourceSpecific = sourceId === "fed"
    ? classifyFedEntry(entry, fallbackCountries)
    : sourceId === "ecb"
      ? classifyEcbEntry(entry)
      : sourceId === "investing"
        ? classifyInvestingEntry(entry)
        : sourceId === "coindesk"
          ? classifyCoinDeskEntry(entry)
        : null;
  const relatedCountries = sourceSpecific?.relatedCountries ?? fallbackCountries;
  const topics = sourceSpecific?.topics ?? matchTopics(text);
  const signalType = sourceSpecific?.signalType ?? inferSignalType(text, topics);
  const relatedIndicators = sourceSpecific?.relatedIndicators ?? inferIndicators(topics);
  const importance = sourceSpecific?.importance ?? inferImportance(signalType, topics, relatedCountries);
  const assetClasses = sourceSpecific?.assetClasses ?? inferAssetClasses(topics);

  return {
    id: `${sourceId}:${toKebabCase(entry.title)}:${entry.publishedAt}`,
    slug: toKebabCase(entry.title),
    title: entry.title,
    summary: entry.summary,
    source: source.name,
    sourceId,
    sourceType: source.type,
    publishedAt: new Date(entry.publishedAt).toISOString(),
    url: entry.url,
    countries: relatedCountries.map((country) => country.iso3),
    topics,
    assetClasses,
    importance,
    signalType,
    relevanceScore: computeRelevanceScore(signalType, importance, relatedCountries, topics, entry.publishedAt),
    language: "en",
    whyItMatters: buildWhyItMatters(signalType, relatedCountries),
    whatHappened: buildWhatHappened(entry.title, entry.summary),
    watchNow: buildWatchNow(signalType, relatedIndicators, relatedCountries),
    relatedIndicators,
    relatedCountries,
  };
}

async function fetchRssFeed(sourceId: NewsSourceId) {
  const source = newsSourceDefinitions[sourceId];
  if (!source.feedUrl) return [] as NewsItem[];

  try {
    const response = await fetch(source.feedUrl, {
      next: { revalidate: 60 * 20 },
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
    } as RequestInit & { next: { revalidate: number } });

    if (!response.ok) {
      return [] as NewsItem[];
    }

    const xml = await response.text();
    return parseRss(xml)
      .filter((entry) => shouldKeepSourceEntry(sourceId, entry))
      .slice(0, 20)
      .map((entry) => toNewsItem(sourceId, entry));
  } catch {
    return [] as NewsItem[];
  }
}

async function fetchInvestingNews() {
  const source = newsSourceDefinitions.investing;

  try {
    const responses = await Promise.all(
      investingFeedUrls.map(async (feedUrl) => {
        const response = await fetch(feedUrl, {
          next: { revalidate: 60 * 20 },
          headers: {
            Accept: "application/rss+xml, application/xml, text/xml, */*",
          },
        } as RequestInit & { next: { revalidate: number } });

        if (!response.ok) return [] as ParsedFeedEntry[];
        const xml = await response.text();
        return parseRss(xml).filter((entry) => shouldKeepSourceEntry("investing", entry));
      }),
    );

    return uniqueBy(
      responses.flat().map((entry) => ({
        ...toNewsItem("investing", entry),
        source: source.name,
      })),
      (item) => item.url,
    ).slice(0, 24);
  } catch {
    return [] as NewsItem[];
  }
}

async function fetchImfNews() {
  const source = newsSourceDefinitions.imf;
  if (!source.feedUrl) return [] as NewsItem[];

  try {
    const indexResponse = await fetch(source.feedUrl, {
      next: { revalidate: 60 * 20 },
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "User-Agent": "Mozilla/5.0 (compatible; GlobalEconBot/1.0; +https://www.imf.org/)",
      },
    } as RequestInit & { next: { revalidate: number } });

    if (!indexResponse.ok) {
      return [] as NewsItem[];
    }

    const indexHtml = await indexResponse.text();
    const articleUrls = parseImfIndex(indexHtml);
    if (articleUrls.length === 0) {
      return [] as NewsItem[];
    }

    const articles = await Promise.all(
      articleUrls.map(async (url) => {
        try {
          const articleResponse = await fetch(url, {
            next: { revalidate: 60 * 20 },
            headers: {
              Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              "User-Agent": "Mozilla/5.0 (compatible; GlobalEconBot/1.0; +https://www.imf.org/)",
            },
          } as RequestInit & { next: { revalidate: number } });

          if (!articleResponse.ok) {
            return null;
          }

          const html = await articleResponse.text();
          const metadata = parseImfArticle(html, url);
          if (!metadata) {
            return null;
          }

          const entry: ParsedFeedEntry = {
            title: metadata.title,
            summary: metadata.summary,
            url,
            publishedAt: metadata.publishedAt,
            category: metadata.articleType ?? "",
          };

          const fallbackCountries = matchCountries(`${metadata.countryName ?? ""} ${metadata.title} ${metadata.summary}`);
          const sourceSpecific = classifyImfEntry(entry, metadata, fallbackCountries);
          const topics = sourceSpecific.topics;
          const signalType = sourceSpecific.signalType;
          const relatedIndicators = sourceSpecific.relatedIndicators;
          const relatedCountries = sourceSpecific.relatedCountries;
          const importance = sourceSpecific.importance;
          const assetClasses = sourceSpecific.assetClasses;

          return {
            id: `imf:${toKebabCase(metadata.title)}:${metadata.publishedAt}`,
            slug: toKebabCase(metadata.title),
            title: metadata.title,
            summary: metadata.summary,
            source: source.name,
            sourceId: "imf" as const,
            sourceType: source.type,
            publishedAt: new Date(metadata.publishedAt).toISOString(),
            url,
            countries: relatedCountries.map((country) => country.iso3),
            topics,
            assetClasses,
            importance,
            signalType,
            relevanceScore: computeRelevanceScore(signalType, importance, relatedCountries, topics, metadata.publishedAt),
            language: "en" as const,
            whyItMatters: buildWhyItMatters(signalType, relatedCountries),
            whatHappened: buildWhatHappened(metadata.title, metadata.summary),
            watchNow: buildWatchNow(signalType, relatedIndicators, relatedCountries),
            relatedIndicators,
            relatedCountries,
          } satisfies NewsItem;
        } catch {
          return null;
        }
      }),
    );

    return articles.filter((item) => item !== null) as NewsItem[];
  } catch {
    return [] as NewsItem[];
  }
}

async function fetchMarketaux() {
  const apiKey = process.env.MARKETAUX_API_KEY;
  if (!apiKey) return [] as NewsItem[];

  try {
    const publishedAfter = new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString().slice(0, 10);
    const queryGroups = [
      ['"inflation"', '"central bank"', '"interest rates"', '"rate cut"', '"rate hike"', '"bond yields"', '"unemployment"'],
      ['"oil"', '"crude"', '"forex"', '"currency"', '"devaluation"', '"bitcoin"', '"ethereum"', '"crypto liquidity"', '"tariffs"'],
      ['"bitcoin"', '"ethereum"', '"crypto"', '"stablecoin"', '"digital assets"', '"forex"', '"dollar"', '"euro"'],
    ];

    const responses = await Promise.all(
      queryGroups.map(async (terms) => {
        const params = new URLSearchParams({
          api_token: apiKey,
          language: "en",
          filter_entities: "true",
          must_have_entities: "true",
          group_similar: "true",
          sort: "published_desc",
          published_after: publishedAfter,
          limit: "3",
          search: terms.join(" OR "),
        });

        const response = await fetch(
          `https://api.marketaux.com/v1/news/all?${params.toString()}`,
          { next: { revalidate: 60 * 20 } } as RequestInit & { next: { revalidate: number } },
        );

        if (!response.ok) return [] as ParsedFeedEntry[];
        const payload = (await response.json()) as unknown;
        return parseMarketaux(payload);
      }),
    );

    return uniqueBy(
      responses.flat().map((entry) => toNewsItem("marketaux", entry)),
      (item) => item.url,
    ).slice(0, 6);
  } catch {
    return [] as NewsItem[];
  }
}

async function fetchSource(sourceId: NewsSourceId) {
  if (sourceId === "imf") {
    return fetchImfNews();
  }

  if (sourceId === "marketaux") {
    return fetchMarketaux();
  }

  if (sourceId === "investing") {
    return fetchInvestingNews();
  }

  return fetchRssFeed(sourceId);
}

function dedupeNews(items: NewsItem[]) {
  const byUrl = uniqueBy(items, (item) => item.url || `${item.sourceId}:${item.slug}`);
  return uniqueBy(byUrl, (item) => item.slug);
}

function sortNewsByPublishedAt(items: NewsItem[]) {
  return [...items].sort(
    (left, right) =>
      Date.parse(right.publishedAt) - Date.parse(left.publishedAt) ||
      right.relevanceScore - left.relevanceScore,
  );
}

function buildSimilarityKey(item: NewsItem) {
  return `${item.signalType}|${`${item.title} ${item.summary}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(the|and|with|for|from|into|under|after|before|will|has|have|had|said|says|news|press|release|board|federal|reserve|ecb|imf|coindesk|investing|marketaux)\b/g, " ")
    .replace(/\b(bitcoin|ethereum|stablecoin|crypto|digital|euro|dollar|oil|crude|jobs|employment|inflation|rates|yield|market|policy)\b/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 8)
    .join(" ")}`;
}

function takeUniqueDiverse(candidates: NewsItem[], limit: number, maxPerSource = 2) {
  const perSource = new Map<NewsSourceId, number>();
  const seenSimilarity = new Set<string>();
  const selected: NewsItem[] = [];

  for (const item of candidates) {
    if (selected.some((selectedItem) => selectedItem.id === item.id)) continue;
    const sourceCount = perSource.get(item.sourceId) ?? 0;
    if (sourceCount >= maxPerSource) continue;

    const similarityKey = buildSimilarityKey(item);
    if (seenSimilarity.has(similarityKey)) continue;

    selected.push(item);
    perSource.set(item.sourceId, sourceCount + 1);
    seenSimilarity.add(similarityKey);
    if (selected.length >= limit) break;
  }

  return selected;
}

function getSectionStoryBucket(sectionId: string, item: NewsItem) {
  const haystack = `${item.title} ${item.summary}`.toLowerCase();

  if (sectionId === "latest" || sectionId === "top") {
    return `${item.signalType}:${item.sourceId}`;
  }

  if (sectionId === "central-banks") {
    if (haystack.includes("fed") || haystack.includes("fomc") || haystack.includes("federal reserve")) return "fed";
    if (haystack.includes("ecb") || haystack.includes("lagarde") || haystack.includes("euro area")) return "ecb";
    if (haystack.includes("boj") || haystack.includes("bank of japan")) return "boj";
    if (haystack.includes("boe") || haystack.includes("bank of england")) return "boe";
    if (haystack.includes("rate cut") || haystack.includes("rate hike") || haystack.includes("interest rates")) {
      return "rates";
    }
    if (haystack.includes("minutes") || haystack.includes("statement") || haystack.includes("projections")) {
      return "guidance";
    }
    return "policy";
  }

  if (sectionId === "inflation") {
    if (haystack.includes("cpi")) return "cpi";
    if (haystack.includes("ppi")) return "ppi";
    if (haystack.includes("wage") || haystack.includes("salary")) return "wages";
    if (haystack.includes("consumer expectations")) return "expectations";
    if (haystack.includes("oil") || haystack.includes("gas") || haystack.includes("energy")) return "energy";
    if (haystack.includes("food")) return "food";
    return "prices";
  }

  if (sectionId === "debt") {
    if (haystack.includes("default") || haystack.includes("restructuring")) return "default";
    if (haystack.includes("refinancing") || haystack.includes("rollover")) return "refinancing";
    if (haystack.includes("bond") || haystack.includes("yield") || haystack.includes("spread")) return "bond-market";
    if (haystack.includes("facility") || haystack.includes("imf")) return "imf-program";
    if (haystack.includes("fiscal")) return "fiscal";
    return "debt";
  }

  if (sectionId === "forex") {
    if (haystack.includes("dollar") || haystack.includes("usd")) return "usd";
    if (haystack.includes("euro") || haystack.includes("eur")) return "eur";
    if (haystack.includes("yen") || haystack.includes("jpy")) return "jpy";
    if (haystack.includes("devaluation") || haystack.includes("currency stress")) return "stress";
    if (haystack.includes("trade") || haystack.includes("tariff")) return "trade";
    return "fx";
  }

  return item.signalType;
}

function prioritizeSectionStories(sectionId: string, candidates: NewsItem[], limit: number, maxPerSource = 3) {
  const ordered = sortNewsByPublishedAt(candidates);
  const seeded: NewsItem[] = [];
  const seenBuckets = new Set<string>();

  for (const item of ordered) {
    const bucket = getSectionStoryBucket(sectionId, item);
    if (seenBuckets.has(bucket)) continue;
    seeded.push(item);
    seenBuckets.add(bucket);
    if (seeded.length >= limit) break;
  }

  return sortNewsByPublishedAt(takeUniqueDiverse([...seeded, ...ordered], limit, maxPerSource));
}

function getTopicStoryBucket(topic: NewsTopic, item: NewsItem) {
  const haystack = `${item.title} ${item.summary}`.toLowerCase();

  if (topic === "crypto") {
    return getCryptoStoryBucket(item);
  }

  if (topic === "inflation") {
    if (haystack.includes("cpi")) return "cpi";
    if (haystack.includes("ppi")) return "ppi";
    if (haystack.includes("wage") || haystack.includes("salary")) return "wages";
    if (haystack.includes("energy") || haystack.includes("oil") || haystack.includes("gas")) return "energy";
    return "prices";
  }

  if (topic === "central-banks") {
    if (haystack.includes("fed") || haystack.includes("fomc")) return "fed";
    if (haystack.includes("ecb") || haystack.includes("lagarde")) return "ecb";
    if (haystack.includes("boj")) return "boj";
    if (haystack.includes("boe")) return "boe";
    if (haystack.includes("minutes") || haystack.includes("statement")) return "guidance";
    return "policy";
  }

  if (topic === "debt") {
    if (haystack.includes("default") || haystack.includes("restructuring")) return "default";
    if (haystack.includes("refinancing")) return "refinancing";
    if (haystack.includes("bond") || haystack.includes("yield") || haystack.includes("spread")) return "bond-market";
    return "debt";
  }

  if (topic === "forex") {
    if (haystack.includes("dollar") || haystack.includes("usd")) return "usd";
    if (haystack.includes("euro") || haystack.includes("eur")) return "eur";
    if (haystack.includes("yen") || haystack.includes("jpy")) return "jpy";
    return "fx";
  }

  if (topic === "energy") {
    if (haystack.includes("oil") || haystack.includes("crude") || haystack.includes("brent") || haystack.includes("wti")) return "oil";
    if (haystack.includes("gas") || haystack.includes("lng")) return "gas";
    if (haystack.includes("power") || haystack.includes("electricity")) return "power";
    return "energy";
  }

  if (topic === "labor") {
    if (haystack.includes("jobs") || haystack.includes("employment")) return "jobs";
    if (haystack.includes("unemployment") || haystack.includes("jobless")) return "unemployment";
    if (haystack.includes("wage") || haystack.includes("salary") || haystack.includes("payroll")) return "wages";
    return "labor";
  }

  if (topic === "growth") {
    if (haystack.includes("gdp")) return "gdp";
    if (haystack.includes("recession") || haystack.includes("slowdown")) return "slowdown";
    if (haystack.includes("pmi")) return "pmi";
    return "growth";
  }

  return item.signalType;
}

function prioritizeTopicStories(topic: NewsTopic, candidates: NewsItem[], limit: number) {
  const ordered = sortNewsByPublishedAt(candidates);
  const seeded: NewsItem[] = [];
  const seenBuckets = new Set<string>();

  for (const item of ordered) {
    const bucket = getTopicStoryBucket(topic, item);
    if (seenBuckets.has(bucket)) continue;
    seeded.push(item);
    seenBuckets.add(bucket);
    if (seeded.length >= limit) break;
  }

  return sortNewsByPublishedAt(takeUniqueDiverse([...seeded, ...ordered], limit, 3));
}

function prioritizeMixedStories(candidates: NewsItem[], limit: number, maxPerSource = 3) {
  return prioritizeSectionStories("latest", candidates, limit, maxPerSource);
}

function isHighValueCryptoStory(item: NewsItem) {
  const haystack = `${item.title} ${item.summary}`.toLowerCase();
  return (
    haystack.includes("bitcoin etf") ||
    haystack.includes("ethereum etf") ||
    haystack.includes("stablecoin") ||
    haystack.includes("regulation") ||
    haystack.includes("regulatory") ||
    haystack.includes("sec") ||
    haystack.includes("tokenized") ||
    haystack.includes("tokenised") ||
    haystack.includes("digital asset") ||
    haystack.includes("bitcoin") ||
    haystack.includes("ethereum") ||
    haystack.includes("liquidity") ||
    haystack.includes("exchange") ||
    haystack.includes("custody")
  );
}

function getCryptoStoryBucket(item: NewsItem) {
  const haystack = `${item.title} ${item.summary}`.toLowerCase();

  if (haystack.includes("bitcoin etf")) return "bitcoin-etf";
  if (haystack.includes("ethereum etf")) return "ethereum-etf";
  if (haystack.includes("stablecoin")) return "stablecoins";
  if (haystack.includes("regulation") || haystack.includes("regulatory") || haystack.includes("sec")) {
    return "regulation";
  }
  if (haystack.includes("exchange") || haystack.includes("custody")) return "exchanges";
  if (haystack.includes("tokenized") || haystack.includes("tokenised") || haystack.includes("digital asset")) {
    return "tokenization";
  }
  if (haystack.includes("ethereum") || haystack.includes("eth")) return "ethereum";
  if (haystack.includes("bitcoin") || haystack.includes("btc")) return "bitcoin";
  if (haystack.includes("liquidity") || haystack.includes("flows") || haystack.includes("inflows")) {
    return "liquidity";
  }

  return "general";
}

function prioritizeCryptoStories(candidates: NewsItem[], limit: number) {
  const ordered = sortNewsByPublishedAt(candidates);
  const preferredBuckets = [
    "bitcoin-etf",
    "ethereum-etf",
    "bitcoin",
    "ethereum",
    "stablecoins",
    "regulation",
    "exchanges",
    "tokenization",
    "liquidity",
    "general",
  ] as const;

  const seeded: NewsItem[] = [];

  for (const bucket of preferredBuckets) {
    const match = ordered.find(
      (item) =>
        getCryptoStoryBucket(item) === bucket &&
        !seeded.some((seededItem) => seededItem.id === item.id),
    );

    if (match) {
      seeded.push(match);
    }
  }

  return sortNewsByPublishedAt(
    takeUniqueDiverse([...seeded, ...ordered], limit, 3),
  );
}

export const getMacroNews = cache(async function getMacroNews() {
  const sourceIds = Object.keys(newsSourceDefinitions) as NewsSourceId[];
  const settled = await Promise.all(sourceIds.map((sourceId) => fetchSource(sourceId)));

  return sortNewsByPublishedAt(dedupeNews(settled.flat())).slice(0, 120);
});

export const getNewsSections = cache(async function getNewsSections() {
  const items = await getMacroNews();
  const fillSection = (sectionId: string, primary: NewsItem[], secondary: NewsItem[], limit: number, maxPerSource = 3) =>
    prioritizeSectionStories(sectionId, [...primary, ...secondary], limit, maxPerSource);

  const sections: NewsSection[] = [
    {
      id: "latest",
      title: { en: "Latest mixed stories", es: "Ultimas noticias mixtas" },
      description: {
        en: "A broader mixed feed across all connected sources so you can see more material without losing source variety.",
        es: "Un feed mas amplio y mixto entre todas las fuentes conectadas para ver mas material sin perder variedad de canales.",
      },
      items: prioritizeSectionStories("latest", items, 16, 4),
    },
    {
      id: "top",
      title: { en: "Top macro stories", es: "Principales historias macro" },
      description: {
        en: "The highest-priority stories across inflation, rates, FX, debt, and growth.",
        es: "Las historias de mayor prioridad en inflacion, tasas, FX, deuda y crecimiento.",
      },
      items: prioritizeSectionStories("top", items.filter((item) => item.importance === "high"), 8, 3),
    },
    {
      id: "central-banks",
      title: { en: "Central banks", es: "Bancos centrales" },
      description: {
        en: "Policy moves and communication that can quickly reprice rates, FX, and equities.",
        es: "Movimientos de politica y comunicacion que pueden repricing rapido de tasas, FX y acciones.",
      },
      items: fillSection(
        "central-banks",
        items.filter((item) => item.signalType === "central-bank-shift"),
        items.filter(
          (item) =>
            item.topics.includes("central-banks") ||
            item.topics.includes("forex") ||
            item.relatedIndicators.includes("interestRate"),
        ),
        8,
        4,
      ),
    },
    {
      id: "inflation",
      title: { en: "Inflation watch", es: "Vigilancia de inflacion" },
      description: {
        en: "Price-pressure stories that matter for rate expectations and real returns.",
        es: "Historias de precios que importan para expectativas de tasas y retornos reales.",
      },
      items: fillSection(
        "inflation",
        items.filter((item) => item.signalType === "inflation-pressure"),
        items.filter(
          (item) =>
            item.topics.includes("inflation") ||
            item.topics.includes("energy") ||
            item.relatedIndicators.includes("inflation"),
        ),
        8,
        4,
      ),
    },
    {
      id: "debt",
      title: { en: "Debt risk", es: "Riesgo de deuda" },
      description: {
        en: "Debt and refinancing stories that can change sovereign and currency risk quickly.",
        es: "Historias de deuda y refinanciacion que pueden cambiar rapido el riesgo soberano y cambiario.",
      },
      items: fillSection(
        "debt",
        items.filter((item) => item.signalType === "debt-risk"),
        items.filter(
          (item) =>
            item.topics.includes("debt") ||
            item.relatedIndicators.includes("externalDebt") ||
            item.assetClasses.includes("bonds"),
        ),
        8,
        4,
      ),
    },
    {
      id: "forex",
      title: { en: "Forex pressure", es: "Presion forex" },
      description: {
        en: "Currency stories that matter for imported inflation and hard-currency returns.",
        es: "Historias de monedas que importan para inflacion importada y retornos en moneda dura.",
      },
      items: fillSection(
        "forex",
        items.filter((item) => item.signalType === "currency-stress"),
        items.filter(
          (item) =>
            item.topics.includes("forex") ||
            item.assetClasses.includes("forex") ||
            item.topics.includes("central-banks"),
        ),
        8,
        4,
      ),
    },
    {
      id: "crypto",
      title: { en: "Crypto", es: "Crypto" },
      description: {
        en: "Bitcoin, Ethereum, stablecoins, regulation, ETFs, exchanges, and digital-asset flows.",
        es: "Bitcoin, Ethereum, stablecoins, regulacion, ETFs, exchanges y flujos de activos digitales.",
      },
      items: prioritizeCryptoStories(
        items.filter(
          (item) =>
            isHighValueCryptoStory(item) &&
            (item.topics.includes("crypto") ||
              item.assetClasses.includes("crypto") ||
              item.sourceId === "coindesk" ||
              item.sourceId === "marketaux" ||
              item.sourceId === "investing"),
        ),
        10,
      ),
    },
  ];

  return sections.filter((section) => section.items.length > 0);
});

export async function getNewsByTopic(topic: NewsTopic) {
  const items = await getMacroNews();
  const direct = items.filter((item) => item.topics.includes(topic));
  if (direct.length >= 6) {
    return prioritizeTopicStories(topic, direct, 12);
  }

  const fallbackMatchers: Record<NewsTopic, (item: NewsItem) => boolean> = {
    inflation: (item) =>
      item.topics.includes("inflation") ||
      item.relatedIndicators.includes("inflation") ||
      item.signalType === "inflation-pressure",
    "central-banks": (item) =>
      item.topics.includes("central-banks") ||
      item.signalType === "central-bank-shift" ||
      item.relatedIndicators.includes("interestRate"),
    debt: (item) =>
      item.topics.includes("debt") ||
      item.signalType === "debt-risk" ||
      item.relatedIndicators.includes("externalDebt") ||
      item.assetClasses.includes("bonds"),
    growth: (item) =>
      item.topics.includes("growth") ||
      item.relatedIndicators.includes("gdpGrowth") ||
      item.signalType === "growth-slowdown" ||
      item.signalType === "growth-improvement",
    forex: (item) =>
      item.topics.includes("forex") ||
      item.assetClasses.includes("forex") ||
      item.signalType === "currency-stress" ||
      item.topics.includes("central-banks"),
    crypto: (item) =>
      item.topics.includes("crypto") ||
      item.assetClasses.includes("crypto") ||
      item.signalType === "crypto-liquidity" ||
      item.sourceId === "coindesk",
    energy: (item) =>
      item.topics.includes("energy") ||
      item.title.toLowerCase().includes("oil") ||
      item.title.toLowerCase().includes("gas") ||
      item.title.toLowerCase().includes("brent") ||
      item.title.toLowerCase().includes("wti") ||
      item.summary.toLowerCase().includes("oil") ||
      item.summary.toLowerCase().includes("gas") ||
      item.summary.toLowerCase().includes("energy") ||
      item.summary.toLowerCase().includes("crude"),
    labor: (item) =>
      item.topics.includes("labor") ||
      item.relatedIndicators.includes("unemployment") ||
      item.title.toLowerCase().includes("jobs") ||
      item.title.toLowerCase().includes("employment") ||
      item.title.toLowerCase().includes("wage") ||
      item.title.toLowerCase().includes("payroll") ||
      item.summary.toLowerCase().includes("jobs") ||
      item.summary.toLowerCase().includes("employment") ||
      item.summary.toLowerCase().includes("wage") ||
      item.summary.toLowerCase().includes("payroll"),
  };

  const related = items.filter(
    (item) =>
      !direct.some((directItem) => directItem.id === item.id) &&
      fallbackMatchers[topic](item),
  );

  return prioritizeTopicStories(topic, [...direct, ...related], 12);
}

export async function getNewsByCountrySlug(slug: string) {
  const country = countryCatalog.find((item) => item.slug === slug);
  if (!country) return [];
  const items = await getMacroNews();
  return prioritizeMixedStories(items.filter((item) => item.countries.includes(country.iso3)), 12, 3);
}

export async function getNewsByIndicator(indicatorId: IndicatorId) {
  const items = await getMacroNews();
  return prioritizeMixedStories(items.filter((item) => item.relatedIndicators.includes(indicatorId)), 12, 3);
}

export async function getNewsByCountryIso3List(iso3List: string[]) {
  const set = new Set(iso3List);
  const items = await getMacroNews();
  return prioritizeMixedStories(
    items.filter((item) => item.countries.some((iso3) => set.has(iso3))),
    12,
    3,
  );
}

export async function getNewsBySignalTypes(signalTypes: NewsSignalType[]) {
  const set = new Set(signalTypes);
  const items = await getMacroNews();
  return prioritizeMixedStories(items.filter((item) => set.has(item.signalType)), 12, 3);
}

export function getTopicLabel(topic: NewsTopic, locale: Locale) {
  return newsTopicDefinitions[topic].labels[locale];
}

export function getTopicDescription(topic: NewsTopic, locale: Locale) {
  return newsTopicDefinitions[topic].descriptions[locale];
}

export function getIndicatorLabels(indicatorIds: IndicatorId[]) {
  return indicatorIds.map((indicatorId) => ({
    id: indicatorId,
    label: getIndicatorDefinition(indicatorId).shortLabel,
  }));
}

export function getRegionLabelsForNews(item: NewsItem) {
  return inferRegions(item.relatedCountries);
}

export function getAllNewsTopics() {
  return allNewsTopics;
}

