"use client";

import { useEffect } from "react";

import { storage } from "@/lib/storage";

export function RecentCountryTracker({ slug }: { slug: string }) {
  useEffect(() => {
    storage.addRecentCountry(slug);
  }, [slug]);

  return null;
}
