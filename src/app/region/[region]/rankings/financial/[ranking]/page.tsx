import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { FinancialRankingTable } from "@/components/financial-ranking-table";
import { financialRankingDefinitions } from "@/lib/financial-rankings";
import { getServerLocale } from "@/lib/i18n/server";
import { getFinancialRankingData } from "@/lib/repository/economy";
import { buildMetadata } from "@/lib/seo";
import type { FinancialRankingId } from "@/lib/types";

function isFinancialRankingId(value: string): value is FinancialRankingId {
  return value in financialRankingDefinitions;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ region: string; ranking: string }>;
}) {
  const { region, ranking } = await params;
  const definition = isFinancialRankingId(ranking) ? financialRankingDefinitions[ranking] : null;

  return buildMetadata({
    title: definition
      ? `${definition.title} in ${region.replaceAll("-", " ")}`
      : `Financial rankings in ${region.replaceAll("-", " ")}`,
    description: definition
      ? `${definition.description} Filtered for ${region.replaceAll("-", " ")}.`
      : `Financial rankings for ${region.replaceAll("-", " ")}.`,
    path: `/region/${region}/rankings/financial/${ranking}`,
  });
}

export default async function RegionFinancialRankingsPage({
  params,
}: {
  params: Promise<{ region: string; ranking: string }>;
}) {
  const locale = await getServerLocale();
  const isEs = locale === "es";
  const { region, ranking } = await params;
  if (!isFinancialRankingId(ranking)) {
    notFound();
  }

  const definition = financialRankingDefinitions[ranking];
  const rows = await getFinancialRankingData(ranking, region);
  const regionLabel = region.replaceAll("-", " ");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: isEs ? "Inicio" : "Home", href: "/" },
          { label: isEs ? "Regiones" : "Regions", href: "/regions" },
          { label: regionLabel, href: `/region/${region}` },
          { label: isEs ? "Rankings financieros" : "Financial rankings" },
          { label: definition.title },
        ]}
      />
      <div className="mb-8 max-w-3xl">
        <h1 className="font-display text-4xl font-semibold">
          {definition.title} {isEs ? "en" : "in"} {regionLabel}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {definition.description} {isEs ? `Filtrado para ${regionLabel}.` : `Filtered for ${regionLabel}.`}
        </p>
      </div>
      <FinancialRankingTable rows={rows} heading={isEs ? "Puntaje" : "Score"} />
    </div>
  );
}
