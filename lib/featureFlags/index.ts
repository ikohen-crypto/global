import type { FeatureGateId } from "@/lib/types";

export type PlanTier = "free" | "premium";

export const featureGates: Record<
  FeatureGateId,
  { title: string; description: string; freeLimit?: number }
> = {
  compareMoreCountries: {
    title: "Compare up to 6 countries",
    description: "Premium unlocks 5th and 6th country slots for broader benchmark sets.",
    freeLimit: 4,
  },
  extendedHistory: {
    title: "Unlock 20y, 30y, and max history",
    description: "Go beyond the free 10-year view to study long-run structural change.",
  },
  csvExport: {
    title: "Export comparison data to CSV",
    description: "Take clean tables into spreadsheets, reports, or classroom assignments.",
  },
  pdfExport: {
    title: "Export charts to PDF",
    description: "Download share-ready PDF snapshots of charts and comparison cards.",
  },
  savedDashboards: {
    title: "Save custom dashboards",
    description: "Pin country sets, metrics, and views for faster repeat analysis.",
  },
  noAds: {
    title: "Ad-free experience",
    description: "Remove sponsor slots and keep research flows distraction-free.",
  },
};

export function isFeatureEnabled(feature: FeatureGateId, plan: PlanTier = "free") {
  if (feature === "noAds") {
    return plan === "premium";
  }

  return plan === "premium";
}

export function getRuntimeFlags() {
  return {
    ads: process.env.NEXT_PUBLIC_ENABLE_ADS !== "false",
    premium: process.env.NEXT_PUBLIC_ENABLE_PREMIUM !== "false",
    news: process.env.NEXT_PUBLIC_ENABLE_NEWS !== "false",
    newsletter: process.env.NEXT_PUBLIC_ENABLE_NEWSLETTER === "true",
    marketaux: Boolean(process.env.MARKETAUX_API_KEY),
  };
}
