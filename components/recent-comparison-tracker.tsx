"use client";

import { useEffect } from "react";

import { storage } from "@/lib/storage";

export function RecentComparisonTracker({ slug }: { slug: string }) {
  useEffect(() => {
    storage.addRecentComparison(slug);
  }, [slug]);

  return null;
}
