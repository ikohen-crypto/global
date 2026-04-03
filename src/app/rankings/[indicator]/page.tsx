import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { RankingTable } from "@/components/ranking-table";
import { allIndicators } from "@/lib/indicators/registry";
import { getServerLocale } from "@/lib/i18n/server";
import { getRankingData } from "@/lib/repository/economy";
import { buildDatasetJsonLd, buildMetadata } from "@/lib/seo";
import { toKebabCase } from "@/lib/utils";

function slugToIndicatorId(slug: string) {
  return allIndicators.find((indicator) => toKebabCase(indicator.id) === slug)?.id ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ indicator: string }>;
}) {
  const { indicator } = await params;
  return buildMetadata({
    title: `${indicator.replaceAll("-", " ")} rankings by country`,
    description: `See the latest ${indicator.replaceAll("-", " ")} rankings by country with historical trend context.`,
    path: `/rankings/${indicator}`,
  });
}

export default async function RankingsPage({
  params,
}: {
  params: Promise<{ indicator: string }>;
}) {
  const locale = await getServerLocale();
  const isEs = locale === "es";
  const { indicator } = await params;
  const indicatorIdValue = slugToIndicatorId(indicator);
  if (!indicatorIdValue) notFound();
  const indicatorId = indicatorIdValue;

  const rows = await getRankingData(indicatorId);
  const definition = allIndicators.find((item) => item.id === indicatorId)!;
  const jsonLd = buildDatasetJsonLd({
    name: `${definition.shortLabel} rankings`,
    description: definition.seoSummary,
    path: `/rankings/${indicator}`,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs
        items={[
          { label: isEs ? "Inicio" : "Home", href: "/" },
          { label: "Rankings" },
          { label: definition.shortLabel },
        ]}
      />
      <div className="mb-8 max-w-3xl">
        <h1 className="font-display text-4xl font-semibold">
          {definition.shortLabel} {isEs ? "ranking" : "rankings"}
        </h1>
        <p className="mt-3 text-muted-foreground">{definition.seoSummary}</p>
      </div>
      <RankingTable rows={rows} heading={definition.shortLabel} />
    </div>
  );
}
