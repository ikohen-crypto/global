import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { CompareFinancialSignals } from "@/components/financial-signals";
import { ComparisonDashboard } from "@/components/comparison-dashboard";
import { FavoritesToggle } from "@/components/favorites-toggle";
import { CompareActionPanels } from "@/components/market-intelligence-panels";
import { NewsSection } from "@/components/news-section";
import { RecentComparisonTracker } from "@/components/recent-comparison-tracker";
import { parseCompareSlug } from "@/lib/compare/slugs";
import { getServerLocale } from "@/lib/i18n/server";
import { getNewsByCountryIso3List } from "@/lib/news/rss";
import { getCountryProfile } from "@/lib/repository/economy";
import { getComparisonData } from "@/lib/repository/economy";
import { buildDatasetJsonLd, buildMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ countries: string }>;
}) {
  const { countries } = await params;
  const labels = countries.split("-vs-").map((item) => item.replaceAll("-", " "));
  return buildMetadata({
    title: `${labels.join(" vs ")}: macro risk and financing comparison`,
    description: `Compare growth, inflation, financing cost, and debt pressure between ${labels.join(", ")} using official multi-source macro data.`,
    path: `/compare/${countries}`,
  });
}

export default async function CompareCountriesPage({
  params,
}: {
  params: Promise<{ countries: string }>;
}) {
  const locale = await getServerLocale();
  const isEs = locale === "es";
  const { countries } = await params;
  const parsed = parseCompareSlug(countries);

  if (!parsed.isValid) {
    notFound();
  }

  const comparison = await getComparisonData(parsed.countries);
  const profiles = (
    await Promise.all(parsed.countries.map(async (slug) => getCountryProfile(slug)))
  ).filter((profile): profile is NonNullable<typeof profile> => Boolean(profile));
  const newsItems = await getNewsByCountryIso3List(comparison.map((item) => item.country.iso3));

  if (comparison.length < 2) {
    notFound();
  }

  const pageTitle = comparison.map((item) => item.country.name).join(" vs ");
  const jsonLd = buildDatasetJsonLd({
    name: `${pageTitle} economy comparison`,
    description: `Compare growth, inflation, financing cost, and debt pressure across ${pageTitle}.`,
    path: `/compare/${countries}`,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <RecentComparisonTracker slug={countries} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs
        items={[
          { label: isEs ? "Inicio" : "Home", href: "/" },
          { label: isEs ? "Comparar" : "Compare", href: "/compare" },
          { label: pageTitle },
        ]}
      />
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold">{pageTitle}</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            {isEs
              ? "Compara paises con una lente financiera: crecimiento, inflacion, costo de fondeo y presion de deuda, con graficos limpios, tabla sincronizada y conclusiones deterministicas."
              : "Compare countries through a finance lens: growth, inflation, funding cost, and debt pressure, with clean charts, a synchronized table, and deterministic insight summaries."}
          </p>
        </div>
        <FavoritesToggle type="comparison" id={countries} />
      </div>
      <CompareFinancialSignals profiles={profiles} locale={locale} />
      <CompareActionPanels profiles={profiles} locale={locale} />
      <ComparisonDashboard countries={comparison} locale={locale} />
      <div className="mt-10">
        <NewsSection
          title={isEs ? "Noticias relacionadas con esta comparacion" : "News related to this comparison"}
          description={
            isEs
              ? "Titulares macro que afectan a uno o varios de los paises comparados."
              : "Macro headlines affecting one or more of the compared countries."
          }
          items={newsItems.slice(0, 4)}
          locale={locale}
        />
      </div>
    </div>
  );
}
