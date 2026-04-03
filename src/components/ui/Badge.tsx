import type { ReactNode } from "react";

export function Badge({
  tone = "neutral",
  children
}: {
  tone?: "neutral" | "success" | "warning" | "danger" | "info" | "accent";
  children: ReactNode;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-slate-100 text-slate-700 dark:bg-stone-800 dark:text-stone-200",
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300",
    danger: "bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300",
    info: "bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300",
    accent: "bg-orange-100 text-clay dark:bg-stone-800 dark:text-stone-200"
  };

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}
