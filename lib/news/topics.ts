import type { NewsAssetClass, NewsImportance, NewsTopic } from "@/lib/types";

export const newsTopicDefinitions: Record<
  NewsTopic,
  {
    slug: NewsTopic;
    labels: { en: string; es: string };
    descriptions: { en: string; es: string };
    keywords: string[];
    assetClasses: NewsAssetClass[];
    defaultImportance: NewsImportance;
  }
> = {
  inflation: {
    slug: "inflation",
    labels: { en: "Inflation", es: "Inflacion" },
    descriptions: {
      en: "Prices, inflation surprises, and purchasing-power pressure.",
      es: "Precios, sorpresas de inflacion y presion sobre poder adquisitivo.",
    },
    keywords: ["inflation", "prices", "consumer prices", "cpi", "ppi", "disinflation"],
    assetClasses: ["macro", "bonds", "forex", "crypto"],
    defaultImportance: "high",
  },
  "central-banks": {
    slug: "central-banks",
    labels: { en: "Central banks", es: "Bancos centrales" },
    descriptions: {
      en: "Rate decisions, liquidity, guidance, and policy signals.",
      es: "Decisiones de tasas, liquidez, guidance y senales de politica.",
    },
    keywords: [
      "central bank",
      "federal reserve",
      "ecb",
      "rate decision",
      "rates",
      "policy rate",
      "monetary policy",
      "hawkish",
      "dovish",
    ],
    assetClasses: ["macro", "bonds", "forex", "equities", "crypto"],
    defaultImportance: "high",
  },
  debt: {
    slug: "debt",
    labels: { en: "Debt", es: "Deuda" },
    descriptions: {
      en: "Sovereign debt, refinancing, fiscal stress, and external vulnerability.",
      es: "Deuda soberana, refinanciacion, estres fiscal y vulnerabilidad externa.",
    },
    keywords: ["debt", "bond", "yield", "fiscal", "refinancing", "default", "sovereign"],
    assetClasses: ["macro", "bonds", "forex"],
    defaultImportance: "high",
  },
  growth: {
    slug: "growth",
    labels: { en: "Growth", es: "Crecimiento" },
    descriptions: {
      en: "GDP, demand, recession signals, and activity momentum.",
      es: "PIB, demanda, senales de recesion e impulso de actividad.",
    },
    keywords: ["gdp", "growth", "recession", "activity", "output", "economy", "demand"],
    assetClasses: ["macro", "equities", "forex"],
    defaultImportance: "medium",
  },
  forex: {
    slug: "forex",
    labels: { en: "Forex", es: "Forex" },
    descriptions: {
      en: "Currencies, exchange rates, and devaluation pressure.",
      es: "Monedas, tipos de cambio y presion de devaluacion.",
    },
    keywords: ["fx", "forex", "currency", "exchange rate", "devaluation", "dollar", "euro"],
    assetClasses: ["forex", "macro", "crypto"],
    defaultImportance: "high",
  },
  crypto: {
    slug: "crypto",
    labels: { en: "Crypto", es: "Crypto" },
    descriptions: {
      en: "Bitcoin, stablecoins, regulation, and macro-to-crypto spillovers.",
      es: "Bitcoin, stablecoins, regulacion y contagio macro hacia crypto.",
    },
    keywords: ["bitcoin", "btc", "ethereum", "eth", "crypto", "stablecoin", "digital asset"],
    assetClasses: ["crypto", "forex", "macro"],
    defaultImportance: "medium",
  },
  energy: {
    slug: "energy",
    labels: { en: "Energy", es: "Energia" },
    descriptions: {
      en: "Oil, gas, and energy shocks that feed inflation and balances.",
      es: "Petroleo, gas y shocks energeticos que afectan inflacion y balances.",
    },
    keywords: [
      "oil",
      "crude",
      "brent",
      "wti",
      "gas",
      "natural gas",
      "lng",
      "energy",
      "energy prices",
      "energy shock",
      "electricity",
      "power prices",
      "fuel",
      "commodity",
      "commodities",
    ],
    assetClasses: ["macro", "equities", "forex"],
    defaultImportance: "medium",
  },
  labor: {
    slug: "labor",
    labels: { en: "Labor", es: "Laboral" },
    descriptions: {
      en: "Employment, wages, and labor slack.",
      es: "Empleo, salarios y holgura laboral.",
    },
    keywords: [
      "labor",
      "labour",
      "employment",
      "jobs",
      "job growth",
      "jobless",
      "jobless claims",
      "wages",
      "payrolls",
      "nonfarm payrolls",
      "unemployment",
      "labor market",
      "labour market",
      "worker",
      "workers",
      "salary",
      "salaries",
      "earnings",
    ],
    assetClasses: ["macro", "equities"],
    defaultImportance: "medium",
  },
};

export const allNewsTopics = Object.keys(newsTopicDefinitions) as NewsTopic[];
