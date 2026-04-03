import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { CountryFinancialSignals } from "@/components/financial-signals";
import { FAQSection } from "@/components/faq-section";
import { FavoritesToggle } from "@/components/favorites-toggle";
import { CountryActionPanels } from "@/components/market-intelligence-panels";
import { MetricCard } from "@/components/metric-card";
import { NewsSection } from "@/components/news-section";
import { RecentCountryTracker } from "@/components/recent-country-tracker";
import { TrendBadge } from "@/components/trend-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getIndicatorFaqs } from "@/lib/content/explainers";
import { getServerLocale } from "@/lib/i18n/server";
import { getNewsByCountrySlug } from "@/lib/news/rss";
import { getCountryProfile } from "@/lib/repository/economy";
import {
  buildBreadcrumbJsonLd,
  buildDatasetJsonLd,
  buildFaqJsonLd,
  buildMetadata,
} from "@/lib/seo";
import { toKebabCase } from "@/lib/utils";

type Locale = "en" | "es";

const pageCopy = {
  en: {
    home: "Home",
    countries: "Countries",
    capital: "Capital",
    population: "Population",
    heroBody:
      "Practical read for investors and analysts: growth, price stability, financing cost, and debt pressure, with the latest available source called out on each metric.",
    quickFacts: "Quick facts",
    quickFactsBody:
      "Context that helps interpret the macro data as a market, cost, and risk screen.",
    currencies: "Currencies",
    languages: "Languages",
    comparePeer: "Compare with a peer country",
    overview: "Overview",
    economy: "Economy",
    development: "Population & development",
    environment: "Environment",
    whyMatters: "Why this country matters for markets",
    overviewBody:
      "This market can be compared against regional peers to understand growth, inflation, financing pressure, and debt tradeoffs more clearly.",
    latestGdpPrefix: "Latest available GDP is",
    latestGdpJoin: "while GDP per capita is",
    latestPeriod: "Latest period",
    notReported: "Not reported",
    regionPeers: "Region peers",
    interpretation: "Interpretation",
    interpretationBody:
      "Compare CO2 emissions per capita with GDP per capita to get a rough sustainability lens on development. This is most useful when paired with total emissions and energy mix data.",
    compareWith: "Compare with",
    relatedPages: "Related pages",
    regionalDashboard: "regional dashboard",
    gdpRankings: "GDP rankings",
    practicalInsights: "Practical macro insights",
    relatedNews: "Related macro news",
    relatedNewsBody: "Recent headlines that may affect the country risk, rates, inflation, currency, or funding backdrop.",
    faqTitle: "FAQs",
    faqDescription: "Practical answers to the most common questions about this data.",
    interestFallback:
      "Used as a fallback when OECD short-term market rates are unavailable for this country.",
    debtMissing:
      "This external-debt series is not currently reported for this country.",
    debtMissingBySource:
      "does not currently report this external-debt series for this country.",
  },
  es: {
    home: "Inicio",
    countries: "Paises",
    capital: "Capital",
    population: "Poblacion",
    heroBody:
      "Lectura practica para inversores y analistas: crecimiento, estabilidad de precios, costo de financiamiento y presion de deuda, con la fuente mas reciente indicada en cada metrica.",
    quickFacts: "Datos rapidos",
    quickFactsBody:
      "Contexto que ayuda a interpretar los datos macro como filtro de mercado, costos y riesgo.",
    currencies: "Monedas",
    languages: "Idiomas",
    comparePeer: "Comparar con un pais par",
    overview: "Resumen",
    economy: "Economia",
    development: "Poblacion y desarrollo",
    environment: "Ambiente",
    whyMatters: "Por que este pais importa para mercados",
    overviewBody:
      "Este mercado puede compararse con pares regionales para entender mejor crecimiento, inflacion, presion financiera y tradeoffs de deuda.",
    latestGdpPrefix: "El PIB mas reciente disponible es",
    latestGdpJoin: "mientras que el PIB per capita es",
    latestPeriod: "Ultimo periodo",
    notReported: "No reportado",
    regionPeers: "Pares regionales",
    interpretation: "Interpretacion",
    interpretationBody:
      "Compara las emisiones de CO2 per capita con el PIB per capita para obtener una lectura aproximada de sostenibilidad del desarrollo. Es mas util cuando se combina con emisiones totales y datos de matriz energetica.",
    compareWith: "Comparar con",
    relatedPages: "Paginas relacionadas",
    regionalDashboard: "dashboard regional",
    gdpRankings: "Rankings de PIB",
    practicalInsights: "Insights macro practicos",
    relatedNews: "Noticias macro relacionadas",
    relatedNewsBody: "Titulares recientes que pueden afectar el riesgo pais, tasas, inflacion, moneda o el costo financiero.",
    faqTitle: "Preguntas frecuentes",
    faqDescription: "Respuestas practicas a las preguntas mas comunes sobre estos datos.",
    interestFallback:
      "Se usa como respaldo cuando no hay tasas de mercado de corto plazo de OECD para este pais.",
    debtMissing:
      "Esta serie de deuda externa no se reporta actualmente para este pais.",
    debtMissingBySource:
      "no reporta actualmente esta serie de deuda externa para este pais.",
  },
} as const;

const metricLabels = {
  en: {
    inflation: "Inflation",
    unemployment: "Unemployment",
    gdpGrowth: "GDP growth",
    interestRate: "Short-term rate",
    gdp: "GDP",
    gdpPerCapita: "GDP per capita",
    externalDebt: "External debt",
    population: "Population",
    lifeExpectancy: "Life expectancy",
    co2PerCapita: "CO2 per capita",
  },
  es: {
    inflation: "Inflacion",
    unemployment: "Desempleo",
    gdpGrowth: "Crecimiento del PIB",
    interestRate: "Tasa de corto plazo",
    gdp: "PIB",
    gdpPerCapita: "PIB per capita",
    externalDebt: "Deuda externa",
    population: "Poblacion",
    lifeExpectancy: "Esperanza de vida",
    co2PerCapita: "CO2 per capita",
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return buildMetadata({
    title: `${slug.replaceAll("-", " ")} macro risk, financing, and market data`,
    description: `Explore ${slug.replaceAll("-", " ")} through a finance-first lens: growth, inflation, funding cost, debt pressure, and market scale.`,
    path: `/country/${slug}`,
  });
}

function metricCaption(
  label: string | null,
  year: number | null,
  sourceName: string | null,
  locale: Locale,
) {
  const t = pageCopy[locale];
  const resolvedPeriod = label ?? (year != null ? String(year) : "N/A");
  return `${t.latestPeriod}: ${resolvedPeriod}${sourceName ? ` - ${sourceName}` : ""}`;
}

function debtMetricCaption(
  label: string | null,
  year: number | null,
  sourceName: string | null,
  locale: Locale,
) {
  const t = pageCopy[locale];
  if (label == null && year == null) {
    return sourceName ? `${sourceName} ${t.debtMissingBySource}` : t.debtMissing;
  }

  return metricCaption(label, year, sourceName, locale);
}

function interestMetricCaption(
  label: string | null,
  year: number | null,
  sourceName: string | null,
  labelText: string,
  locale: Locale,
) {
  const base = metricCaption(label, year, sourceName, locale);
  if (labelText === "Interest-rate proxy") {
    return `${base}. ${pageCopy[locale].interestFallback}`;
  }

  return base;
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const locale = await getServerLocale();
  const { slug } = await params;
  const profileData = await getCountryProfile(slug);

  if (!profileData) {
    notFound();
  }

  const t = pageCopy[locale];
  const labels = metricLabels[locale];
  const profile = profileData;
  const newsItems = await getNewsByCountrySlug(slug);
  const faqs = getIndicatorFaqs("gdp");
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: t.home, path: "/" },
    { name: t.countries, path: "/countries" },
    { name: profile.country.name, path: `/country/${slug}` },
  ]);
  const datasetJsonLd = buildDatasetJsonLd({
    name: `${profile.country.name} economy data`,
    description: `See GDP, inflation, unemployment, growth, and population data for ${profile.country.name}.`,
    path: `/country/${slug}`,
  });
  const faqJsonLd = buildFaqJsonLd(faqs);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <RecentCountryTracker slug={slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <Breadcrumbs
        items={[
          { label: t.home, href: "/" },
          { label: t.countries, href: "/countries" },
          { label: profile.country.name },
        ]}
      />

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <Image
                src={profile.country.flagUrl}
                alt={`${profile.country.name} flag`}
                width={72}
                height={48}
                className="rounded-lg border border-border"
              />
              <div>
                <h1 className="font-display text-4xl font-semibold">{profile.country.name}</h1>
                <p className="mt-2 text-muted-foreground">
                  {profile.country.region} - {profile.country.subregion}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span>{t.capital}: {profile.country.capital}</span>
                  <span>{t.population}: {profile.metrics.population.formattedValue}</span>
                </div>
                <p className="mt-4 max-w-2xl text-sm text-muted-foreground">{t.heroBody}</p>
              </div>
            </div>
            <FavoritesToggle type="country" id={profile.country.iso3} />
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {(["inflation", "unemployment", "gdpGrowth", "interestRate"] as const).map((metricId) => (
              <MetricCard
                key={metricId}
                label={labels[metricId]}
                value={profile.metrics[metricId].formattedValue}
                sourceProvider={profile.metrics[metricId].sourceProvider}
                freshnessStatus={profile.metrics[metricId].freshnessStatus}
                qualityFlags={profile.metrics[metricId].qualityFlags}
                locale={locale}
                caption={
                  metricId === "interestRate"
                    ? interestMetricCaption(
                        profile.metrics[metricId].latestLabel,
                        profile.metrics[metricId].latestYear,
                        profile.metrics[metricId].sourceName,
                        profile.metrics[metricId].label,
                        locale,
                      )
                    : metricCaption(
                        profile.metrics[metricId].latestLabel,
                        profile.metrics[metricId].latestYear,
                        profile.metrics[metricId].sourceName,
                        locale,
                      )
                }
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.quickFacts}</CardTitle>
            <CardDescription>{t.quickFactsBody}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>{t.currencies}: {profile.country.currencies.join(", ") || "N/A"}</div>
            <div>{t.languages}: {profile.country.languages.join(", ") || "N/A"}</div>
            <TrendBadge
              value={profile.metrics.gdpGrowth.value}
              label={`${labels.gdpGrowth} ${profile.metrics.gdpGrowth.formattedValue}`}
            />
            <Link
              href={`/compare/${profile.country.slug}-vs-${profile.compareSuggestions[0]?.slug ?? "united-states"}`}
              className="inline-flex text-primary"
            >
              {t.comparePeer}
            </Link>
          </CardContent>
        </Card>
      </section>

      <CountryFinancialSignals profile={profile} locale={locale} />
      <CountryActionPanels profile={profile} locale={locale} />

      <section className="mt-10">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">{t.overview}</TabsTrigger>
            <TabsTrigger value="economy">{t.economy}</TabsTrigger>
            <TabsTrigger value="development">{t.development}</TabsTrigger>
            <TabsTrigger value="environment">{t.environment}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{t.whyMatters}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>{t.overviewBody}</p>
                <p>
                  {t.latestGdpPrefix} {profile.metrics.gdp.formattedValue}{" "}
                  {profile.metrics.gdp.latestLabel ?? profile.metrics.gdp.latestYear ?? "N/A"}, {t.latestGdpJoin}{" "}
                  {profile.metrics.gdpPerCapita.formattedValue}.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t.regionPeers}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.regionPeers.map((peer) => (
                  <Link key={peer.iso3} href={`/country/${peer.slug}`} className="block text-sm text-primary">
                    {peer.name}
                  </Link>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="economy" className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(["gdp", "gdpPerCapita", "inflation", "unemployment", "gdpGrowth", "externalDebt"] as const).map(
              (metricId) => (
                <MetricCard
                  key={metricId}
                  label={labels[metricId]}
                  value={
                    metricId === "externalDebt" && profile.metrics[metricId].value == null
                      ? t.notReported
                      : profile.metrics[metricId].formattedValue
                  }
                  sourceProvider={profile.metrics[metricId].sourceProvider}
                  freshnessStatus={profile.metrics[metricId].freshnessStatus}
                  qualityFlags={profile.metrics[metricId].qualityFlags}
                  locale={locale}
                  caption={
                    metricId === "externalDebt"
                      ? debtMetricCaption(
                          profile.metrics[metricId].latestLabel,
                          profile.metrics[metricId].latestYear,
                          profile.metrics[metricId].sourceName,
                          locale,
                        )
                      : metricCaption(
                          profile.metrics[metricId].latestLabel,
                          profile.metrics[metricId].latestYear,
                          profile.metrics[metricId].sourceName,
                          locale,
                        )
                  }
                />
              ),
            )}
          </TabsContent>

          <TabsContent value="development" className="mt-6 grid gap-4 md:grid-cols-2">
            <MetricCard
              label={labels.population}
              value={profile.metrics.population.formattedValue}
              sourceProvider={profile.metrics.population.sourceProvider}
              freshnessStatus={profile.metrics.population.freshnessStatus}
              qualityFlags={profile.metrics.population.qualityFlags}
              locale={locale}
              caption={metricCaption(
                profile.metrics.population.latestLabel,
                profile.metrics.population.latestYear,
                profile.metrics.population.sourceName,
                locale,
              )}
            />
            <MetricCard
              label={labels.lifeExpectancy}
              value={profile.metrics.lifeExpectancy.formattedValue}
              sourceProvider={profile.metrics.lifeExpectancy.sourceProvider}
              freshnessStatus={profile.metrics.lifeExpectancy.freshnessStatus}
              qualityFlags={profile.metrics.lifeExpectancy.qualityFlags}
              locale={locale}
              caption={metricCaption(
                profile.metrics.lifeExpectancy.latestLabel,
                profile.metrics.lifeExpectancy.latestYear,
                profile.metrics.lifeExpectancy.sourceName,
                locale,
              )}
            />
          </TabsContent>

          <TabsContent value="environment" className="mt-6 grid gap-4 md:grid-cols-2">
            <MetricCard
              label={labels.co2PerCapita}
              value={profile.metrics.co2PerCapita.formattedValue}
              sourceProvider={profile.metrics.co2PerCapita.sourceProvider}
              freshnessStatus={profile.metrics.co2PerCapita.freshnessStatus}
              qualityFlags={profile.metrics.co2PerCapita.qualityFlags}
              locale={locale}
              caption={metricCaption(
                profile.metrics.co2PerCapita.latestLabel,
                profile.metrics.co2PerCapita.latestYear,
                profile.metrics.co2PerCapita.sourceName,
                locale,
              )}
            />
            <Card>
              <CardHeader>
                <CardTitle>{t.interpretation}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{t.interpretationBody}</CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      <section className="mt-10 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.compareWith}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.compareSuggestions.map((suggestion) => (
              <Link
                key={suggestion.iso3}
                href={`/compare/${profile.country.slug}-vs-${suggestion.slug}`}
                className="block rounded-2xl border border-border px-4 py-3 text-sm transition hover:border-primary/40"
              >
                {profile.country.name} vs {suggestion.name}
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.relatedPages}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Link href={`/region/${toKebabCase(profile.country.region)}`} className="block text-primary">
              {profile.country.region} {t.regionalDashboard}
            </Link>
            <Link href="/rankings/gdp" className="block text-primary">
              {t.gdpRankings}
            </Link>
            <Link href="/learn" className="block text-primary">
              {t.practicalInsights}
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="mt-10">
        <NewsSection
          title={t.relatedNews}
          description={t.relatedNewsBody}
          items={newsItems.slice(0, 4)}
          locale={locale}
        />
      </section>

      <section className="mt-10">
        <FAQSection items={faqs} title={t.faqTitle} description={t.faqDescription} />
      </section>
    </div>
  );
}
