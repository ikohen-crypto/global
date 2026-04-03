import { Suspense } from "react";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { FinancialRankingTable } from "@/components/financial-ranking-table";
import { RelatedRankingNews } from "./related-ranking-news";
import { financialRankingDefinitions } from "@/lib/financial-rankings";
import { getServerLocale } from "@/lib/i18n/server";
import { getFinancialRankingData } from "@/lib/repository/economy";
import { buildDatasetJsonLd, buildMetadata } from "@/lib/seo";
import type { FinancialRankingId } from "@/lib/types";

export const dynamic = "force-dynamic";

function isFinancialRankingId(value: string): value is FinancialRankingId {
  return value in financialRankingDefinitions;
}

const rankingCopy = {
  en: {
    "macro-stability": {
      title: "Macro stability rankings",
      description: "Countries with the cleanest mix of inflation, funding backdrop, and debt pressure.",
      section: "Financial",
    },
    "growth-vs-inflation": {
      title: "Growth vs inflation rankings",
      description: "Countries balancing stronger growth momentum against lower inflation pressure.",
      section: "Financial",
    },
    "debt-pressure": {
      title: "Debt pressure rankings",
      description: "Countries with the lightest debt burden relative to output or the cleanest debt proxy available.",
      section: "Financial",
    },
    "funding-cost": {
      title: "Funding cost rankings",
      description: "Countries with the least restrictive financing backdrop based on short-term rates or clean fallbacks.",
      section: "Financial",
    },
  },
  es: {
    "macro-stability": {
      title: "Rankings de estabilidad macro",
      description: "Paises con la combinacion mas limpia de inflacion, fondeo y presion de deuda.",
      section: "Financieros",
    },
    "growth-vs-inflation": {
      title: "Rankings de crecimiento vs inflacion",
      description: "Paises que equilibran un mejor impulso de crecimiento con menor presion inflacionaria.",
      section: "Financieros",
    },
    "debt-pressure": {
      title: "Rankings de presion de deuda",
      description: "Paises con la menor carga de deuda frente al producto o con el proxy de deuda mas limpio disponible.",
      section: "Financieros",
    },
    "funding-cost": {
      title: "Rankings de costo de fondeo",
      description: "Paises con un entorno de financiamiento menos restrictivo segun tasas cortas o fallbacks limpios.",
      section: "Financieros",
    },
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ranking: string }>;
}) {
  const { ranking } = await params;
  const definition = isFinancialRankingId(ranking) ? financialRankingDefinitions[ranking] : null;

  return buildMetadata({
    title: definition ? definition.title : "Financial rankings",
    description: definition ? definition.description : "Financial rankings for macro comparison.",
    path: `/rankings/financial/${ranking}`,
  });
}

export default async function FinancialRankingsPage({
  params,
}: {
  params: Promise<{ ranking: string }>;
}) {
  const locale = await getServerLocale();
  const isEs = locale === "es";
  const { ranking } = await params;
  if (!isFinancialRankingId(ranking)) {
    notFound();
  }

  const definition = financialRankingDefinitions[ranking];
  const copy = rankingCopy[locale][ranking];
  const rows = await getFinancialRankingData(ranking);
  const jsonLd = buildDatasetJsonLd({
    name: copy.title,
    description: copy.description,
    path: `/rankings/financial/${ranking}`,
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
          { label: isEs ? "Rankings" : "Rankings" },
          { label: copy.section },
          { label: copy.title },
        ]}
      />
      <div className="mb-8 max-w-3xl">
        <h1 className="font-display text-4xl font-semibold">{copy.title}</h1>
        <p className="mt-3 text-muted-foreground">{copy.description}</p>
      </div>
      <FinancialRankingTable rows={rows} heading={isEs ? "Puntaje" : "Score"} />
      <div className="mt-10">
        <Suspense fallback={null}>
          <RelatedRankingNews ranking={ranking} locale={locale} />
        </Suspense>
      </div>
    </div>
  );
}
