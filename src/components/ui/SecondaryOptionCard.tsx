import type { AlternativeTravelOption } from "@/types";
import { formatCurrency } from "@/utils/currency";
import { getSourceNameLabel, translateBudgetText, type PresentationLanguage } from "@/utils/presentation";

function buttonLabel(option: AlternativeTravelOption, language: PresentationLanguage): string {
  const sourceName = getSourceNameLabel(option.sourceName, language) ?? option.sourceName;
  if (language === "es") {
    return `Abrir en ${sourceName}`;
  }

  return `Open in ${sourceName}`;
}

export function SecondaryOptionCard({
  title,
  option,
  language,
  locale,
  fallbackMessage
}: {
  title: string;
  option?: AlternativeTravelOption;
  language: PresentationLanguage;
  locale: string;
  fallbackMessage: string;
  }) {
  const label = option ? translateBudgetText(option.label, language) : undefined;
  const sourceName = option ? getSourceNameLabel(option.sourceName, language) ?? option.sourceName : undefined;

  return (
    <section className="rounded-3xl border border-slate-100 bg-slate-50/80 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{title}</p>

      {!option ? (
        <p className="mt-3 text-sm text-slate-500">{fallbackMessage}</p>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-800">{label}</p>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">{sourceName}</span>
          </div>

          {option.value !== undefined ? (
            <p className="text-lg font-semibold text-pine">
              {formatCurrency(option.value, option.currency ?? "USD", locale)}
            </p>
          ) : null}

          {option.bookingLink ? (
            <a
              href={option.bookingLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-pine transition hover:border-pine hover:bg-pine hover:text-white"
            >
              {buttonLabel(option, language)}
            </a>
          ) : null}
        </div>
      )}
    </section>
  );
}
