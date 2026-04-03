import type { NewsSourceId, NewsSourceType } from "@/lib/types";

export const newsSourceDefinitions: Record<
  NewsSourceId,
  {
    id: NewsSourceId;
    name: string;
    type: NewsSourceType;
    feedUrl?: string;
    homepage: string;
  }
> = {
  imf: {
    id: "imf",
    name: "IMF News",
    type: "html",
    feedUrl: "https://www.imf.org/en/news",
    homepage: "https://www.imf.org/en/News",
  },
  ecb: {
    id: "ecb",
    name: "ECB Press",
    type: "rss",
    feedUrl: "https://www.ecb.europa.eu/rss/press.html",
    homepage: "https://www.ecb.europa.eu/press/html/index.en.html",
  },
  fed: {
    id: "fed",
    name: "Federal Reserve Press",
    type: "rss",
    feedUrl: "https://www.federalreserve.gov/feeds/press_all.xml",
    homepage: "https://www.federalreserve.gov/newsevents/pressreleases.htm",
  },
  investing: {
    id: "investing",
    name: "Investing.com RSS",
    type: "rss",
    feedUrl: "https://www.investing.com/rss/news_25.rss",
    homepage: "https://www.investing.com/news/economy",
  },
  coindesk: {
    id: "coindesk",
    name: "CoinDesk",
    type: "rss",
    feedUrl: "https://www.coindesk.com/arc/outboundfeeds/rss/",
    homepage: "https://www.coindesk.com/",
  },
  marketaux: {
    id: "marketaux",
    name: "Marketaux",
    type: "api",
    homepage: "https://www.marketaux.com/",
  },
};
