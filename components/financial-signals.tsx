import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent } from "@/lib/formatters";
import type { Locale } from "@/lib/i18n";
import type { CountryProfile, MetricSnapshot } from "@/lib/types";
import { cn } from "@/lib/utils";

type SignalTone = "good" | "neutral" | "warn" | "risk";

type SignalCard = {
  title: string;
  headline: string;
  description: string;
  footnote: string;
  tone: SignalTone;
};

const copy = {
  en: {
    tone: { good: "Favorable", neutral: "Neutral", warn: "Watch", risk: "Pressure" },
    practicalSignals: "Practical signals",
    countryTitle: "A finance-first read on this country",
    countryDescription:
      "We turn the macro data into a quick screening layer for growth, inflation, funding cost, and debt pressure.",
    growth: "Growth momentum",
    inflation: "Price stability",
    funding: "Funding cost",
    debt: "Debt pressure",
    noData: "No data",
    coverageMissing: "Coverage missing",
    latestRelease: "Latest release",
    proxyRate: "Proxy lending rate",
    growthNoData: "GDP growth is not currently available for this country.",
    growthStrong: "Strong expansion at",
    growthStrongBody: "The economy is growing fast enough to support a constructive demand story.",
    growthHealthy: "Healthy growth at",
    growthHealthyBody: "Growth is positive and still useful for business planning and market entry.",
    growthSoft: "Soft growth at",
    growthSoftBody: "Expansion is present, but the pace is not yet strong enough to feel broad-based.",
    growthNegative: "Contraction at",
    growthNegativeBody: "Negative growth is a caution flag for demand, margins, and financing conditions.",
    inflationNoData: "Inflation is not currently available for this country.",
    inflationLow: "Low pressure at",
    inflationLowBody: "Price growth looks contained, which is usually friendlier for planning and margins.",
    inflationContained: "Contained at",
    inflationContainedBody: "Inflation is present but still inside a manageable range for many businesses.",
    inflationElevated: "Elevated at",
    inflationElevatedBody: "Price pressure is high enough to matter for pricing, wages, and real returns.",
    inflationSevere: "Severe pressure at",
    inflationSevereBody: "High inflation usually means weaker visibility on costs, demand, and financing.",
    fundingNoData: "Short-term rates are not currently available for this country.",
    fundingEasy: "Easy funding at",
    fundingEasyBody: "Borrowing conditions look relatively light compared with tighter-rate markets.",
    fundingModerate: "Moderate pressure at",
    fundingModerateBody: "Capital is not cheap, but this is still a usable financing environment.",
    fundingTight: "Tight at",
    fundingTightBody: "Higher short-term rates can squeeze leverage, working capital, and demand.",
    fundingVeryTight: "Very tight at",
    fundingVeryTightBody:
      "This is a restrictive financing backdrop for credit-sensitive businesses and investors.",
    debtNoReported: "No reported debt pressure",
    debtNoReportedSource: "No source",
    debtNoReportedBody: "Debt coverage is missing for this country right now.",
    debtProxy: "Debt pressure proxy",
    debtProxySource: "IMF proxy",
    debtProxyBody: "IMF proxy for gross debt as a share of GDP.",
    debtReportedNotNormalized: "Debt reported, but not normalized",
    debtReportedNotNormalizedSource: "World Bank",
    debtReportedNotNormalizedBody:
      "We have debt in dollars, but not enough data to normalize it yet.",
    debtDerivedSource: "Derived from debt and GDP",
    debtDerivedBodyHigh: "Debt pressure looks heavy and deserves caution in financial planning.",
    debtDerivedBodyMid: "Debt pressure is noticeable and worth monitoring against peers.",
    debtDerivedBodyLow: "Debt looks manageable but still relevant for risk screening.",
    debtDerivedBodyLight: "Debt pressure looks light relative to output.",
  },
  es: {
    tone: { good: "Favorable", neutral: "Neutral", warn: "Atencion", risk: "Presion" },
    practicalSignals: "Senales practicas",
    countryTitle: "Lectura financiera rapida de este pais",
    countryDescription:
      "Convertimos los datos macro en una capa rapida de screening sobre crecimiento, inflacion, costo de fondeo y presion de deuda.",
    growth: "Impulso de crecimiento",
    inflation: "Estabilidad de precios",
    funding: "Costo de fondeo",
    debt: "Presion de deuda",
    noData: "Sin datos",
    coverageMissing: "Cobertura faltante",
    latestRelease: "Ultima publicacion",
    proxyRate: "Tasa prestable proxy",
    growthNoData: "El crecimiento del PIB no esta disponible para este pais.",
    growthStrong: "Expansion fuerte de",
    growthStrongBody: "La economia crece a un ritmo que sostiene una lectura positiva de demanda.",
    growthHealthy: "Crecimiento sano de",
    growthHealthyBody: "El crecimiento es positivo y todavia sirve para planificacion y entrada a mercado.",
    growthSoft: "Crecimiento suave de",
    growthSoftBody:
      "Hay expansion, pero el ritmo todavia no es lo bastante fuerte como para verse amplio.",
    growthNegative: "Contraccion de",
    growthNegativeBody:
      "Un crecimiento negativo es una senal de cautela para demanda, margenes y condiciones financieras.",
    inflationNoData: "La inflacion no esta disponible para este pais.",
    inflationLow: "Presion baja de",
    inflationLowBody: "Los precios lucen contenidos, algo mas amigable para planificacion y margenes.",
    inflationContained: "Contenido en",
    inflationContainedBody:
      "La inflacion existe, pero sigue en un rango manejable para muchas empresas.",
    inflationElevated: "Elevado en",
    inflationElevatedBody:
      "La presion de precios ya afecta precios finales, salarios y retornos reales.",
    inflationSevere: "Presion severa de",
    inflationSevereBody:
      "Una inflacion alta suele implicar peor visibilidad sobre costos, demanda y financiamiento.",
    fundingNoData: "Las tasas de corto plazo no estan disponibles para este pais.",
    fundingEasy: "Fondeo holgado de",
    fundingEasyBody:
      "Las condiciones de credito lucen relativamente livianas frente a mercados mas restrictivos.",
    fundingModerate: "Presion moderada de",
    fundingModerateBody:
      "El capital no es barato, pero sigue siendo un entorno util de financiamiento.",
    fundingTight: "Restrictivo en",
    fundingTightBody:
      "Tasas de corto plazo mas altas pueden presionar apalancamiento, capital de trabajo y demanda.",
    fundingVeryTight: "Muy restrictivo en",
    fundingVeryTightBody:
      "Es un entorno de financiamiento restrictivo para empresas e inversores sensibles al credito.",
    debtNoReported: "Sin presion de deuda reportada",
    debtNoReportedSource: "Sin fuente",
    debtNoReportedBody: "La cobertura de deuda falta para este pais por ahora.",
    debtProxy: "Proxy de presion de deuda",
    debtProxySource: "Proxy FMI",
    debtProxyBody: "Proxy del FMI para deuda bruta del gobierno como porcentaje del PIB.",
    debtReportedNotNormalized: "Deuda reportada, pero no normalizada",
    debtReportedNotNormalizedSource: "World Bank",
    debtReportedNotNormalizedBody:
      "Tenemos deuda en dolares, pero todavia no hay suficiente data para normalizarla.",
    debtDerivedSource: "Derivado de deuda y PIB",
    debtDerivedBodyHigh: "La presion de deuda luce pesada y merece cautela en la planificacion financiera.",
    debtDerivedBodyMid: "La presion de deuda es visible y conviene seguirla frente a pares.",
    debtDerivedBodyLow: "La deuda luce manejable, pero sigue siendo relevante para filtrar riesgo.",
    debtDerivedBodyLight: "La presion de deuda luce liviana frente al producto.",
  },
} as const;

function toneClasses(tone: SignalTone) {
  if (tone === "good") return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
  if (tone === "warn") return "border-amber-400/30 bg-amber-500/10 text-amber-300";
  if (tone === "risk") return "border-rose-400/30 bg-rose-500/10 text-rose-300";
  return "border-slate-400/30 bg-slate-500/10 text-slate-300";
}

function latestMetricValue(metric: MetricSnapshot) {
  return metric.value;
}

function resolveDebtPressure(profile: CountryProfile, locale: Locale) {
  const t = copy[locale];
  const debtMetric = profile.metrics.externalDebt;
  const gdpMetric = profile.metrics.gdp;

  if (debtMetric.value == null) {
    return {
      value: null as number | null,
      label: t.debtNoReported,
      source: debtMetric.sourceName ?? t.debtNoReportedSource,
      note: t.debtNoReportedBody,
      tone: "neutral" as SignalTone,
    };
  }

  if (debtMetric.label === "Debt proxy" || debtMetric.sourceProvider === "imf") {
    return {
      value: debtMetric.value,
      label: t.debtProxy,
      source: debtMetric.sourceName ?? t.debtProxySource,
      note: t.debtProxyBody,
      tone: debtMetric.value >= 90 ? ("risk" as SignalTone) : debtMetric.value >= 60 ? ("warn" as SignalTone) : ("neutral" as SignalTone),
    };
  }

  if (gdpMetric.value == null || gdpMetric.value <= 0) {
    return {
      value: null as number | null,
      label: t.debtReportedNotNormalized,
      source: debtMetric.sourceName ?? t.debtReportedNotNormalizedSource,
      note: t.debtReportedNotNormalizedBody,
      tone: "neutral" as SignalTone,
    };
  }

  const pressure = (debtMetric.value / gdpMetric.value) * 100;
  return {
    value: pressure,
    label: t.debt,
    source: t.debtDerivedSource,
    note: t.debtDerivedBodyLow,
    tone: pressure >= 90 ? ("risk" as SignalTone) : pressure >= 60 ? ("warn" as SignalTone) : pressure >= 30 ? ("neutral" as SignalTone) : ("good" as SignalTone),
  };
}

function classifyGrowth(metric: MetricSnapshot, locale: Locale): SignalCard {
  const t = copy[locale];
  const value = latestMetricValue(metric);
  if (value == null) {
    return {
      title: t.growth,
      headline: t.noData,
      description: t.growthNoData,
      footnote: metric.sourceName ?? t.coverageMissing,
      tone: "neutral",
    };
  }

  if (value >= 5) {
    return {
      title: t.growth,
      headline: `${t.growthStrong} ${formatPercent(value)}`,
      description: t.growthStrongBody,
      footnote: metric.sourceName ?? t.latestRelease,
      tone: "good",
    };
  }

  if (value >= 2) {
    return {
      title: t.growth,
      headline: `${t.growthHealthy} ${formatPercent(value)}`,
      description: t.growthHealthyBody,
      footnote: metric.sourceName ?? t.latestRelease,
      tone: "good",
    };
  }

  if (value >= 0) {
    return {
      title: t.growth,
      headline: `${t.growthSoft} ${formatPercent(value)}`,
      description: t.growthSoftBody,
      footnote: metric.sourceName ?? t.latestRelease,
      tone: "warn",
    };
  }

  return {
    title: t.growth,
    headline: `${t.growthNegative} ${formatPercent(value)}`,
    description: t.growthNegativeBody,
    footnote: metric.sourceName ?? t.latestRelease,
    tone: "risk",
  };
}

function classifyInflation(metric: MetricSnapshot, locale: Locale): SignalCard {
  const t = copy[locale];
  const value = latestMetricValue(metric);
  if (value == null) {
    return {
      title: t.inflation,
      headline: t.noData,
      description: t.inflationNoData,
      footnote: metric.sourceName ?? t.coverageMissing,
      tone: "neutral",
    };
  }

  if (value <= 3) {
    return {
      title: t.inflation,
      headline: `${t.inflationLow} ${formatPercent(value)}`,
      description: t.inflationLowBody,
      footnote: metric.sourceName ?? t.latestRelease,
      tone: "good",
    };
  }

  if (value <= 8) {
    return {
      title: t.inflation,
      headline: `${t.inflationContained} ${formatPercent(value)}`,
      description: t.inflationContainedBody,
      footnote: metric.sourceName ?? t.latestRelease,
      tone: "warn",
    };
  }

  if (value <= 15) {
    return {
      title: t.inflation,
      headline: `${t.inflationElevated} ${formatPercent(value)}`,
      description: t.inflationElevatedBody,
      footnote: metric.sourceName ?? t.latestRelease,
      tone: "risk",
    };
  }

  return {
    title: t.inflation,
    headline: `${t.inflationSevere} ${formatPercent(value)}`,
    description: t.inflationSevereBody,
    footnote: metric.sourceName ?? t.latestRelease,
    tone: "risk",
  };
}

function classifyFinancing(metric: MetricSnapshot, locale: Locale): SignalCard {
  const t = copy[locale];
  const value = latestMetricValue(metric);
  if (value == null) {
    return {
      title: t.funding,
      headline: t.noData,
      description: t.fundingNoData,
      footnote: metric.sourceName ?? t.coverageMissing,
      tone: "neutral",
    };
  }

  const sourceNote = metric.label === "Interest-rate proxy" ? t.proxyRate : metric.sourceName ?? t.latestRelease;

  if (value <= 3) {
    return {
      title: t.funding,
      headline: `${t.fundingEasy} ${formatPercent(value)}`,
      description: t.fundingEasyBody,
      footnote: sourceNote,
      tone: "good",
    };
  }

  if (value <= 6) {
    return {
      title: t.funding,
      headline: `${t.fundingModerate} ${formatPercent(value)}`,
      description: t.fundingModerateBody,
      footnote: sourceNote,
      tone: "warn",
    };
  }

  if (value <= 10) {
    return {
      title: t.funding,
      headline: `${t.fundingTight} ${formatPercent(value)}`,
      description: t.fundingTightBody,
      footnote: sourceNote,
      tone: "risk",
    };
  }

  return {
    title: t.funding,
    headline: `${t.fundingVeryTight} ${formatPercent(value)}`,
    description: t.fundingVeryTightBody,
    footnote: sourceNote,
    tone: "risk",
  };
}

function classifyDebt(profile: CountryProfile, locale: Locale): SignalCard {
  const t = copy[locale];
  const debt = resolveDebtPressure(profile, locale);
  if (debt.value == null) {
    return {
      title: t.debt,
      headline: debt.label,
      description: debt.note,
      footnote: debt.source,
      tone: debt.tone,
    };
  }

  return {
    title: t.debt,
    headline: `${debt.label} ${locale === "es" ? "en" : "at"} ${formatPercent(debt.value)}`,
    description:
      debt.value >= 90
        ? t.debtDerivedBodyHigh
        : debt.value >= 60
          ? t.debtDerivedBodyMid
          : debt.value >= 30
            ? t.debtDerivedBodyLow
            : t.debtDerivedBodyLight,
    footnote: debt.source,
    tone: debt.tone,
  };
}

function SignalGrid({
  eyebrow,
  title,
  description,
  cards,
  locale,
}: {
  eyebrow: string;
  title: string;
  description: string;
  cards: SignalCard[];
  locale: Locale;
}) {
  return (
    <section className="mt-10">
      <div className="mb-5 max-w-3xl">
        <div className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{eyebrow}</div>
        <h2 className="mt-2 font-display text-3xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={`${card.title}-${card.headline}`} className="h-full">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">{card.title}</CardTitle>
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide",
                    toneClasses(card.tone),
                  )}
                >
                  {copy[locale].tone[card.tone]}
                </span>
              </div>
              <CardDescription className="text-sm text-muted-foreground">{card.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-semibold tracking-tight">{card.headline}</div>
              <p className="text-xs text-muted-foreground">{card.footnote}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function CountryFinancialSignals({
  profile,
  locale = "en",
}: {
  profile: CountryProfile;
  locale?: Locale;
}) {
  const t = copy[locale];

  return (
    <SignalGrid
      eyebrow={t.practicalSignals}
      title={t.countryTitle}
      description={t.countryDescription}
      cards={[
        classifyGrowth(profile.metrics.gdpGrowth, locale),
        classifyInflation(profile.metrics.inflation, locale),
        classifyFinancing(profile.metrics.interestRate, locale),
        classifyDebt(profile, locale),
      ]}
      locale={locale}
    />
  );
}

function chooseBest<T>(items: T[], selector: (item: T) => number | null, direction: "max" | "min") {
  let bestItem: T | null = null;
  let bestValue: number | null = null;

  for (const item of items) {
    const value = selector(item);
    if (value == null) continue;

    if (bestValue == null || (direction === "max" ? value > bestValue : value < bestValue)) {
      bestItem = item;
      bestValue = value;
    }
  }

  return bestItem && bestValue != null ? { item: bestItem, value: bestValue } : null;
}

export function CompareFinancialSignals({
  profiles,
  locale = "en",
}: {
  profiles: CountryProfile[];
  locale?: Locale;
}) {
  const isEs = locale === "es";
  const growthLeader = chooseBest(profiles, (profile) => profile.metrics.gdpGrowth.value, "max");
  const inflationLeader = chooseBest(profiles, (profile) => profile.metrics.inflation.value, "min");
  const financingLeader = chooseBest(profiles, (profile) => profile.metrics.interestRate.value, "min");
  const debtLeader = chooseBest(
    profiles,
    (profile) => {
      const debt = resolveDebtPressure(profile, "en");
      return debt.value;
    },
    "min",
  );

  const cards: SignalCard[] = [
    growthLeader
      ? {
          title: isEs ? "Lider en crecimiento" : "Growth leader",
          headline: isEs
            ? `${growthLeader.item.country.name} lidera con ${formatPercent(growthLeader.value)}`
            : `${growthLeader.item.country.name} leads with ${formatPercent(growthLeader.value)}`,
          description: isEs
            ? "Es la senal de crecimiento actual mas fuerte dentro del grupo seleccionado."
            : "This is the strongest current growth signal in the selected comparison set.",
          footnote: isEs
            ? `Ultimo crecimiento del PIB de ${growthLeader.item.country.name}`
            : `Latest GDP growth for ${growthLeader.item.country.name}`,
          tone: "good",
        }
      : {
          title: isEs ? "Lider en crecimiento" : "Growth leader",
          headline: isEs ? "Sin datos" : "No data",
          description: isEs
            ? "No hay datos de crecimiento disponibles entre los paises seleccionados."
            : "Growth data is not available across the selected countries.",
          footnote: isEs ? "Cobertura limitada" : "Coverage limited",
          tone: "neutral",
        },
    inflationLeader
      ? {
          title: isEs ? "Estabilidad de precios" : "Price stability",
          headline: isEs
            ? `${inflationLeader.item.country.name} es el mas bajo con ${formatPercent(inflationLeader.value)}`
            : `${inflationLeader.item.country.name} is lowest at ${formatPercent(inflationLeader.value)}`,
          description: isEs
            ? "Una inflacion mas baja suele ser mas amigable para planificacion, precios y retornos reales."
            : "Lower inflation tends to be friendlier for planning, pricing, and real returns.",
          footnote: isEs
            ? `Ultima inflacion de ${inflationLeader.item.country.name}`
            : `Latest inflation for ${inflationLeader.item.country.name}`,
          tone: "good",
        }
      : {
          title: isEs ? "Estabilidad de precios" : "Price stability",
          headline: isEs ? "Sin datos" : "No data",
          description: isEs
            ? "La inflacion no esta disponible para los paises seleccionados."
            : "Inflation data is not available for the selected countries.",
          footnote: isEs ? "Cobertura limitada" : "Coverage limited",
          tone: "neutral",
        },
    financingLeader
      ? {
          title: isEs ? "Costo de fondeo" : "Funding cost",
          headline: isEs
            ? `${financingLeader.item.country.name} es el mas bajo con ${formatPercent(financingLeader.value)}`
            : `${financingLeader.item.country.name} is lowest at ${formatPercent(financingLeader.value)}`,
          description: isEs
            ? "Tasas mas bajas suelen implicar menos presion financiera y mejores condiciones de credito."
            : "Lower rates usually mean less financing pressure and easier credit conditions.",
          footnote:
            financingLeader.item.metrics.interestRate.label === "Interest-rate proxy"
              ? isEs ? "Tasa prestable proxy" : "Proxy lending rate"
              : financingLeader.item.metrics.interestRate.sourceName ?? (isEs ? "Ultima publicacion" : "Latest release"),
          tone: "good",
        }
      : {
          title: isEs ? "Costo de fondeo" : "Funding cost",
          headline: isEs ? "Sin datos" : "No data",
          description: isEs
            ? "Las tasas de corto plazo no estan disponibles para los paises seleccionados."
            : "Short-term rates are not available for the selected countries.",
          footnote: isEs ? "Cobertura limitada" : "Coverage limited",
          tone: "neutral",
        },
    debtLeader
      ? {
          title: isEs ? "Presion de deuda" : "Debt pressure",
          headline: isEs
            ? `${debtLeader.item.country.name} es el mas liviano con ${formatPercent(debtLeader.value)}`
            : `${debtLeader.item.country.name} is lightest at ${formatPercent(debtLeader.value)}`,
          description: isEs
            ? "Menor presion de deuda suele dejar mas margen para politica y flexibilidad financiera."
            : "Lower debt pressure generally leaves more room for policy and financing flexibility.",
          footnote: isEs
            ? "Derivado de deuda y PIB, o proxy del FMI cuando hace falta"
            : "Derived from debt and GDP, or IMF proxy where needed",
          tone: "good",
        }
      : {
          title: isEs ? "Presion de deuda" : "Debt pressure",
          headline: isEs ? "Sin datos" : "No data",
          description: isEs
            ? "La cobertura de deuda es demasiado escasa para construir una comparacion limpia ahora."
            : "Debt coverage is too sparse to build a clean comparison right now.",
          footnote: isEs ? "Cobertura limitada" : "Coverage limited",
          tone: "neutral",
        },
  ];

  const description = isEs
    ? `${profiles.length} paises seleccionados. Las senales practicas se enfocan en los ultimos valores disponibles y marcan proxies cuando falta la serie exacta.`
    : `${profiles.length} countries selected. Practical signals focus on the latest available values and mark proxies when the exact series is missing.`;

  return (
    <SignalGrid
      eyebrow={isEs ? "Lente de decision" : "Decision lens"}
      title={isEs ? "Lo que mas importa para finanzas y asignacion" : "What matters most for finance and allocation"}
      description={description}
      cards={cards}
      locale={locale}
    />
  );
}
