import { ArrowDownRight, ArrowUpRight, Gauge, Radar, Scale, TrendingUp, Wallet } from "lucide-react";
import type { ComponentProps } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Locale } from "@/lib/i18n";
import {
  buildCompareRecentMovers,
  buildCompareScoreLeaders,
  buildCountryRecentChanges,
  buildCountryScorecards,
} from "@/lib/market-intelligence";
import type { CountryProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    scoreTitle: "Decision scorecards",
    scoreBody: "A quick multi-metric read for screening stability, growth quality, funding, debt, and scale.",
    recentTitle: "What changed recently",
    recentBody: "Recent moves help flag whether conditions are improving or deteriorating before the headline number fully changes.",
    compareTitle: "Comparison leaders",
    compareBody: "The strongest all-around setups in the selected basket, using composite practical scores.",
    moversTitle: "Recent movers",
    moversBody: "The biggest recent shifts across the selected countries.",
    strong: "Strong",
    balanced: "Balanced",
    mixed: "Mixed",
    fragile: "Fragile",
    insufficient: "Insufficient coverage",
    noImprovements: "No material improvements detected in the recent data window.",
    noDeteriorations: "No material deteriorations detected in the recent data window.",
    noMovers: "Recent changes are too limited to rank yet.",
    improved: "Improved",
    worsened: "Worsened",
    cards: {
      "macro-stability": "Macro stability",
      "growth-quality": "Growth quality",
      "funding-conditions": "Funding conditions",
      "debt-risk": "Debt risk",
      "market-scale": "Market scale",
    },
    summaries: {
      strong: "The current mix looks supportive relative to peers.",
      balanced: "The signal is usable, with some tradeoffs still worth monitoring.",
      mixed: "There is a workable setup, but the risk picture is not clean.",
      fragile: "This factor looks weak and should be treated cautiously.",
      "insufficient-data": "Coverage is still too thin to score this factor reliably.",
    },
    metrics: {
      inflation: "inflation",
      gdpGrowth: "growth",
      unemployment: "unemployment",
      interestRate: "funding cost",
      debtPressure: "debt pressure",
    },
    changeText: {
      inflation: { improved: "inflation cooled by", worsened: "inflation accelerated by" },
      gdpGrowth: { improved: "growth improved by", worsened: "growth weakened by" },
      unemployment: { improved: "unemployment fell by", worsened: "unemployment rose by" },
      interestRate: { improved: "funding eased by", worsened: "funding tightened by" },
      debtPressure: { improved: "debt pressure improved by", worsened: "debt pressure worsened by" },
    },
    leaderPrefix: "Leads this comparison with",
  },
  es: {
    scoreTitle: "Scorecards para decidir",
    scoreBody: "Una lectura rapida de multiples metricas para filtrar estabilidad, calidad de crecimiento, fondeo, deuda y escala.",
    recentTitle: "Que cambio recientemente",
    recentBody: "Los movimientos recientes ayudan a detectar si las condiciones mejoran o empeoran antes de que cambie del todo el numero principal.",
    compareTitle: "Lideres de la comparacion",
    compareBody: "Las configuraciones mas fuertes del grupo seleccionado usando scores compuestos practicos.",
    moversTitle: "Movimientos recientes",
    moversBody: "Los cambios recientes mas grandes entre los paises seleccionados.",
    strong: "Fuerte",
    balanced: "Balanceado",
    mixed: "Mixto",
    fragile: "Fragil",
    insufficient: "Cobertura insuficiente",
    noImprovements: "No se detectaron mejoras materiales en la ventana reciente de datos.",
    noDeteriorations: "No se detectaron deterioros materiales en la ventana reciente de datos.",
    noMovers: "Los cambios recientes todavia son demasiado limitados para rankear.",
    improved: "Mejora",
    worsened: "Empeora",
    cards: {
      "macro-stability": "Estabilidad macro",
      "growth-quality": "Calidad de crecimiento",
      "funding-conditions": "Condiciones de fondeo",
      "debt-risk": "Riesgo de deuda",
      "market-scale": "Escala de mercado",
    },
    summaries: {
      strong: "La combinacion actual luce favorable frente a pares.",
      balanced: "La senal sirve, aunque todavia hay tradeoffs para vigilar.",
      mixed: "Hay una base util, pero el cuadro de riesgo no es limpio.",
      fragile: "Este factor luce debil y conviene tratarlo con cautela.",
      "insufficient-data": "La cobertura todavia es demasiado limitada para puntuar este factor.",
    },
    metrics: {
      inflation: "inflacion",
      gdpGrowth: "crecimiento",
      unemployment: "desempleo",
      interestRate: "costo de fondeo",
      debtPressure: "presion de deuda",
    },
    changeText: {
      inflation: { improved: "la inflacion bajo", worsened: "la inflacion subio" },
      gdpGrowth: { improved: "el crecimiento mejoro", worsened: "el crecimiento se debilito" },
      unemployment: { improved: "el desempleo bajo", worsened: "el desempleo subio" },
      interestRate: { improved: "el fondeo se alivio", worsened: "el fondeo se endurecio" },
      debtPressure: { improved: "la presion de deuda mejoro", worsened: "la presion de deuda empeoro" },
    },
    leaderPrefix: "Lidera esta comparacion con",
  },
} as const;

function toneClasses(score: number | null) {
  if (score == null) return "border-slate-400/30 bg-slate-500/10 text-slate-300";
  if (score >= 70) return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
  if (score >= 50) return "border-sky-400/30 bg-sky-500/10 text-sky-300";
  if (score >= 35) return "border-amber-400/30 bg-amber-500/10 text-amber-300";
  return "border-rose-400/30 bg-rose-500/10 text-rose-300";
}

function statusLabel(summary: string, locale: Locale) {
  const t = copy[locale];
  if (summary === "strong") return t.strong;
  if (summary === "balanced") return t.balanced;
  if (summary === "mixed") return t.mixed;
  if (summary === "fragile") return t.fragile;
  return t.insufficient;
}

function summaryText(
  summary: "strong" | "balanced" | "mixed" | "fragile" | "insufficient-data",
  locale: Locale,
) {
  return copy[locale].summaries[summary];
}

function iconForCard(id: string) {
  if (id === "macro-stability") return ShieldLike;
  if (id === "growth-quality") return TrendingUp;
  if (id === "funding-conditions") return Wallet;
  if (id === "debt-risk") return Scale;
  return Gauge;
}

function ShieldLike(props: ComponentProps<typeof Radar>) {
  return <Radar {...props} />;
}

function formatChange(delta: number) {
  return `${delta.toFixed(1)}pp`;
}

export function CountryActionPanels({
  profile,
  locale = "en",
}: {
  profile: CountryProfile;
  locale?: Locale;
}) {
  const t = copy[locale];
  const scorecards = buildCountryScorecards(profile);
  const recent = buildCountryRecentChanges(profile);

  return (
    <section className="mt-10 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <Card>
        <CardHeader>
          <CardTitle>{t.scoreTitle}</CardTitle>
          <CardDescription>{t.scoreBody}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {scorecards.map((card) => {
            const Icon = iconForCard(card.id);
            return (
              <div key={card.id} className="rounded-2xl border border-border bg-background/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-muted-foreground">{t.cards[card.id as keyof typeof t.cards]}</div>
                    <div className="mt-2 font-display text-3xl font-semibold">
                      {card.score == null ? "N/A" : `${card.score.toFixed(0)}/100`}
                    </div>
                  </div>
                  <div className={cn("rounded-full border p-2", toneClasses(card.score))}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 text-sm font-medium">{statusLabel(card.summary, locale)}</div>
                <p className="mt-2 text-sm text-muted-foreground">{summaryText(card.summary as "strong" | "balanced" | "mixed" | "fragile" | "insufficient-data", locale)}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.recentTitle}</CardTitle>
          <CardDescription>{t.recentBody}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <ArrowUpRight className="h-4 w-4 text-emerald-400" />
              {t.improved}
            </div>
            <div className="space-y-3">
              {recent.improvements.length > 0 ? recent.improvements.map((change) => (
                <div key={change.id} className="rounded-2xl border border-border bg-background/70 p-4 text-sm">
                  <div className="font-medium">
                    {t.changeText[change.metricKey].improved} {formatChange(change.delta)}
                  </div>
                  <p className="mt-1 text-muted-foreground">{t.metrics[change.metricKey]}</p>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-border bg-background/50 p-4 text-sm text-muted-foreground">
                  {t.noImprovements}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <ArrowDownRight className="h-4 w-4 text-rose-400" />
              {t.worsened}
            </div>
            <div className="space-y-3">
              {recent.deteriorations.length > 0 ? recent.deteriorations.map((change) => (
                <div key={change.id} className="rounded-2xl border border-border bg-background/70 p-4 text-sm">
                  <div className="font-medium">
                    {t.changeText[change.metricKey].worsened} {formatChange(change.delta)}
                  </div>
                  <p className="mt-1 text-muted-foreground">{t.metrics[change.metricKey]}</p>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-border bg-background/50 p-4 text-sm text-muted-foreground">
                  {t.noDeteriorations}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export function CompareActionPanels({
  profiles,
  locale = "en",
}: {
  profiles: CountryProfile[];
  locale?: Locale;
}) {
  const t = copy[locale];
  const leaders = buildCompareScoreLeaders(profiles);
  const movers = buildCompareRecentMovers(profiles);

  return (
    <section className="mt-10 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <Card>
        <CardHeader>
          <CardTitle>{t.compareTitle}</CardTitle>
          <CardDescription>{t.compareBody}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {leaders.map((leader) => (
            <div key={leader.id} className="rounded-2xl border border-border bg-background/70 p-4">
              <div className="text-sm text-muted-foreground">{t.cards[leader.id]}</div>
              <div className="mt-2 text-lg font-semibold">{leader.countryName}</div>
              <p className="mt-2 text-sm text-muted-foreground">
                {t.leaderPrefix} {leader.score.toFixed(0)}/100
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.moversTitle}</CardTitle>
          <CardDescription>{t.moversBody}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {movers.length > 0 ? movers.map((change) => (
            <div key={`${change.countryName}-${change.id}-${change.direction}`} className="rounded-2xl border border-border bg-background/70 p-4 text-sm">
              <div className="font-medium">
                {change.countryName}:{" "}
                {change.direction === "improved"
                  ? t.changeText[change.metricKey].improved
                  : t.changeText[change.metricKey].worsened}{" "}
                {formatChange(change.delta)}
              </div>
              <p className="mt-1 text-muted-foreground">{t.metrics[change.metricKey]}</p>
            </div>
          )) : (
            <div className="rounded-2xl border border-dashed border-border bg-background/50 p-4 text-sm text-muted-foreground">
              {t.noMovers}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
