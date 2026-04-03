import { Panel } from "@/components/ui/Panel";
import type { TrendPoint } from "@/types/opportunity";

function buildPolyline(series: TrendPoint[], width: number, height: number) {
  if (series.length === 0) {
    return "";
  }

  const stepX = width / Math.max(series.length - 1, 1);
  return series
    .map((point, index) => {
      const x = index * stepX;
      const y = height - (point.value / 100) * height;
      return `${x},${y}`;
    })
    .join(" ");
}

function summarizeSeries(series: TrendPoint[]) {
  if (series.length === 0) {
    return { latest: 0, peak: 0, average: 0, delta: 0 };
  }

  const values = series.map((point) => point.value);
  const latest = values[values.length - 1] ?? 0;
  const previous = values[values.length - 2] ?? latest;
  const peak = Math.max(...values);
  const average = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  const delta = latest - previous;

  return { latest, peak, average, delta };
}

export function TrendChart({
  series,
  summary
}: {
  series: TrendPoint[];
  summary: string;
}) {
  const width = 560;
  const height = 220;
  const polyline = buildPolyline(series, width, height);
  const areaPoints = `${polyline} ${width},${height} 0,${height}`;
  const { latest, peak, average, delta } = summarizeSeries(series);

  return (
    <Panel
      title="Linea de tendencia"
      subtitle="Movimiento del keyword en Google Trends, con fallback determinista cuando no hay acceso."
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="soft-card p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-stone-500">Ultimo</p>
            <p className="mt-2 font-display text-2xl font-bold text-pine dark:text-stone-100">{latest}/100</p>
          </div>
          <div className="soft-card p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-stone-500">Pico</p>
            <p className="mt-2 font-display text-2xl font-bold text-pine dark:text-stone-100">{peak}/100</p>
          </div>
          <div className="soft-card p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-stone-500">Promedio</p>
            <p className="mt-2 font-display text-2xl font-bold text-pine dark:text-stone-100">{average}/100</p>
          </div>
          <div className="soft-card p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-stone-500">Variacion</p>
            <p
              className={`mt-2 font-display text-2xl font-bold ${
                delta >= 0 ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300"
              }`}
            >
              {delta >= 0 ? "+" : ""}
              {delta}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] dark:border-stone-800 dark:bg-stone-950/60">
          <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full">
            <defs>
              <linearGradient id="trendStroke" x1="0%" x2="100%" y1="0%" y2="0%">
                <stop offset="0%" stopColor="#17352d" />
                <stop offset="55%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#ee7b5a" />
              </linearGradient>
              <linearGradient id="trendFill" x1="0%" x2="0%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(23, 53, 45, 0.28)" />
                <stop offset="100%" stopColor="rgba(23, 53, 45, 0.02)" />
              </linearGradient>
            </defs>
            {[0, 25, 50, 75, 100].map((line) => (
              <line
                key={line}
                x1="0"
                x2={width}
                y1={height - (line / 100) * height}
                y2={height - (line / 100) * height}
                stroke="rgba(148, 163, 184, 0.2)"
                strokeDasharray="4 6"
              />
            ))}
            {series.length > 0 ? (
              <>
                <polygon points={areaPoints} fill="url(#trendFill)" />
                <polyline
                  points={polyline}
                  fill="none"
                  stroke="url(#trendStroke)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            ) : null}
          </svg>
        </div>

        <p className="text-sm leading-6 text-slate-600 dark:text-stone-300">{summary}</p>
      </div>
    </Panel>
  );
}
