export type IndicatorCategory =
  | "economy"
  | "prices"
  | "labor"
  | "population"
  | "development"
  | "environment"
  | "debt";

export type IndicatorUnit =
  | "usd"
  | "usd_per_capita"
  | "percent"
  | "people"
  | "years"
  | "tons_per_capita";

export type ChartSuitability = "line" | "bar" | "line-bar" | "indexed";

export type DataSourceProvider = "worldBank" | "imf" | "oecd" | "national" | "un";

export type DataFrequency = "annual" | "quarterly" | "monthly";
export type FreshnessStatus = "fresh" | "lagged" | "stale";
export type DataQualityFlag = "estimate" | "projection" | "proxy" | "fallback";

export type IndicatorId =
  | "gdp"
  | "gdpPerCapita"
  | "inflation"
  | "unemployment"
  | "population"
  | "gdpGrowth"
  | "interestRate"
  | "externalDebt"
  | "co2PerCapita"
  | "lifeExpectancy";

export type FeatureGateId =
  | "compareMoreCountries"
  | "extendedHistory"
  | "csvExport"
  | "pdfExport"
  | "savedDashboards"
  | "noAds";

export type CountrySummary = {
  iso2: string;
  iso3: string;
  slug: string;
  name: string;
  shortName: string;
  region: string;
  subregion: string;
  capital: string;
  population: number | null;
  flagUrl: string;
  latlng: [number, number] | null;
  currencies: string[];
  languages: string[];
};

export type IndicatorPoint = {
  year: number;
  value: number | null;
};

export type IndicatorSourceMetadata = {
  provider: DataSourceProvider;
  sourceName: string;
  sourceCode: string;
  sourceId?: string | null;
  frequency: DataFrequency;
  expectedStartYear: number | null;
  expectedEndYear: "latest-available" | number | null;
  comparableAcrossCountries: boolean;
  notes?: string | null;
};

export type IndicatorSeries = {
  indicatorId: IndicatorId;
  sourceProvider: DataSourceProvider;
  sourceName: string;
  sourceCode: string;
  countryIso3: string;
  sourceLastUpdated: string | null;
  frequency: DataFrequency;
  coverageStartYear: number | null;
  coverageEndYear: number | null;
  latestAvailableLabel: string | null;
  comparableAcrossCountries: boolean;
  latestYear: number | null;
  latestValue: number | null;
  freshnessStatus?: FreshnessStatus | null;
  qualityFlags?: DataQualityFlag[];
  points: IndicatorPoint[];
};

export type MetricSnapshot = {
  indicatorId: IndicatorId;
  label: string;
  value: number | null;
  formattedValue: string;
  latestYear: number | null;
  latestLabel: string | null;
  sourceProvider: DataSourceProvider | null;
  sourceName: string | null;
  freshnessStatus: FreshnessStatus | null;
  qualityFlags: DataQualityFlag[];
  trend: IndicatorPoint[];
};

export type CountryProfile = {
  country: CountrySummary;
  metrics: Record<IndicatorId, MetricSnapshot>;
  compareSuggestions: CountrySummary[];
  regionPeers: CountrySummary[];
};

export type ComparisonCountry = {
  country: CountrySummary;
  metrics: Record<IndicatorId, IndicatorSeries>;
};

export type RankingRow = {
  country: CountrySummary;
  value: number | null;
  formattedValue: string;
  latestYear: number | null;
  sparkline: IndicatorPoint[];
};

export type FinancialRankingId =
  | "macro-stability"
  | "growth-vs-inflation"
  | "debt-pressure"
  | "funding-cost";

export type FinancialRankingRow = {
  country: CountrySummary;
  score: number;
  formattedScore: string;
  summary: string;
  latestPeriodLabel: string | null;
};

export type SearchEntity =
  | {
      type: "country";
      id: string;
      title: string;
      subtitle: string;
      href: string;
      keywords: string[];
    }
  | {
      type: "indicator" | "region" | "compare";
      id: string;
      title: string;
      subtitle: string;
      href: string;
      keywords: string[];
    };

export type Insight = {
  id: string;
  title: string;
  body: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type NewsTopic =
  | "inflation"
  | "central-banks"
  | "debt"
  | "growth"
  | "forex"
  | "crypto"
  | "energy"
  | "labor";

export type NewsAssetClass = "equities" | "forex" | "crypto" | "bonds" | "macro";

export type NewsImportance = "low" | "medium" | "high";
export type NewsSignalType =
  | "inflation-pressure"
  | "central-bank-shift"
  | "currency-stress"
  | "debt-risk"
  | "growth-slowdown"
  | "growth-improvement"
  | "crypto-liquidity";

export type NewsSourceId =
  | "imf"
  | "ecb"
  | "fed"
  | "investing"
  | "marketaux"
  | "coindesk"
  | "cointelegraph"
  | "cryptonews"
  | "messari"
  | "freeCryptoNews";

export type NewsSourceType = "rss" | "html" | "api";

export type NewsItem = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  source: string;
  sourceId: NewsSourceId;
  sourceType: NewsSourceType;
  publishedAt: string;
  url: string;
  canonicalUrl?: string | null;
  countries: string[];
  topics: NewsTopic[];
  assetClasses: NewsAssetClass[];
  importance: NewsImportance;
  signalType: NewsSignalType;
  relevanceScore: number;
  language: "en";
  whyItMatters: string;
  whatHappened: string;
  watchNow: string;
  relatedIndicators: IndicatorId[];
  relatedCountries: CountrySummary[];
  tags?: string[];
  tickers?: string[];
  sentiment?: string | null;
};
