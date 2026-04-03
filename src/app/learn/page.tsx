import Link from "next/link";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { allIndicators } from "@/lib/indicators/registry";
import { getServerLocale, getServerMessages } from "@/lib/i18n/server";
import { buildMetadata } from "@/lib/seo";
import { toKebabCase } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Insights for macro and market comparison",
  description:
    "Use practical explainers to interpret GDP, inflation, growth, debt, population, and sustainability metrics in market context.",
  path: "/learn",
});

const learnCopy = {
  en: {
    cards: {
      gdp: {
        title: "GDP",
        body: "Track total economic output to compare market size, corporate demand, and macro scale.",
      },
      gdpPerCapita: {
        title: "GDP per capita",
        body: "Use output per person to compare purchasing power, average income potential, and market quality.",
      },
      inflation: {
        title: "Inflation",
        body: "Read inflation as a signal for pricing pressure, policy risk, margin visibility, and real returns.",
      },
      unemployment: {
        title: "Unemployment",
        body: "Watch labor slack to understand demand resilience, hiring conditions, and social pressure.",
      },
      population: {
        title: "Population",
        body: "Population shapes addressable market size, labor supply, and long-run demand potential.",
      },
      gdpGrowth: {
        title: "GDP growth",
        body: "Growth helps you compare cyclical momentum, expansion potential, and macro acceleration or slowdown.",
      },
      interestRate: {
        title: "Short-term rate",
        body: "Short rates are a practical read on funding conditions, credit pressure, and monetary stance.",
      },
      externalDebt: {
        title: "External debt",
        body: "Debt metrics help frame vulnerability, refinancing pressure, and cross-country balance-sheet risk.",
      },
      co2PerCapita: {
        title: "CO2 per capita",
        body: "Use emissions intensity as a rough sustainability lens when comparing development and energy profile.",
      },
      lifeExpectancy: {
        title: "Life expectancy",
        body: "A broad wellbeing proxy that helps contextualize development, health systems, and human capital.",
      },
    },
  },
  es: {
    cards: {
      gdp: {
        title: "PIB",
        body: "Segui la produccion economica total para comparar tamano de mercado, demanda corporativa y escala macro.",
      },
      gdpPerCapita: {
        title: "PIB per capita",
        body: "Usa el producto por persona para comparar poder adquisitivo, ingreso promedio potencial y calidad de mercado.",
      },
      inflation: {
        title: "Inflacion",
        body: "Lee la inflacion como senal de presion de precios, riesgo de politica, visibilidad de margenes y retornos reales.",
      },
      unemployment: {
        title: "Desempleo",
        body: "Mira la holgura laboral para entender resiliencia de demanda, condiciones de contratacion y presion social.",
      },
      population: {
        title: "Poblacion",
        body: "La poblacion define el tamano de mercado direccionable, la oferta laboral y el potencial de demanda de largo plazo.",
      },
      gdpGrowth: {
        title: "Crecimiento del PIB",
        body: "El crecimiento ayuda a comparar impulso ciclico, potencial de expansion y aceleracion o desaceleracion macro.",
      },
      interestRate: {
        title: "Tasa de corto plazo",
        body: "Las tasas cortas son una lectura practica de condiciones de fondeo, presion crediticia y postura monetaria.",
      },
      externalDebt: {
        title: "Deuda externa",
        body: "Las metricas de deuda ayudan a encuadrar vulnerabilidad, presion de refinanciacion y riesgo de balance entre paises.",
      },
      co2PerCapita: {
        title: "CO2 per capita",
        body: "Usa la intensidad de emisiones como lente aproximada de sostenibilidad al comparar desarrollo y perfil energetico.",
      },
      lifeExpectancy: {
        title: "Esperanza de vida",
        body: "Un proxy amplio de bienestar que ayuda a contextualizar desarrollo, sistema de salud y capital humano.",
      },
    },
  },
} as const;

export default async function LearnPage() {
  const locale = await getServerLocale();
  const t = await getServerMessages(locale);
  const cards = learnCopy[locale].cards;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: t.common.home, href: "/" }, { label: t.common.insights }]} />
      <div className="mb-8 max-w-3xl">
        <h1 className="font-display text-4xl font-semibold">{t.learnPage.title}</h1>
        <p className="mt-3 text-muted-foreground">{t.learnPage.body}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {allIndicators.map((indicator) => {
          const translated = cards[indicator.id];
          return (
            <Link key={indicator.id} href={`/indicator/${toKebabCase(indicator.id)}`}>
              <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-panel">
                <CardHeader>
                  <CardTitle>{translated.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{translated.body}</CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
