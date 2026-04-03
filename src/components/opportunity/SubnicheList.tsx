import { Panel } from "@/components/ui/Panel";
import type { RecommendedSubniche } from "@/types/opportunity";

export function SubnicheList({ items }: { items: RecommendedSubniche[] }) {
  const sortedItems = [...items].sort((left, right) => right.score - left.score);

  return (
    <Panel
      title="Subnichos con mas movimiento"
      subtitle="Derivados de autocompletado, consultas relacionadas y reglas de especializacion comercial."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {sortedItems.map((item) => (
          <article
            key={item.label}
            className="soft-card border border-white/60 p-5 shadow-[0_14px_40px_rgba(23,33,43,0.05)] dark:border-stone-800/80"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-stone-500">
                  {item.angle}
                </p>
                <h3 className="mt-2 font-display text-xl font-bold text-pine dark:text-stone-100">
                  {item.label}
                </h3>
              </div>
              <div className="rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-pine shadow-sm dark:bg-stone-900 dark:text-stone-100">
                {item.score}/100
              </div>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-stone-300">{item.why}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {item.exampleKeywords.map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full border border-slate-200 bg-white/92 px-3 py-1 text-xs text-slate-600 dark:border-stone-700 dark:bg-stone-950/80 dark:text-stone-300"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}
