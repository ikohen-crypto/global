import { Panel } from "@/components/ui/Panel";
import { useLocale } from "@/hooks/useLocale";
import { useTravelBudgetWorkspace } from "@/hooks/useTravelBudgetWorkspace";
import type { AccommodationType, ActivityStyle, FoodStyle, LocalTransportStyle } from "@/types";

const accommodationOptions: AccommodationType[] = ["hotel", "apartment", "hostel"];
const foodOptions: FoodStyle[] = ["saving", "standard", "comfortable"];
const transportOptions: LocalTransportStyle[] = ["public", "mixed", "private"];
const activityOptions: ActivityStyle[] = ["light", "balanced", "packed"];

const optionLabels = {
  es: {
    hotel: "Hotel",
    apartment: "Departamento",
    hostel: "Hostel",
    saving: "Ahorro",
    standard: "Normal",
    comfortable: "Cómodo",
    public: "Público",
    mixed: "Mixto",
    private: "Privado",
    light: "Ligero",
    balanced: "Equilibrado",
    packed: "Intenso"
  },
  en: {
    hotel: "Hotel",
    apartment: "Apartment",
    hostel: "Hostel",
    saving: "Saving",
    standard: "Standard",
    comfortable: "Comfortable",
    public: "Public",
    mixed: "Mixed",
    private: "Private",
    light: "Light",
    balanced: "Balanced",
    packed: "Packed"
  }
} as const;

function SegmentGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  language
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange(next: T): void;
  language: "es" | "en";
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-stone-500">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={[
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              value === option
                ? "bg-pine text-white shadow-card"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-pine dark:bg-stone-900 dark:text-stone-200 dark:ring-stone-700"
            ].join(" ")}
          >
            {optionLabels[language][option as keyof typeof optionLabels.es] ?? option}
          </button>
        ))}
      </div>
    </div>
  );
}

export function BudgetStyleSelector() {
  const { language } = useLocale();
  const {
    draftInput,
    setAccommodationType,
    setFoodStyle,
    setLocalTransportStyle,
    setActivityStyle,
    setActivityCount,
    toggleFlag
  } = useTravelBudgetWorkspace();

  return (
    <Panel
      title={language === "es" ? "Estilo de presupuesto" : "Budget style"}
      subtitle={language === "es" ? "Estas preferencias definen el perfil de estimación." : "These preferences define the estimation profile."}
    >
      <div className="space-y-5">
        <SegmentGroup label={language === "es" ? "Alojamiento" : "Lodging"} value={draftInput.accommodationType} options={accommodationOptions} onChange={setAccommodationType} language={language} />
        <SegmentGroup label={language === "es" ? "Comida" : "Food"} value={draftInput.foodStyle} options={foodOptions} onChange={setFoodStyle} language={language} />
        <SegmentGroup label={language === "es" ? "Transporte local" : "Local transport"} value={draftInput.localTransportStyle} options={transportOptions} onChange={setLocalTransportStyle} language={language} />
        <SegmentGroup label={language === "es" ? "Actividades" : "Activities"} value={draftInput.activityStyle} options={activityOptions} onChange={setActivityStyle} language={language} />
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-stone-500">
            {language === "es" ? "Actividades pagas" : "Paid activities"}
          </span>
          <input type="number" min="0" value={draftInput.activityCount} onChange={(event) => setActivityCount(Number(event.target.value))} className="field-control" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            language === "es"
              ? [
                  ["includeCheckedBag", "Equipaje facturado"],
                  ["includeTravelInsurance", "Seguro de viaje"],
                  ["includeRoaming", "Roaming / eSIM"],
                  ["includeAirportTransfers", "Traslados aeropuerto"],
                  ["includeContingency", "Imprevistos"],
                  ["includeSouvenirs", "Souvenirs"],
                  ["includeVisaCosts", "Costos de visa"],
                  ["includeTouristTaxes", "Tasas turísticas"],
                  ["includeTips", "Propinas"]
                ]
              : [
                  ["includeCheckedBag", "Checked bag"],
                  ["includeTravelInsurance", "Travel insurance"],
                  ["includeRoaming", "Roaming / eSIM"],
                  ["includeAirportTransfers", "Airport transfers"],
                  ["includeContingency", "Contingency"],
                  ["includeSouvenirs", "Souvenirs"],
                  ["includeVisaCosts", "Visa costs"],
                  ["includeTouristTaxes", "Tourist taxes"],
                  ["includeTips", "Tips"]
                ]
          ).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200">
              <span>{label}</span>
              <input
                type="checkbox"
                checked={Boolean(draftInput[key as keyof typeof draftInput])}
                onChange={() => toggleFlag(key as never)}
                className="h-4 w-4 rounded border-slate-300 text-pine focus:ring-pine dark:border-stone-700"
              />
            </label>
          ))}
        </div>
      </div>
    </Panel>
  );
}
