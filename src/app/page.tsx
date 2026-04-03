import Link from "next/link";
import { Globe2, GraduationCap, LineChart, Search, Sparkles } from "lucide-react";

import { AdSlot } from "@/components/ad-slot";
import { CompareBuilder } from "@/components/compare-builder";
import { CountryCard } from "@/components/country-card";
import { DataSourceBadge } from "@/components/data-source-badge";
import { NewsSection } from "@/components/news-section";
import { WorldMap } from "@/components/world-map";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { homeExplainers } from "@/lib/content/explainers";
import { getServerLocale, getServerMessages } from "@/lib/i18n/server";
import { getNewsSections } from "@/lib/news/rss";
import { getHomePageData } from "@/lib/repository/economy";

export default async function HomePage() {
  const [t, locale, data, newsSections] = await Promise.all([
    getServerMessages(),
    getServerLocale(),
    getHomePageData(),
    getNewsSections(),
  ]);
  const featuredCountries = data.featuredCountries.filter(
    (country): country is NonNullable<(typeof data.featuredCountries)[number]> => Boolean(country),
  );
  const topMacroStories = newsSections.find((section) => section.id === "top") ?? null;
  const featureCards = [
    {
      icon: Search,
      title: t.home.features.fastTitle,
      description: t.home.features.fastBody,
    },
    {
      icon: LineChart,
      title: t.home.features.compareTitle,
      description: t.home.features.compareBody,
    },
    {
      icon: GraduationCap,
      title: t.home.features.contextTitle,
      description: t.home.features.contextBody,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-2 text-sm text-muted-foreground">
            <Globe2 className="h-4 w-4 text-primary" />
            {t.home.badge}
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl font-display text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
              {t.home.title}
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">{t.home.body}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href="/compare">{t.home.ctaPrimary}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/rankings/financial/macro-stability">{t.home.ctaSecondary}</Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <DataSourceBadge source="World Bank indicators" />
            <DataSourceBadge source="OECD prices" />
            <DataSourceBadge source="REST Countries metadata" />
            <DataSourceBadge source="UN population dataset" />
          </div>
        </div>
        <CompareBuilder countries={data.countries} />
      </section>

      <section className="mt-14 grid gap-4 md:grid-cols-3">
        {featureCards.map((card) => (
          <Card key={card.title}>
            <CardHeader>
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <card.icon className="h-5 w-5" />
              </div>
              <CardTitle>{card.title}</CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="mt-14 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>{t.home.mapTitle}</CardTitle>
            <CardDescription>{t.home.mapBody}</CardDescription>
          </CardHeader>
          <CardContent>
            <WorldMap countries={featuredCountries} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t.home.matchupsTitle}</CardTitle>
            <CardDescription>{t.home.matchupsBody}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.popularComparisons.map(([left, right]) => (
              <Link
                key={`${left}-${right}`}
                href={`/compare/${left}-vs-${right}`}
                className="flex items-center justify-between rounded-2xl border border-border px-4 py-4 transition hover:border-primary/40"
              >
                <span className="font-medium">
                  {left.replaceAll("-", " ")} vs {right.replaceAll("-", " ")}
                </span>
                <Sparkles className="h-4 w-4 text-primary" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            href: "/rankings/financial/macro-stability",
            title: t.home.financialRankings.macroStability,
            description: t.home.financialRankings.macroStabilityBody,
          },
          {
            href: "/rankings/financial/growth-vs-inflation",
            title: t.home.financialRankings.growthInflation,
            description: t.home.financialRankings.growthInflationBody,
          },
          {
            href: "/rankings/financial/debt-pressure",
            title: t.home.financialRankings.debtPressure,
            description: t.home.financialRankings.debtPressureBody,
          },
          {
            href: "/rankings/financial/funding-cost",
            title: t.home.financialRankings.fundingCost,
            description: t.home.financialRankings.fundingCostBody,
          },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-panel">
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </section>

      {topMacroStories ? (
        <section className="mt-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-semibold">
                {locale === "es" ? "Historias macro destacadas" : "Top macro stories"}
              </h2>
              <p className="text-muted-foreground">
                {locale === "es"
                  ? "Las noticias macro mas relevantes para seguir tasas, inflacion, deuda, FX y crecimiento desde la portada."
                  : "The most relevant macro headlines to track rates, inflation, debt, FX, and growth right from the home page."}
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/news">{locale === "es" ? "Ver todas las noticias" : "View all news"}</Link>
            </Button>
          </div>
          <NewsSection
            title={topMacroStories.title[locale]}
            description={topMacroStories.description[locale]}
            items={topMacroStories.items.slice(0, 4)}
            locale={locale}
          />
        </section>
      ) : null}

      <section className="mt-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-semibold">{t.home.featuredTitle}</h2>
            <p className="text-muted-foreground">{t.home.featuredBody}</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/countries">{t.home.browseCountries}</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featuredCountries.map((country) => (
            <CountryCard
              key={country.iso3}
              country={country}
              labels={{
                capital: t.countriesPage.capital,
                population: t.countriesPage.population,
                populationUnavailable: t.countriesPage.populationUnavailable,
              }}
            />
          ))}
        </div>
      </section>

      <section className="mt-14 grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="grid gap-4 md:grid-cols-3">
          {homeExplainers.map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{item.body}</CardContent>
            </Card>
          ))}
        </div>
        <AdSlot slot="home-inline" />
      </section>

      <section className="mt-14 rounded-[2rem] border border-border bg-card p-8">
        <h2 className="font-display text-3xl font-semibold">{t.home.finalTitle}</h2>
        <p className="mt-4 max-w-3xl text-muted-foreground">{t.home.finalBody}</p>
      </section>
    </div>
  );
}
