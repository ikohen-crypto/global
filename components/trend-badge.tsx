import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

export function TrendBadge({
  value,
  label,
}: {
  value: number | null;
  label?: string;
}) {
  const positive = value != null && value > 0;
  const negative = value != null && value < 0;
  const Icon = positive ? ArrowUpRight : negative ? ArrowDownRight : Minus;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
        positive && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
        negative && "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
        !positive &&
          !negative &&
          "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label ?? (value == null ? "No trend" : `${value.toFixed(1)}%`)}
    </div>
  );
}
