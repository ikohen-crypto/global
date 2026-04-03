import type { ReactNode } from "react";

import { Badge } from "@/components/ui/Badge";

export function StateMessage({
  title,
  description,
  action,
  tone = "neutral",
  tag
}: {
  title: string;
  description: string;
  action?: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info" | "accent";
  tag?: string;
}) {
  return (
    <div className="card-surface p-6 text-center">
      {tag ? <Badge tone={tone}>{tag}</Badge> : null}
      <h3 className="mt-4 font-display text-2xl font-bold text-pine dark:text-stone-100">{title}</h3>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-stone-300">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
