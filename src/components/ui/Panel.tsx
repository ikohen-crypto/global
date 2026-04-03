import type { ReactNode } from "react";

export function Panel({
  title,
  subtitle,
  action,
  children,
  className = ""
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card-surface overflow-hidden ${className}`}>
      {(title || subtitle || action) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-stone-800">
          <div>
            {title ? <h2 className="font-display text-lg font-bold text-pine dark:text-stone-50">{title}</h2> : null}
            {subtitle ? <p className="mt-1 text-sm text-slate-500 dark:text-stone-400">{subtitle}</p> : null}
          </div>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
