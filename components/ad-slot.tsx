"use client";

import { useEffect } from "react";

import { trackEvent } from "@/lib/analytics";
import { getRuntimeFlags } from "@/lib/featureFlags";

export function AdSlot({
  slot,
  className = "",
}: {
  slot: "home-inline" | "country-sidebar" | "ranking-inline";
  className?: string;
}) {
  const flags = getRuntimeFlags();

  useEffect(() => {
    if (flags.ads) {
      trackEvent("ad_slot_rendered", { slot });
    }
  }, [flags.ads, slot]);

  if (!flags.ads) return null;

  return (
    <div className={`rounded-2xl border border-dashed border-border bg-card px-4 py-5 text-sm text-muted-foreground ${className}`}>
      Sponsor-ready ad slot: <span className="font-medium text-foreground">{slot}</span>
    </div>
  );
}
