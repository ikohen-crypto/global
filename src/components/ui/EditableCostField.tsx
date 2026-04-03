import { useState } from "react";

import { useLocale } from "@/hooks/useLocale";
import { formatCurrency } from "@/utils/currency";

export function EditableCostField({
  label,
  value,
  currency,
  note,
  onSave
}: {
  label: string;
  value: number;
  currency: string;
  note?: string;
  onSave(nextValue: number): void;
}) {
  const { language } = useLocale();
  const [draft, setDraft] = useState(String(value));

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-pine">{label}</p>
          {note ? <p className="mt-1 text-xs text-slate-500">{note}</p> : null}
        </div>
        <p className="text-sm font-semibold text-clay">{formatCurrency(value, currency)}</p>
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          inputMode="decimal"
          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-pine"
        />
        <button
          type="button"
          onClick={() => onSave(Number(draft))}
          className="rounded-2xl bg-pine px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
        >
          {language === "es" ? "Aplicar" : "Apply"}
        </button>
      </div>
    </div>
  );
}
