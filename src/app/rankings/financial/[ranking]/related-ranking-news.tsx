import { NewsSection } from "@/components/news-section";
import { getNewsBySignalTypes } from "@/lib/news/rss";
import type { FinancialRankingId, NewsSignalType } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

const rankingSignals: Record<FinancialRankingId, NewsSignalType[]> = {
  "macro-stability": ["inflation-pressure", "central-bank-shift", "debt-risk"],
  "growth-vs-inflation": ["growth-improvement", "growth-slowdown", "inflation-pressure"],
  "debt-pressure": ["debt-risk", "currency-stress"],
  "funding-cost": ["central-bank-shift", "currency-stress"],
};

export async function RelatedRankingNews({
  ranking,
  locale,
}: {
  ranking: FinancialRankingId;
  locale: Locale;
}) {
  const isEs = locale === "es";
  const newsItems = await getNewsBySignalTypes(rankingSignals[ranking]);

  if (newsItems.length === 0) {
    return null;
  }

  return (
    <NewsSection
      title={isEs ? "Noticias relacionadas con este ranking" : "News related to this ranking"}
      description={
        isEs
          ? "Titulares macro vinculados con las senales que mas pesan en este ranking."
          : "Macro headlines linked to the signals that matter most for this ranking."
      }
      items={newsItems.slice(0, 4)}
      locale={locale}
    />
  );
}
