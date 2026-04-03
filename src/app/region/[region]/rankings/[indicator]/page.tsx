import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { RankingTable } from "@/components/ranking-table";
import { allIndicators } from "@/lib/indicators/registry";
import { getServerLocale } from "@/lib/i18n/server";
import { getRankingData } from "@/lib/repository/economy";
import { buildMetadata } from "@/lib/seo";
import { toKebabCase } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ region: string; indicator: string }>;
}) {
  const { region, indicator } = await params;
  return buildMetadata({
    title: `${indicator.replaceAll("-", " ")} rankings in ${region.replaceAll("-", " ")}`,
    description: `See the latest ${indicator.replaceAll("-", " ")} rankings for ${region.replaceAll("-", " ")} and compare historical trends.`,
    path: `/region/${region}/rankings/${indicator}`,
  });
}

export default async function RegionRankingPage({
  params,
}: {
  params: Promise<{ region: string; indicator: string }>;
}) {
  const locale = await getServerLocale();
  const isEs = locale === "es";
  const { region, indicator } = await params;
  const indicatorIdValue = allIndicators.find((item) => toKebabCase(item.id) === indicator)?.id;
  if (!indicatorIdValue) notFound();
  const indicatorId = indicatorIdValue;

  const rows = await getRankingData(indicatorId, region);
  const definition = allIndicators.find((item) => item.id === indicatorId)!;
  const regionLabel = region.replaceAll("-", " ");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: isEs ? "Inicio" : "Home", href: "/" },
          { label: isEs ? "Regiones" : "Regions" },
          { label: regionLabel, href: `/region/${region}` },
          { label: definition.shortLabel },
        ]}
      />
      <div className="mb-8 max-w-3xl">
        <h1 className="font-display text-4xl font-semibold">
          {definition.shortLabel} {isEs ? "en" : "in"} {regionLabel}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {isEs
            ? `Mira el ranking mas reciente de ${definition.shortLabel.toLowerCase()} para ${regionLabel} y compara tendencias historicas.`
            : `See the latest ${definition.shortLabel.toLowerCase()} rankings for ${regionLabel} and compare historical trends.`}
        </p>
      </div>
      <RankingTable rows={rows} heading={definition.shortLabel} />
    </div>
  );
}
