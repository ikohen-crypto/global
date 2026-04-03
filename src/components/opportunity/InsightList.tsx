import { Panel } from "@/components/ui/Panel";

export function InsightList({
  title,
  subtitle,
  items
}: {
  title: string;
  subtitle: string;
  items: string[];
}) {
  return (
    <Panel title={title} subtitle={subtitle} className="h-full">
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item} className="soft-card p-4 text-sm leading-6 text-slate-600 dark:text-stone-300">
            {item}
          </div>
        ))}
      </div>
    </Panel>
  );
}
