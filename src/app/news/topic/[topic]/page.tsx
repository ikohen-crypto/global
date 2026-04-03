import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { NewsSection } from "@/components/news-section";
import { allNewsTopics, newsTopicDefinitions } from "@/lib/news/topics";
import { getNewsByTopic, getTopicDescription, getTopicLabel } from "@/lib/news/rss";
import { getServerLocale } from "@/lib/i18n/server";
import { buildMetadata } from "@/lib/seo";
import type { NewsTopic } from "@/lib/types";

function isNewsTopic(value: string): value is NewsTopic {
  return value in newsTopicDefinitions;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  const title = isNewsTopic(topic) ? newsTopicDefinitions[topic].labels.en : "Macro news";

  return buildMetadata({
    title: `${title} news`,
    description: `Track ${title.toLowerCase()} headlines and related market context.`,
    path: `/news/topic/${topic}`,
  });
}

export const revalidate = 1200;

export async function generateStaticParams() {
  return allNewsTopics.map((topic) => ({ topic }));
}

export default async function NewsTopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const locale = await getServerLocale();
  const { topic } = await params;
  if (!isNewsTopic(topic)) {
    notFound();
  }

  const label = getTopicLabel(topic, locale);
  const description = getTopicDescription(topic, locale);
  const items = await getNewsByTopic(topic);
  const copy = locale === "es"
    ? { home: "Inicio", news: "Noticias", empty: "No hay noticias para este tema todavia." }
    : { home: "Home", news: "News", empty: "No news items matched this topic yet." };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: copy.home, href: "/" },
          { label: copy.news, href: "/news" },
          { label },
        ]}
      />
      <div className="mb-8 max-w-4xl">
        <h1 className="font-display text-4xl font-semibold">{label}</h1>
        <p className="mt-3 text-muted-foreground">{description}</p>
      </div>

      {items.length > 0 ? (
        <NewsSection title={label} description={description} items={items} locale={locale} showHeader={false} />
      ) : (
        <div className="rounded-[1.75rem] border border-dashed border-border bg-card/60 p-6 text-sm text-muted-foreground">
          {copy.empty}
        </div>
      )}
    </div>
  );
}
