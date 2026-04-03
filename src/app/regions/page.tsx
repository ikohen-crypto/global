import { Breadcrumbs } from "@/components/breadcrumbs";
import { RegionBrowser } from "@/components/region-browser";
import { getRegionsFromCatalog } from "@/lib/countries";
import { getServerMessages } from "@/lib/i18n/server";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "World regions",
  description: "Browse world regions, compare their member countries, and jump into regional rankings.",
  path: "/regions",
});

export default async function RegionsPage() {
  const t = await getServerMessages();
  const regions = await getRegionsFromCatalog();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: t.common.home, href: "/" }, { label: t.common.regions }]} />
      <div className="mb-8 max-w-3xl">
        <h1 className="font-display text-4xl font-semibold">{t.regionsPage.title}</h1>
        <p className="mt-3 text-muted-foreground">{t.regionsPage.body}</p>
      </div>
      <RegionBrowser regions={regions} />
    </div>
  );
}
