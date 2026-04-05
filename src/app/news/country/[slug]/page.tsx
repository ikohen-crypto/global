import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { NewsSection } from "@/components/news-section";
import { getCountryBySlug, getSearchCountries } from "@/lib/countries";
import { getNewsByCountrySlug } from "@/lib/news/rss";
import { getServerLocale } from "@/lib/i18n/server";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const country = await getCountryBySlug(slug);

  return buildMetadata({
    title: country ? `${country.name} macro news` : "Country macro news",
    description: country
      ? `Follow macro and market headlines linked to ${country.name}.`
      : "Follow country-level macro and market headlines.",
    path: `/news/country/${slug}`,
  });
}

export const revalidate = 60;

export async function generateStaticParams() {
  const countries = await getSearchCountries();
  return countries.slice(0, 60).map((country) => ({ slug: country.slug }));
}

export default async function NewsCountryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const locale = await getServerLocale();
  const { slug } = await params;
  const country = await getCountryBySlug(slug);
  if (!country) {
    notFound();
  }

  const items = await getNewsByCountrySlug(slug);
  const copy = locale === "es"
    ? {
        home: "Inicio",
        news: "Noticias",
        title: `Noticias macro de ${country.name}`,
        body: `Cobertura macro y de mercado vinculada a ${country.name}, util para seguir riesgo, tasas, inflacion y moneda.`,
        empty: "Todavia no hay noticias etiquetadas para este pais.",
      }
    : {
        home: "Home",
        news: "News",
        title: `${country.name} macro news`,
        body: `Macro and market coverage linked to ${country.name}, useful for tracking risk, rates, inflation, and currency pressure.`,
        empty: "No tagged news items were found for this country yet.",
      };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: copy.home, href: "/" },
          { label: copy.news, href: "/news" },
          { label: country.name },
        ]}
      />
      <div className="mb-8 max-w-4xl">
        <h1 className="font-display text-4xl font-semibold">{copy.title}</h1>
        <p className="mt-3 text-muted-foreground">{copy.body}</p>
      </div>

      {items.length > 0 ? (
        <NewsSection title={copy.title} description={copy.body} items={items} locale={locale} showHeader={false} />
      ) : (
        <div className="rounded-[1.75rem] border border-dashed border-border bg-card/60 p-6 text-sm text-muted-foreground">
          {copy.empty}
        </div>
      )}
    </div>
  );
}
