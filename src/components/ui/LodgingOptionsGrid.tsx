import type { FinalBudgetSummary } from "@/types";
import { formatCurrency } from "@/utils/currency";
import { getSourceNameLabel } from "@/utils/presentation";

function tierLabel(tier: FinalBudgetSummary["lodging"]["hotelOptions"][number]["tier"], language: "es" | "en"): string {
  if (language === "es") {
    if (tier === "saving") return "Barato";
    if (tier === "standard") return "Medio";
    return "Caro";
  }

  if (tier === "saving") return "Budget";
  if (tier === "standard") return "Mid-range";
  return "Premium";
}

function formatHotelField(value?: string): string | undefined {
  const normalized = value?.trim();
  if (!normalized) {
    return undefined;
  }

  return normalized.replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function bookingLabel(language: "es" | "en"): string {
  return language === "es" ? "Abrir en Booking.com" : "Open in Booking.com";
}

function optionTitle(option: FinalBudgetSummary["lodging"]["hotelOptions"][number], language: "es" | "en"): string {
  if (option.propertyName) {
    return option.propertyName;
  }

  if (language === "es") {
    if (option.tier === "saving") return "Opción barata estimada";
    if (option.tier === "standard") return "Opción media estimada";
    return "Opción cara estimada";
  }

  if (option.tier === "saving") return "Estimated budget option";
  if (option.tier === "standard") return "Estimated mid-range option";
  return "Estimated premium option";
}

export function LodgingOptionsGrid({
  options,
  currency,
  language
}: {
  options: FinalBudgetSummary["lodging"]["hotelOptions"];
  currency: string;
  language: "es" | "en";
}) {
  const locale = language === "es" ? "es-ES" : "en-US";

  if (!options.length) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
          {language === "es" ? "Tres hoteles" : "Three hotels"}
        </p>
        <p className="text-sm text-slate-500">
          {language === "es" ? "Barato, medio y caro" : "Budget, mid-range and premium"}
        </p>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        {options.slice(0, 3).map((option) => (
          <article key={`${option.tier}-${option.propertyName}`} className="rounded-3xl border border-white bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{tierLabel(option.tier, language)}</p>
                <p className="mt-1 font-semibold text-slate-800">{optionTitle(option, language)}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                {getSourceNameLabel(option.sourceName, language) ?? option.sourceName}
              </span>
            </div>

            <p className="mt-3 text-lg font-semibold text-pine">
              {formatCurrency(option.nightlyRate, option.currency ?? currency, locale)}
            </p>
            <p className="text-sm text-slate-500">
              {language === "es"
                ? `Tarifa total de estadía: ${formatCurrency(option.stayTotal, option.currency ?? currency, locale)}`
                : `Total stay rate: ${formatCurrency(option.stayTotal, option.currency ?? currency, locale)}`}
            </p>

            <div className="mt-3 space-y-1 text-sm text-slate-500">
              {formatHotelField(option.propertyType) ? <p>{formatHotelField(option.propertyType)}</p> : null}
              {formatHotelField(option.boardType) ? <p>{formatHotelField(option.boardType)}</p> : null}
              {formatHotelField(option.roomDescription) ? <p>{formatHotelField(option.roomDescription)}</p> : null}
              {option.lastUpdatedAt ? <p>{language === "es" ? `Actualizado: ${option.lastUpdatedAt}` : `Updated: ${option.lastUpdatedAt}`}</p> : null}
            </div>

            {option.bookingLink ? (
              <a
                href={option.bookingLink}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-pine transition hover:border-pine hover:bg-pine hover:text-white"
              >
                {bookingLabel(language)}
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
