import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { useLocale } from "@/hooks/useLocale";
import { localizeExplanation } from "@/utils/presentation";
import type { EstimateExplanation } from "@/types";

export function ExplanationPanel({
  title,
  explanation,
  sourceTag
}: {
  title?: string;
  explanation: EstimateExplanation;
  sourceTag?: string;
}) {
  const { language } = useLocale();
  const [open, setOpen] = useState(false);
  const localizedExplanation = localizeExplanation(explanation, language);

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-4">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <div>
          <p className="font-semibold text-pine">
            {title ?? (language === "es" ? "Detalles" : "Details")}
          </p>
          <p className="mt-1 text-sm text-slate-500">{localizedExplanation.summary}</p>
        </div>
        {sourceTag ? <Badge tone="info">{sourceTag}</Badge> : null}
      </button>
      {open ? (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 text-sm text-slate-600">
          <p>{localizedExplanation.methodology}</p>
          {localizedExplanation.formula ? (
            <p className="rounded-2xl bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">
              {localizedExplanation.formula}
            </p>
          ) : null}
          <div className="grid gap-2 sm:grid-cols-2">
            {localizedExplanation.inputs.map((input) => (
              <div key={input.label} className="rounded-2xl bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{input.label}</p>
                <p className="mt-1 font-semibold text-slate-700">{String(input.value)}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
