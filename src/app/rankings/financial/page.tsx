import Link from "next/link";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { financialRankingDefinitions } from "@/lib/financial-rankings";
import { getServerLocale, getServerMessages } from "@/lib/i18n/server";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Financial rankings",
  description: "Browse composite macro-financial rankings built for allocation, expansion, and market-risk comparison.",
  path: "/rankings/financial",
});

const rankingCopy = {
  en: {
    "macro-stability": {
      title: "Macro stability rankings",
      description: "Countries with the cleanest mix of inflation, funding backdrop, and debt pressure.",
    },
    "growth-vs-inflation": {
      title: "Growth vs inflation rankings",
      description: "Countries balancing stronger growth momentum against lower inflation pressure.",
    },
    "debt-pressure": {
      title: "Debt pressure rankings",
      description: "Countries with the lightest debt burden relative to output or the cleanest debt proxy available.",
    },
    "funding-cost": {
      title: "Funding cost rankings",
      description: "Countries with the least restrictive financing backdrop based on short-term rates or clean fallbacks.",
    },
  },
  es: {
    "macro-stability": {
      title: "Rankings de estabilidad macro",
      description: "Paises con la combinacion mas limpia de inflacion, fondeo y presion de deuda.",
    },
    "growth-vs-inflation": {
      title: "Rankings de crecimiento vs inflacion",
      description: "Paises que equilibran un mejor impulso de crecimiento con menor presion inflacionaria.",
    },
    "debt-pressure": {
      title: "Rankings de presion de deuda",
      description: "Paises con la menor carga de deuda frente al producto o con el proxy de deuda mas limpio disponible.",
    },
    "funding-cost": {
      title: "Rankings de costo de fondeo",
      description: "Paises con un entorno de financiamiento menos restrictivo segun tasas cortas o fallbacks limpios.",
    },
  },
} as const;

export default async function FinancialRankingsIndexPage() {
  const locale = await getServerLocale();
  const t = await getServerMessages(locale);
  const copy = rankingCopy[locale];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 pb-20 sm:px-6 lg:px-8 lg:pb-24">
      <Breadcrumbs
        items={[
          { label: t.common.home, href: "/" },
          { label: t.common.rankings },
          { label: t.rankings.financialTitle },
        ]}
      />
      <div className="mb-8 max-w-3xl">
        <h1 className="font-display text-4xl font-semibold">{t.rankings.financialTitle}</h1>
        <p className="mt-3 text-muted-foreground">{t.rankings.financialBody}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Object.keys(financialRankingDefinitions).map((slug) => (
          <Link key={slug} href={`/rankings/financial/${slug}`} prefetch={false}>
            <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-panel">
              <CardHeader>
                <CardTitle>{copy[slug as keyof typeof copy].title}</CardTitle>
                <CardDescription>{copy[slug as keyof typeof copy].description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
