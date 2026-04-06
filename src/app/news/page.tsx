import { Breadcrumbs } from "@/components/breadcrumbs";
import { NewsExplorer } from "@/components/news-explorer";
import { NewsSectionsBrowser } from "@/components/news-sections-browser";
import {
  getLocalizedNewsSourceLabelSafe,
  getMacroNews,
  getNewsSections,
} from "@/lib/news/rss";
import { getServerLocale } from "@/lib/i18n/server";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Macro news for investors",
  description:
    "Follow inflation, central-bank, debt, FX, and crypto-relevant macro headlines with country and topic filters.",
  path: "/news",
});

export const revalidate = 60;

export default async function NewsPage() {
  const locale = await getServerLocale();
  const [items, sections] = await Promise.all([getMacroNews(), getNewsSections()]);

  const copy = {
    en: {
      home: "Home",
      title: "Macro news for investors",
      body: "Follow inflation, rates, debt, FX, and crypto-sensitive macro stories, then jump straight into the relevant countries and indicators.",
      empty: "No live items were returned right now. The source connectors are ready, but one or more feeds may be slow or temporarily unavailable.",
    },
    es: {
      home: "Inicio",
      title: "Noticias macro para inversores",
      body: "Segui historias macro sobre inflacion, tasas, deuda, FX y crypto, y salta directo a los paises e indicadores relacionados.",
      empty: "Ahora no volvieron noticias en vivo. Los conectores ya estan listos, pero uno o mas feeds pueden estar lentos o temporalmente no disponibles.",
    },
  }[locale];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: copy.home, href: "/" }, { label: locale === "es" ? "Noticias" : "News" }]} />
      <div className="mb-8 max-w-4xl">
        <h1 className="font-display text-4xl font-semibold">{copy.title}</h1>
        <p className="mt-3 text-muted-foreground">{copy.body}</p>
      </div>

      {sections.length > 0 ? (
        <div className="mb-10">
          <NewsSectionsBrowser
            sections={sections.map((section) => ({
              id: section.id,
              title: section.title[locale],
              description: section.description[locale],
              items: section.items,
            }))}
            locale={locale}
          />
        </div>
      ) : null}

      {items.length > 0 ? (
          <NewsExplorer
            items={items}
            locale={locale}
            sourceLabels={{
            imf: getLocalizedNewsSourceLabelSafe("imf", locale),
            ecb: getLocalizedNewsSourceLabelSafe("ecb", locale),
            fed: getLocalizedNewsSourceLabelSafe("fed", locale),
            investing: getLocalizedNewsSourceLabelSafe("investing", locale),
            coindesk: getLocalizedNewsSourceLabelSafe("coindesk", locale),
            cointelegraph: getLocalizedNewsSourceLabelSafe("cointelegraph", locale),
            cryptonews: getLocalizedNewsSourceLabelSafe("cryptonews", locale),
            messari: getLocalizedNewsSourceLabelSafe("messari", locale),
            theblock: getLocalizedNewsSourceLabelSafe("theblock", locale),
            beincrypto: getLocalizedNewsSourceLabelSafe("beincrypto", locale),
            blockworks: getLocalizedNewsSourceLabelSafe("blockworks", locale),
            bitcoinmagazine: getLocalizedNewsSourceLabelSafe("bitcoinmagazine", locale),
            utoday: getLocalizedNewsSourceLabelSafe("utoday", locale),
            freeCryptoNews: getLocalizedNewsSourceLabelSafe("freeCryptoNews", locale),
            marketaux: getLocalizedNewsSourceLabelSafe("marketaux", locale),
          }}
        />
      ) : (
        <div className="rounded-[1.75rem] border border-dashed border-border bg-card/60 p-6 text-sm text-muted-foreground">
          {copy.empty}
        </div>
      )}
    </div>
  );
}
