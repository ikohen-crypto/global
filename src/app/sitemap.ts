import type { MetadataRoute } from "next";

import { getCountries, getRegions } from "@/lib/countries";
import { financialRankingDefinitions } from "@/lib/financial-rankings";
import { allIndicators } from "@/lib/indicators/registry";
import { allNewsTopics } from "@/lib/news/topics";
import { toKebabCase } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const countries = await getCountries();
  const regions = await getRegions();

  const staticRoutes = ["", "/compare", "/countries", "/regions", "/learn", "/news", "/rankings/financial"].map(
    (path) => ({
      url: `${siteUrl}${path}`,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8,
    }),
  );

  const countryRoutes = countries.slice(0, 80).map((country) => ({
    url: `${siteUrl}/country/${country.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const indicatorRoutes = allIndicators.map((indicator) => ({
    url: `${siteUrl}/indicator/${toKebabCase(indicator.id)}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const financialRankingRoutes = Object.keys(financialRankingDefinitions).map((ranking) => ({
    url: `${siteUrl}/rankings/financial/${ranking}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const newsTopicRoutes = allNewsTopics.map((topic) => ({
    url: `${siteUrl}/news/topic/${topic}`,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  const newsCountryRoutes = countries.slice(0, 60).map((country) => ({
    url: `${siteUrl}/news/country/${country.slug}`,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  const regionFinancialRankingRoutes = regions.flatMap((region) =>
    Object.keys(financialRankingDefinitions).map((ranking) => ({
      url: `${siteUrl}/region/${region.slug}/rankings/financial/${ranking}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  );

  return [
    ...staticRoutes,
    ...countryRoutes,
    ...indicatorRoutes,
    ...financialRankingRoutes,
    ...regionFinancialRankingRoutes,
    ...newsTopicRoutes,
    ...newsCountryRoutes,
  ];
}
