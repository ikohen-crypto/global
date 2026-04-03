import { Breadcrumbs } from "@/components/breadcrumbs";
import { NewsWatchlistDashboard } from "@/components/news-watchlist-dashboard";
import { WatchlistDashboard } from "@/components/watchlist-dashboard";
import { getCountries } from "@/lib/countries";
import { getServerMessages } from "@/lib/i18n/server";
import { getLocalizedNewsSourceLabelSafe, getMacroNews } from "@/lib/news/rss";
import { newsSourceDefinitions } from "@/lib/news/sources";

export default async function FavoritesPage() {
  const messages = await getServerMessages();
  const locale = messages.common.home === "Inicio" ? "es" : "en";
  const [countries, newsItems] = await Promise.all([getCountries(), getMacroNews()]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: messages.common.home, href: "/" }, { label: messages.common.favorites }]} />
      <div className="mb-8 max-w-2xl">
        <h1 className="font-display text-4xl font-semibold">{messages.favoritesPage.title}</h1>
        <p className="mt-3 text-muted-foreground">{messages.favoritesPage.body}</p>
      </div>
      <div className="space-y-10">
        <WatchlistDashboard countries={countries} />
        <NewsWatchlistDashboard
          items={newsItems}
          sourceLabels={Object.fromEntries(
            Object.values(newsSourceDefinitions).map((source) => [
              source.id,
              getLocalizedNewsSourceLabelSafe(source.id, locale),
            ]),
          ) as Record<(typeof newsItems)[number]["sourceId"], string>}
        />
      </div>
    </div>
  );
}
