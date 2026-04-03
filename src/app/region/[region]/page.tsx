import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { RegionCountryBrowser } from "@/components/region-country-browser";
import { getCountriesFromCatalogByRegion } from "@/lib/countries";
import { getServerLocale } from "@/lib/i18n/server";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ region: string }>;
}) {
  const { region } = await params;
  return buildMetadata({
    title: `${region.replaceAll("-", " ")} economic rankings and country comparisons`,
    description: `Compare economies across ${region.replaceAll("-", " ")} with country profiles, rankings, and trend views.`,
    path: `/region/${region}`,
  });
}

export default async function RegionPage({
  params,
}: {
  params: Promise<{ region: string }>;
}) {
  const locale = await getServerLocale();
  const isEs = locale === "es";
  const { region } = await params;
  const countries = await getCountriesFromCatalogByRegion(region);
  if (countries.length === 0) notFound();

  const regionName = countries[0].region;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: isEs ? "Inicio" : "Home", href: "/" },
          { label: isEs ? "Regiones" : "Regions", href: "/regions" },
          { label: regionName },
        ]}
      />
      <div className="mb-8 max-w-3xl">
        <h1 className="font-display text-4xl font-semibold">{regionName}</h1>
        <p className="mt-3 text-muted-foreground">
          {isEs
            ? `Compara economias en ${regionName} con perfiles de pais, rankings y vistas de tendencia en un solo lugar.`
            : `Compare economies across ${regionName} with country profiles, rankings, and trend views in one place.`}
        </p>
      </div>
      <div className="mb-8 flex flex-wrap gap-3">
        <Link
          href={`/region/${region}/rankings/financial/macro-stability`}
          className="rounded-full border border-border px-4 py-2 text-sm"
        >
          {isEs ? "Estabilidad macro regional" : "Regional macro stability"}
        </Link>
        <Link
          href={`/region/${region}/rankings/financial/growth-vs-inflation`}
          className="rounded-full border border-border px-4 py-2 text-sm"
        >
          {isEs ? "Crecimiento regional vs inflacion" : "Regional growth vs inflation"}
        </Link>
        <Link
          href={`/region/${region}/rankings/gdp`}
          className="rounded-full border border-border px-4 py-2 text-sm"
        >
          {isEs ? "Ranking regional de PIB" : "Regional GDP rankings"}
        </Link>
        <Link
          href={`/region/${region}/rankings/inflation`}
          className="rounded-full border border-border px-4 py-2 text-sm"
        >
          {isEs ? "Ranking regional de inflacion" : "Regional inflation rankings"}
        </Link>
      </div>
      <RegionCountryBrowser countries={countries} regionName={regionName} />
    </div>
  );
}
