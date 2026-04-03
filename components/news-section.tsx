import { NewsCard } from "@/components/news-card";
import type { Locale } from "@/lib/i18n";
import type { NewsItem } from "@/lib/types";

export function NewsSection({
  title,
  description,
  items,
  locale,
  showHeader = true,
}: {
  title: string;
  description: string;
  items: NewsItem[];
  locale: Locale;
  showHeader?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-4">
      {showHeader ? (
        <div>
          <h2 className="font-display text-2xl font-semibold">{title}</h2>
          <p className="mt-2 text-muted-foreground">{description}</p>
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <NewsCard key={item.id} item={item} locale={locale} />
        ))}
      </div>
    </section>
  );
}
