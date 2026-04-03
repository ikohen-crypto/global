import { Badge } from "@/components/ui/Badge";
import { CostConfidenceBadge } from "@/components/ui/CostConfidenceBadge";
import { ExplanationPanel } from "@/components/ui/ExplanationPanel";
import { Panel } from "@/components/ui/Panel";
import { PriceRangeBar } from "@/components/ui/PriceRangeBar";
import { useLocale } from "@/hooks/useLocale";
import { formatCurrency } from "@/utils/currency";
import {
  getScenarioLabel,
  getSourceNameLabel,
  resolveAirlineNames,
  translateBudgetText
} from "@/utils/presentation";
import type { FinalBudgetSummary } from "@/types";

export function BudgetSummaryCard({
  summary,
  onDetails
}: {
  summary: FinalBudgetSummary;
  onDetails?(): void;
}) {
  const { language } = useLocale();
  const locale = language === "es" ? "es-ES" : "en-US";
  const travelerCount = summary.flights.passengerPricing.reduce((sum, item) => sum + item.quantity, 0) || 1;
  const flightSourceLabel = getSourceNameLabel(summary.flights.sourceName, language);
  const flightLinkSourceLabel = getSourceNameLabel(
    summary.flights.bookingLinkSource === "travelpayouts"
      ? "Travelpayouts"
      : summary.flights.bookingLinkSource === "aviasales"
        ? "Aviasales"
        : undefined,
    language
  );

  return (
    <Panel
      title={summary.destination.label}
      subtitle={`${summary.destination.countryName} • ${summary.lodging.totalNights} ${
        language === "es" ? "noches" : "nights"
      } • ${travelerCount} ${language === "es" ? "viajeros" : "travelers"}`}
      action={
        onDetails ? (
          <button
            type="button"
            onClick={onDetails}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-pine transition hover:border-pine hover:bg-pine hover:text-white"
          >
            {language === "es" ? "Ver detalle" : "View details"}
          </button>
        ) : undefined
      }
    >
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">{summary.destination.cityName}</Badge>
            <CostConfidenceBadge confidence={summary.confidence} sourceType={summary.sourceType} />
            {summary.missingDataWarnings.length ? (
              <Badge tone="warning">{language === "es" ? "Revisar" : "Needs review"}</Badge>
            ) : null}
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              {language === "es" ? "Presupuesto total del viaje" : "Total trip budget"}
            </p>
            <p className="mt-2 font-display text-4xl font-bold text-pine">
              {formatCurrency(summary.value, summary.currency, locale)}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {formatCurrency(summary.totalPerPerson, summary.currency, locale)}{" "}
              {language === "es" ? "por persona" : "per person"} •{" "}
              {formatCurrency(summary.totalPerDay, summary.currency, locale)}{" "}
              {language === "es" ? "por día" : "per day"}
            </p>
            {summary.flights.bookingLink ? (
              <a
                href={summary.flights.bookingLink}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-pine transition hover:border-pine hover:bg-pine hover:text-white"
              >
                {translateBudgetText(
                  summary.flights.bookingLinkLabel ?? (language === "es" ? "Ver opciones de vuelo" : "View flight options"),
                  language
                )}
              </a>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
              {flightSourceLabel ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{flightSourceLabel}</span>
              ) : null}
              {flightLinkSourceLabel ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{flightLinkSourceLabel}</span>
              ) : null}
            </div>
            {summary.flights.itinerarySummary?.validatingAirlineCodes.length ? (
              <p className="mt-3 text-sm text-slate-500">
                {language === "es" ? "Aerolíneas" : "Airlines"}:{" "}
                {resolveAirlineNames(
                  summary.flights.itinerarySummary.validatingAirlineCodes,
                  summary.flights.itinerarySummary.validatingAirlineNames ?? []
                ).join(", ")}
              </p>
            ) : null}
          </div>

          <PriceRangeBar minimum={summary.range.minimum} expected={summary.range.expected} high={summary.range.high} currency={summary.currency} />
        </div>

        <div className="space-y-3">
          <div className="rounded-3xl bg-pine/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              {language === "es" ? "Totales por escenario" : "Scenario totals"}
            </p>
            <div className="mt-3 space-y-2 text-sm">
              {Object.entries(summary.scenarioTotals).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <span className="capitalize text-slate-600">
                    {getScenarioLabel(key as keyof typeof summary.scenarioTotals, language)}
                  </span>
                  <span className="font-semibold text-pine">{formatCurrency(value, summary.currency, locale)}</span>
                </div>
              ))}
            </div>
          </div>

          <ExplanationPanel explanation={summary.explanation} sourceTag={language === "es" ? "Resumen del presupuesto" : "Budget summary"} />
        </div>
      </div>
    </Panel>
  );
}
