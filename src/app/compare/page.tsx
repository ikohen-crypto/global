import { getSearchCountries } from "@/lib/countries";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CompareBuilder } from "@/components/compare-builder";
import { getServerMessages } from "@/lib/i18n/server";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Compare countries on GDP, inflation, growth, and more",
  description:
    "Build a multi-country comparison with clean charts, synchronized tables, and data-driven insight summaries.",
  path: "/compare",
});

export default async function CompareLandingPage() {
  const t = await getServerMessages();
  const countries = await getSearchCountries();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: t.common.home, href: "/" }, { label: t.common.compare }]} />
      <div className="mb-8 max-w-2xl">
        <h1 className="font-display text-4xl font-semibold">{t.comparePage.title}</h1>
        <p className="mt-3 text-muted-foreground">{t.comparePage.body}</p>
      </div>
      <CompareBuilder countries={countries} />
    </div>
  );
}
