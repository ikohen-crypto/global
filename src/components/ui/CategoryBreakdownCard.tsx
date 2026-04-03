import { useState } from "react";

import { CostConfidenceBadge } from "@/components/ui/CostConfidenceBadge";
import { EditableCostField } from "@/components/ui/EditableCostField";
import { Panel } from "@/components/ui/Panel";
import { useLocale } from "@/hooks/useLocale";
import { formatCurrency } from "@/utils/currency";
import { getCategoryLabel } from "@/utils/presentation";
import type { BudgetCategoryKey, FinalBudgetSummary } from "@/types";

const categories = ["food", "localTransport", "activities", "extras"] as const satisfies readonly Exclude<
  BudgetCategoryKey,
  "flights" | "lodging"
>[];

type BreakdownCategory = (typeof categories)[number];

function surfaceClasses(sourceType: FinalBudgetSummary[BreakdownCategory]["sourceType"]): string {
  if (sourceType === "api") {
    return "border-emerald-100 bg-emerald-50/60";
  }

  if (sourceType === "mixed") {
    return "border-sky-100 bg-sky-50/60";
  }

  if (sourceType === "mock") {
    return "border-amber-100 bg-amber-50/70";
  }

  if (sourceType === "manual") {
    return "border-orange-100 bg-orange-50/70";
  }

  return "border-slate-100 bg-slate-50/60";
}

export function CategoryBreakdownCard({
  summary,
  onOverride
}: {
  summary: FinalBudgetSummary;
  onOverride(category: BudgetCategoryKey, value: number): void;
}) {
  const { language } = useLocale();
  const [editingCategory, setEditingCategory] = useState<BreakdownCategory | null>(null);

  const items: Record<BreakdownCategory, FinalBudgetSummary[BreakdownCategory]> = {
    food: summary.food,
    localTransport: summary.localTransport,
    activities: summary.activities,
    extras: summary.extras
  };

  return (
    <Panel
      title={language === "es" ? "Desglose por categor\xeda" : "Category breakdown"}
      subtitle={
        language === "es"
          ? "Cada l\xednea est\xe1 marcada expl\xedcitamente como real, estimada o demo."
          : "Each line is explicitly marked as real, estimated, or demo."
      }
    >
      <div className="space-y-4">
        {categories.map((category) => {
          const item = items[category];
          const categoryLabel = getCategoryLabel(category, language);

          return (
            <div key={category} className={`rounded-3xl border p-4 ${surfaceClasses(item.sourceType)}`}>
              {editingCategory === category ? (
                <EditableCostField
                  label={categoryLabel}
                  value={item.value}
                  currency={summary.currency}
                  note={
                    language === "es"
                      ? "El ajuste manual se enviar\xE1 usando el contrato compartido."
                      : "The manual adjustment will be sent using the shared contract."
                  }
                  onSave={(nextValue) => {
                    onOverride(category, nextValue);
                    setEditingCategory(null);
                  }}
                />
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-pine">{categoryLabel}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatCurrency(item.value, summary.currency, language === "es" ? "es-ES" : "en-US")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CostConfidenceBadge confidence={item.confidence} sourceType={item.sourceType} />
                      <button
                        type="button"
                        onClick={() => setEditingCategory(category)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-pine hover:text-pine"
                      >
                        {language === "es" ? "Editar" : "Edit"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div
                      className={`rounded-2xl bg-white/90 px-4 py-3 ${
                        item.sourceType === "api"
                          ? "ring-1 ring-emerald-100"
                          : item.sourceType === "mixed"
                            ? "ring-1 ring-sky-100"
                            : item.sourceType === "mock"
                              ? "ring-1 ring-amber-100"
                              : item.sourceType === "manual"
                                ? "ring-1 ring-orange-100"
                                : ""
                      }`}
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        {language === "es" ? "Precio mostrado" : "Price shown"}
                      </p>
                      <p className="mt-2 font-semibold text-slate-700">
                        {formatCurrency(item.value, summary.currency, language === "es" ? "es-ES" : "en-US")}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.lastUpdatedAt
                          ? `${language === "es" ? "Actualizado" : "Updated"} ${new Date(item.lastUpdatedAt).toLocaleString(
                              language === "es" ? "es-ES" : "en-US"
                            )}`
                          : language === "es"
                            ? "Sin marca de actualizaci\xF3n"
                            : "No update timestamp"}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
