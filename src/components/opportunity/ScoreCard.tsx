import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import type { ScoreCard as ScoreCardType } from "@/types/opportunity";

const toneMap = {
  trend: "info",
  saturation: "warning",
  opportunity: "success"
} as const;

const ringPalette = {
  trend: {
    accent: "#0ea5e9",
    muted: "rgba(14, 165, 233, 0.16)"
  },
  saturation: {
    accent: "#f59e0b",
    muted: "rgba(245, 158, 11, 0.16)"
  },
  opportunity: {
    accent: "#17352d",
    muted: "rgba(23, 53, 45, 0.16)"
  }
} as const;

export function ScoreCard({
  title,
  subtitle,
  score,
  kind
}: {
  title: string;
  subtitle: string;
  score: ScoreCardType;
  kind: keyof typeof toneMap;
}) {
  const palette = ringPalette[kind];

  return (
    <Panel title={title} subtitle={subtitle} className="h-full">
      <div className="grid gap-5 xl:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center gap-3">
          <div
            className="relative flex h-32 w-32 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(${palette.accent} ${score.value * 3.6}deg, ${palette.muted} 0deg)`
            }}
          >
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/96 text-center dark:bg-stone-950">
              <div>
                <p className="font-display text-3xl font-bold text-pine dark:text-stone-100">{score.value}</p>
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400 dark:text-stone-500">
                  /100
                </p>
              </div>
            </div>
          </div>
          <Badge tone={toneMap[kind]}>{score.label}</Badge>
        </div>

        <div className="space-y-4">
          <p className="text-sm leading-6 text-slate-600 dark:text-stone-300">{score.summary}</p>
          <div className="space-y-3">
            {score.breakdown.slice(0, 4).map((item) => {
              const barClass =
                item.impact === "positive"
                  ? "bg-emerald-500"
                  : item.impact === "negative"
                    ? "bg-rose-500"
                    : "bg-sky-500";

              return (
                <div key={item.key} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-700 dark:text-stone-200">{item.label}</p>
                    <p className="text-sm font-semibold text-pine dark:text-stone-100">{item.value}/100</p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-stone-800">
                    <div className={`h-full rounded-full ${barClass}`} style={{ width: `${item.value}%` }} />
                  </div>
                  <p className="text-xs leading-5 text-slate-500 dark:text-stone-400">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Panel>
  );
}
