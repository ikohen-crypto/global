import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataQualityBadges } from "@/components/data-quality-badges";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function providerLabel(provider: string | null, locale: Locale) {
  if (provider === "oecd") return "OECD";
  if (provider === "un") return "UN";
  if (provider === "worldBank") return "World Bank";
  if (provider === "imf") return "IMF";
  if (provider === "national") return locale === "es" ? "Metadata" : "Metadata";
  return null;
}

export function MetricCard({
  label,
  value,
  caption,
  sourceProvider = null,
  freshnessStatus = null,
  qualityFlags = [],
  locale = "en",
}: {
  label: string;
  value: string;
  caption: string;
  sourceProvider?: string | null;
  freshnessStatus?: "fresh" | "lagged" | "stale" | null;
  qualityFlags?: Array<"estimate" | "projection" | "proxy" | "fallback">;
  locale?: Locale;
}) {
  const badge = providerLabel(sourceProvider, locale);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <CardTitle className="text-base">{label}</CardTitle>
        {badge ? (
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide",
              sourceProvider === "oecd" && "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
              sourceProvider === "un" && "border-violet-400/30 bg-violet-500/10 text-violet-300",
              sourceProvider === "worldBank" && "border-sky-400/30 bg-sky-500/10 text-sky-300",
              sourceProvider === "imf" && "border-amber-400/30 bg-amber-500/10 text-amber-300",
              sourceProvider === "national" && "border-zinc-400/30 bg-zinc-500/10 text-zinc-300",
            )}
          >
            {badge}
          </span>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="font-display text-3xl font-semibold">{value}</div>
        <DataQualityBadges
          freshnessStatus={freshnessStatus}
          qualityFlags={qualityFlags}
          className="mt-3"
          locale={locale}
        />
        <p className="mt-2 text-sm text-muted-foreground">{caption}</p>
      </CardContent>
    </Card>
  );
}
