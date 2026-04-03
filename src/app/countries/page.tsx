import { Breadcrumbs } from "@/components/breadcrumbs";
import { CountryBrowser } from "@/components/country-browser";
import { getSearchCountries } from "@/lib/countries";
import { getServerMessages } from "@/lib/i18n/server";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Country market profiles",
  description: "Browse country market profiles with growth, inflation, debt, funding, and comparison entry points.",
  path: "/countries",
});

export default async function CountriesPage() {
  const t = await getServerMessages();
  const countries = await getSearchCountries();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: t.common.home, href: "/" }, { label: t.common.countries }]} />
      <div className="mb-8">
        <h1 className="font-display text-4xl font-semibold">{t.countriesPage.title}</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">{t.countriesPage.body}</p>
      </div>
      <CountryBrowser countries={countries} />
    </div>
  );
}
