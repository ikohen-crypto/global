"use client";

type AnalyticsEvent =
  | "search_used"
  | "compare_created"
  | "chart_range_changed"
  | "ranking_viewed"
  | "country_favorited"
  | "export_clicked"
  | "premium_cta_clicked"
  | "ad_slot_rendered";

export function trackEvent(
  event: AnalyticsEvent,
  payload: Record<string, string | number | boolean | undefined> = {},
) {
  const provider = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER || "console";

  if (provider === "console" || typeof window === "undefined") {
    if (process.env.NODE_ENV !== "production") {
      console.info("[analytics]", event, payload);
    }
    return;
  }

  if (provider === "plausible" && "plausible" in window) {
    (window as Window & { plausible?: (name: string, options?: { props: typeof payload }) => void })
      .plausible?.(event, { props: payload });
    return;
  }

  if (provider === "posthog" && "posthog" in window) {
    (
      window as Window & {
        posthog?: { capture: (name: string, props?: typeof payload) => void };
      }
    ).posthog?.capture(event, payload);
  }
}
