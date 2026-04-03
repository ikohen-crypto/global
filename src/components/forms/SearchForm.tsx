import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { BudgetStyleSelector } from "@/components/forms/BudgetStyleSelector";
import { DestinationSelector } from "@/components/forms/DestinationSelector";
import { PassengerSelector } from "@/components/forms/PassengerSelector";
import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import { StateMessage } from "@/components/ui/StateMessage";
import { useLocale } from "@/hooks/useLocale";
import { useTravelBudgetWorkspace } from "@/hooks/useTravelBudgetWorkspace";

export function SearchForm() {
  const { language } = useLocale();
  const navigate = useNavigate();
  const {
    draftInput,
    comparisonStatus,
    comparisonError,
    compareNow,
    referenceConfig,
    setDepartureDate,
    setReturnDate,
    setNights,
    setPreferredCurrency
  } = useTravelBudgetWorkspace();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await compareNow();
    navigate("/results");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Panel
            title={language === "es" ? "Planificador del viaje" : "Trip planner"}
            subtitle={
              language === "es"
                ? "Usa datos oficiales cuando estén disponibles y estimaciones claramente marcadas cuando no lo estén."
                : "Use official data when available and clearly marked estimates when it is not."
            }
            action={<Badge tone="info">{comparisonStatus}</Badge>}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-stone-500">
                  {language === "es" ? "Fecha de salida" : "Departure date"}
                </span>
                <input type="date" value={draftInput.departureDate} onChange={(event) => setDepartureDate(event.target.value)} className="field-control" />
              </label>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-stone-500">
                  {language === "es" ? "Fecha de regreso" : "Return date"}
                </span>
                <input type="date" value={draftInput.returnDate} onChange={(event) => setReturnDate(event.target.value)} className="field-control" />
              </label>
              <label className="space-y-2 sm:col-span-2">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-stone-500">
                  {language === "es" ? "Noches" : "Nights"}
                </span>
                <input type="number" min="1" value={draftInput.nights} onChange={(event) => setNights(Number(event.target.value))} className="field-control" />
              </label>
              <label className="space-y-2 sm:col-span-2">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-stone-500">
                  {language === "es" ? "Moneda" : "Currency"}
                </span>
                <select value={draftInput.preferredCurrency} onChange={(event) => setPreferredCurrency(event.target.value)} className="field-control">
                  {referenceConfig.supportedCurrencies.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </Panel>

          <DestinationSelector />
        </div>

        <div className="space-y-6">
          <PassengerSelector />
          <BudgetStyleSelector />
        </div>
      </div>

      {comparisonError ? (
        <StateMessage
          tone="danger"
          tag={language === "es" ? "Error de comparación" : "Comparison error"}
          title={language === "es" ? "No pudimos completar la comparación de presupuesto." : "We could not complete the budget comparison."}
          description={comparisonError}
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {language === "es"
            ? "Los ajustes manuales, el origen de los datos y los niveles de confianza seguirán visibles en los resultados."
            : "Manual adjustments, data origin, and confidence levels will remain visible in the results."}
        </p>
        <button type="submit" className="rounded-full bg-pine px-6 py-3 text-sm font-semibold text-white shadow-card transition hover:opacity-95">
          {language === "es" ? "Comparar presupuestos" : "Compare budgets"}
        </button>
      </div>
    </form>
  );
}
