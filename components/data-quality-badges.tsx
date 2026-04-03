import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";
import type { DataQualityFlag, FreshnessStatus } from "@/lib/types";

function freshnessLabel(status: FreshnessStatus, locale: Locale) {
  if (locale === "es") {
    if (status === "fresh") return "Reciente";
    if (status === "lagged") return "Con rezago";
    return "Atrasado";
  }

  if (status === "fresh") return "Fresh";
  if (status === "lagged") return "Lagged";
  return "Stale";
}

function freshnessClass(status: FreshnessStatus) {
  if (status === "fresh") return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
  if (status === "lagged") return "border-amber-400/30 bg-amber-500/10 text-amber-300";
  return "border-rose-400/30 bg-rose-500/10 text-rose-300";
}

function flagLabel(flag: DataQualityFlag, locale: Locale) {
  if (locale === "es") {
    if (flag === "estimate") return "Estimado";
    if (flag === "projection") return "Proyeccion";
    if (flag === "proxy") return "Proxy";
    return "Respaldo";
  }

  if (flag === "estimate") return "Estimate";
  if (flag === "projection") return "Projection";
  if (flag === "proxy") return "Proxy";
  return "Fallback";
}

function flagClass(flag: DataQualityFlag) {
  if (flag === "projection") return "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-300";
  if (flag === "estimate") return "border-cyan-400/30 bg-cyan-500/10 text-cyan-300";
  if (flag === "proxy") return "border-amber-400/30 bg-amber-500/10 text-amber-300";
  return "border-zinc-400/30 bg-zinc-500/10 text-zinc-300";
}

export function DataQualityBadges({
  freshnessStatus,
  qualityFlags = [],
  className = "",
  locale = "en",
}: {
  freshnessStatus?: FreshnessStatus | null;
  qualityFlags?: DataQualityFlag[];
  className?: string;
  locale?: Locale;
}) {
  if (!freshnessStatus && qualityFlags.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {freshnessStatus ? (
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
            freshnessClass(freshnessStatus),
          )}
        >
          {freshnessLabel(freshnessStatus, locale)}
        </span>
      ) : null}
      {qualityFlags.map((flag) => (
        <span
          key={flag}
          className={cn(
            "rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
            flagClass(flag),
          )}
        >
          {flagLabel(flag, locale)}
        </span>
      ))}
    </div>
  );
}
