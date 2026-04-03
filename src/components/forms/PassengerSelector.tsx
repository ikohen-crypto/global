import { Panel } from "@/components/ui/Panel";
import { useLocale } from "@/hooks/useLocale";
import { useTravelBudgetWorkspace } from "@/hooks/useTravelBudgetWorkspace";
import { getPartyLabel } from "@/utils/presentation";
import type { TravelerGroup } from "@/types";

export function PassengerSelector() {
  const { language } = useLocale();
  const { draftInput, setTravelers } = useTravelBudgetWorkspace();
  const breakdown = draftInput.travelers.breakdown;
  type VisibleBreakdownField = "adults" | "children" | "infants";
  const fields: Array<{ key: VisibleBreakdownField; label: string }> = [
    { key: "adults", label: language === "es" ? "Adultos" : "Adults" },
    { key: "children", label: language === "es" ? "Niños" : "Children" },
    { key: "infants", label: language === "es" ? "Bebés" : "Infants" }
  ];

  function updateField(field: keyof TravelerGroup["breakdown"], value: number) {
    setTravelers({
      ...breakdown,
      [field]: Math.max(0, value)
    });
  }

  return (
    <Panel
      title={language === "es" ? "Grupo de viaje" : "Travel group"}
      subtitle={
        language === "es"
          ? "Ajusta adultos, niños y bebés. El total se actualiza automáticamente."
          : "Adjust adults, children, and infants. The total updates automatically."
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {fields.map(({ key, label }) => (
          <label key={key} className="space-y-2">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-stone-500">{label}</span>
            <input
              type="number"
              min="0"
              value={breakdown[key] ?? 0}
              onChange={(event) => updateField(key, Number(event.target.value))}
              className="field-control"
            />
          </label>
        ))}
      </div>
      <div className="mt-4 rounded-3xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-stone-950/60 dark:text-stone-300">
        <p>
          {language === "es" ? "Total viajeros" : "Total travelers"}:{" "}
          <span className="font-semibold text-pine">{draftInput.travelers.totalTravelers}</span>
        </p>
        <p className="mt-1">
          {language === "es" ? "Tipo de viaje" : "Trip type"}:{" "}
          <span className="font-semibold text-pine">{getPartyLabel(draftInput, language)}</span>
        </p>
      </div>
    </Panel>
  );
}
