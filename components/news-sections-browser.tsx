"use client";

import { useMemo, useState } from "react";

import { NewsSection } from "@/components/news-section";
import type { Locale } from "@/lib/i18n";
import type { NewsItem } from "@/lib/types";

type BrowserSection = {
  id: string;
  title: string;
  description: string;
  items: NewsItem[];
};

export function NewsSectionsBrowser({
  sections,
  locale,
}: {
  sections: BrowserSection[];
  locale: Locale;
}) {
  const featuredSectionIds = ["latest", "top", "central-banks", "inflation", "forex", "crypto"];
  const visibleSections = sections.filter((section) => featuredSectionIds.includes(section.id));
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id ?? "");

  const activeSection = useMemo(
    () => visibleSections.find((section) => section.id === activeSectionId) ?? visibleSections[0] ?? null,
    [activeSectionId, visibleSections],
  );

  if (!activeSection) return null;

  return (
    <section className="space-y-4">
      <div className="sticky top-20 z-10 -mx-1 overflow-x-auto rounded-2xl border border-border/60 bg-background/90 px-1 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="flex min-w-max gap-2">
        {visibleSections.map((section) => {
          const active = section.id === activeSection.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSectionId(section.id)}
              className={`rounded-full border px-3 py-1 text-xs sm:text-sm transition whitespace-nowrap ${
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {section.title}
            </button>
          );
        })}
        </div>
      </div>

      <NewsSection
        title={activeSection.title}
        description={activeSection.description}
        items={activeSection.items}
        locale={locale}
      />
    </section>
  );
}
