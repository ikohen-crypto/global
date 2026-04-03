import { useLocale } from "@/hooks/useLocale";
import { formatCurrency } from "@/utils/currency";

export function PriceRangeBar({
  minimum,
  expected,
  high,
  currency
}: {
  minimum: number;
  expected: number;
  high: number;
  currency: string;
}) {
  const { language } = useLocale();
  const locale = language === "es" ? "es-ES" : "en-US";
  const range = Math.max(1, high - minimum);
  const expectedPosition = Math.max(0.1, Math.min(0.9, (expected - minimum) / range));

  return (
    <div className="rounded-3xl bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
        <span>{formatCurrency(minimum, currency, locale)}</span>
        <span>{formatCurrency(expected, currency, locale)}</span>
        <span>{formatCurrency(high, currency, locale)}</span>
      </div>
      <div className="relative h-3 rounded-full bg-gradient-to-r from-emerald-200 via-amber-200 to-rose-200">
        <span
          className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-white bg-pine shadow"
          style={{ left: `${expectedPosition * 100}%` }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>{language === "es" ? "Mínimo" : "Minimum"}</span>
        <span>{language === "es" ? "Esperado" : "Expected"}</span>
        <span>{language === "es" ? "Alto" : "High"}</span>
      </div>
    </div>
  );
}
