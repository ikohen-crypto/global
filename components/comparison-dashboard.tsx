"use client";

import { useMemo, useState } from "react";

import { ChartCard } from "@/components/chart-card";
import { CompareSummary } from "@/components/compare-summary";
import { DataQualityBadges } from "@/components/data-quality-badges";
import { useI18n } from "@/components/i18n-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trackEvent } from "@/lib/analytics";
import { generateComparisonInsights } from "@/lib/insights";
import type { Locale } from "@/lib/i18n";
import type { ComparisonCountry, IndicatorId } from "@/lib/types";
import { cn } from "@/lib/utils";

const chartColors = ["#0f766e", "#2563eb", "#f59e0b", "#db2777", "#7c3aed", "#65a30d"];

const rangeOptions = {
  "10": 10,
  "20": 20,
  "30": 30,
  max: 70,
} as const;

const indicatorLabels = {
  en: {
    gdp: "GDP",
    gdpPerCapita: "GDP per capita",
    inflation: "Inflation",
    unemployment: "Unemployment",
    population: "Population",
    gdpGrowth: "GDP growth",
    interestRate: "Short-term rate",
    externalDebt: "External debt",
    co2PerCapita: "CO2 per capita",
    lifeExpectancy: "Life expectancy",
    range: "Range",
    chart: "Chart",
    line: "Line",
    bar: "Bar",
    years10: "10 years",
    years20: "20 years",
    years30: "30 years",
    max: "Max",
    latestValue: "Latest value",
    coverageShown: "Coverage shown",
    indicatorsNote:
      "Indicators with slower publication cycles can expose newer calendar years with null values, so the chart only shows the latest non-null period with actual data.",
    metadataUpdated: "Source metadata last updated",
    noData: "No data",
  },
  es: {
    gdp: "PIB",
    gdpPerCapita: "PIB per capita",
    inflation: "Inflacion",
    unemployment: "Desempleo",
    population: "Poblacion",
    gdpGrowth: "Crecimiento del PIB",
    interestRate: "Tasa de corto plazo",
    externalDebt: "Deuda externa",
    co2PerCapita: "CO2 per capita",
    lifeExpectancy: "Esperanza de vida",
    range: "Rango",
    chart: "Grafico",
    line: "Linea",
    bar: "Barras",
    years10: "10 anos",
    years20: "20 anos",
    years30: "30 anos",
    max: "Maximo",
    latestValue: "Ultimo valor",
    coverageShown: "Cobertura mostrada",
    indicatorsNote:
      "Los indicadores con ciclos de publicacion mas lentos pueden exponer anos calendario mas nuevos con valores nulos, por eso el grafico solo muestra el ultimo periodo no nulo con datos reales.",
    metadataUpdated: "Metadata de fuente actualizada por ultima vez",
    noData: "Sin datos",
  },
} as const;

export function ComparisonDashboard({
  countries,
  locale = "en",
}: {
  countries: ComparisonCountry[];
  locale?: Locale;
}) {
  const { messages } = useI18n();
  const labels = indicatorLabels[locale];
  const [indicatorId, setIndicatorId] = useState<IndicatorId>("inflation");
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [range, setRange] = useState<keyof typeof rangeOptions>("10");

  const chartRows = useMemo(() => {
    const years = new Set<number>();
    countries.forEach((country) => {
      country.metrics[indicatorId]?.points.forEach((point) => years.add(point.year));
    });

    const sortedYears = [...years].sort((a, b) => a - b);
    const lastYears = sortedYears.slice(-rangeOptions[range]);

    return lastYears
      .map((year) => {
        const row: Record<string, number | null> & { year: number } = { year };
        countries.forEach((country) => {
          row[country.country.slug] =
            country.metrics[indicatorId]?.points.find((point) => point.year === year)?.value ?? null;
        });
        return row;
      })
      .filter((row) =>
        countries.some((country) => row[country.country.slug] != null),
      );
  }, [countries, indicatorId, range]);

  const countriesWithSeries = useMemo(
    () =>
      countries.filter((country) =>
        chartRows.some((row) => row[country.country.slug] != null),
      ),
    [chartRows, countries],
  );

  const countriesWithoutSeries = useMemo(
    () =>
      countries.filter(
        (country) => !chartRows.some((row) => row[country.country.slug] != null),
      ),
    [chartRows, countries],
  );

  const insights = useMemo(() => generateComparisonInsights(countries, locale), [countries, locale]);
  const latestAvailableYear = useMemo(() => {
    const years = countries
      .map((country) => country.metrics[indicatorId]?.latestYear ?? null)
      .filter((year): year is number => year != null);

    return years.length > 0 ? Math.max(...years) : null;
  }, [countries, indicatorId]);
  const latestAvailableLabel = useMemo(() => {
    const labels = countries
      .map((country) => country.metrics[indicatorId]?.latestAvailableLabel ?? null)
      .filter((value): value is string => Boolean(value))
      .sort();

    return labels.at(-1) ?? null;
  }, [countries, indicatorId]);

  const sourceLastUpdated = useMemo(() => {
    const updates = countries
      .map((country) => country.metrics[indicatorId]?.sourceLastUpdated ?? null)
      .filter((value): value is string => Boolean(value));

    return updates.sort().at(-1) ?? null;
  }, [countries, indicatorId]);
  const sourceName = useMemo(() => {
    const names = countries
      .map((country) => country.metrics[indicatorId]?.sourceName ?? null)
      .filter((value): value is string => Boolean(value));

    return names[0] ?? null;
  }, [countries, indicatorId]);
  const sourceProvider = useMemo(() => {
    const providers = countries
      .map((country) => country.metrics[indicatorId]?.sourceProvider ?? null)
      .filter((value): value is "worldBank" | "imf" | "oecd" | "national" | "un" => value != null);

    return providers[0] ?? null;
  }, [countries, indicatorId]);
  const frequency = useMemo(() => {
    const frequencies = countries
      .map((country) => country.metrics[indicatorId]?.frequency ?? null)
      .filter((value): value is "annual" | "quarterly" | "monthly" => value != null);

    return frequencies[0] ?? null;
  }, [countries, indicatorId]);
  const coverageStartYear = useMemo(() => {
    const years = countries
      .map((country) => country.metrics[indicatorId]?.coverageStartYear ?? null)
      .filter((year): year is number => year != null);

    return years.length > 0 ? Math.min(...years) : null;
  }, [countries, indicatorId]);
  const coverageEndYear = useMemo(() => {
    const years = countries
      .map((country) => country.metrics[indicatorId]?.coverageEndYear ?? null)
      .filter((year): year is number => year != null);

    return years.length > 0 ? Math.max(...years) : null;
  }, [countries, indicatorId]);

  return (
    <div className="space-y-6">
      <div className="sticky top-24 z-20 flex flex-wrap gap-3 rounded-[1.75rem] border border-border bg-background/90 p-4 backdrop-blur">
        <div className="w-48">
          <Select
            value={indicatorId}
            onValueChange={(value) => setIndicatorId(value as IndicatorId)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Indicator" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gdp">{labels.gdp}</SelectItem>
              <SelectItem value="gdpPerCapita">{labels.gdpPerCapita}</SelectItem>
              <SelectItem value="inflation">{labels.inflation}</SelectItem>
              <SelectItem value="unemployment">{labels.unemployment}</SelectItem>
              <SelectItem value="population">{labels.population}</SelectItem>
              <SelectItem value="gdpGrowth">{labels.gdpGrowth}</SelectItem>
              <SelectItem value="interestRate">{labels.interestRate}</SelectItem>
              <SelectItem value="externalDebt">{labels.externalDebt}</SelectItem>
              <SelectItem value="co2PerCapita">{labels.co2PerCapita}</SelectItem>
              <SelectItem value="lifeExpectancy">{labels.lifeExpectancy}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-40">
          <Select
            value={range}
            onValueChange={(value) => {
              setRange(value as keyof typeof rangeOptions);
              trackEvent("chart_range_changed", { range: value });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={labels.range} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">{labels.years10}</SelectItem>
              <SelectItem value="20">{labels.years20}</SelectItem>
              <SelectItem value="30">{labels.years30}</SelectItem>
              <SelectItem value="max">{labels.max}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-40">
          <Select value={chartType} onValueChange={(value) => setChartType(value as "line" | "bar")}>
            <SelectTrigger>
              <SelectValue placeholder={labels.chart} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">{labels.line}</SelectItem>
              <SelectItem value="bar">{labels.bar}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <CompareSummary insights={insights} />
      <ChartCard
        title={messages.chart.historicalComparison}
        data={chartRows}
        type={chartType}
        seriesKeys={countriesWithSeries.map((country, index) => ({
          key: country.country.slug,
          color: chartColors[index % chartColors.length],
        }))}
      />
      {countriesWithoutSeries.length > 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
          {messages.chart.hiddenSeriesPrefix}{" "}
          <strong>{countriesWithoutSeries.map((country) => country.country.name).join(", ")}</strong>
          {" "}{messages.chart.hiddenSeriesSuffix}
        </div>
      ) : null}
      <div className="rounded-2xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        {labels.coverageShown}: <strong>{coverageStartYear ?? "N/A"}-{coverageEndYear ?? "N/A"}</strong>.
        {" "}
        {messages.common.latestPeriod}: <strong>{latestAvailableLabel ?? latestAvailableYear ?? "N/A"}</strong>.
        {" "}
        {sourceProvider ? (
          <span
            className={cn(
              "mr-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
              sourceProvider === "oecd" && "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
              sourceProvider === "un" && "border-violet-400/30 bg-violet-500/10 text-violet-300",
              sourceProvider === "worldBank" && "border-sky-400/30 bg-sky-500/10 text-sky-300",
              sourceProvider === "imf" && "border-amber-400/30 bg-amber-500/10 text-amber-300",
              sourceProvider === "national" && "border-zinc-400/30 bg-zinc-500/10 text-zinc-300",
            )}
          >
            {sourceProvider === "oecd"
              ? "OECD"
              : sourceProvider === "un"
                ? "UN"
              : sourceProvider === "worldBank"
                ? "World Bank"
                : sourceProvider === "imf"
                  ? "IMF"
                  : "Metadata"}
          </span>
        ) : null}
        {sourceName ? `Source: ${sourceName}. ` : ""}
        {frequency ? `Frequency: ${frequency}. ` : ""}
        {sourceLastUpdated ? `${labels.metadataUpdated}: ${sourceLastUpdated}. ` : ""}
        {labels.indicatorsNote}
        <DataQualityBadges
          freshnessStatus={countries.find((country) => country.metrics[indicatorId])?.metrics[indicatorId]?.freshnessStatus ?? null}
          qualityFlags={countries.find((country) => country.metrics[indicatorId])?.metrics[indicatorId]?.qualityFlags ?? []}
          className="mt-3"
          locale={locale}
        />
      </div>
      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3">{messages.common.country}</th>
              <th className="px-4 py-3">{labels.latestValue}</th>
              <th className="px-4 py-3">{messages.common.latestPeriod}</th>
              <th className="px-4 py-3">{messages.common.source}</th>
            </tr>
          </thead>
          <tbody>
            {countries.map((country) => (
              <tr key={country.country.iso3} className="border-t border-border">
                <td className="px-4 py-3">{country.country.name}</td>
                <td className="px-4 py-3">{country.metrics[indicatorId]?.latestValue?.toLocaleString() ?? labels.noData}</td>
                <td className="px-4 py-3">{country.metrics[indicatorId]?.latestAvailableLabel ?? "N/A"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {country.metrics[indicatorId]?.sourceProvider ? (
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
                          country.metrics[indicatorId]?.sourceProvider === "oecd" &&
                            "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
                          country.metrics[indicatorId]?.sourceProvider === "un" &&
                            "border-violet-400/30 bg-violet-500/10 text-violet-300",
                          country.metrics[indicatorId]?.sourceProvider === "worldBank" &&
                            "border-sky-400/30 bg-sky-500/10 text-sky-300",
                          country.metrics[indicatorId]?.sourceProvider === "imf" &&
                            "border-amber-400/30 bg-amber-500/10 text-amber-300",
                          country.metrics[indicatorId]?.sourceProvider === "national" &&
                            "border-zinc-400/30 bg-zinc-500/10 text-zinc-300",
                        )}
                      >
                        {country.metrics[indicatorId]?.sourceProvider === "oecd"
                          ? "OECD"
                          : country.metrics[indicatorId]?.sourceProvider === "un"
                            ? "UN"
                          : country.metrics[indicatorId]?.sourceProvider === "worldBank"
                            ? "World Bank"
                            : country.metrics[indicatorId]?.sourceProvider === "imf"
                              ? "IMF"
                              : "Metadata"}
                      </span>
                    ) : null}
                    <span>{country.metrics[indicatorId]?.sourceName ?? "N/A"}</span>
                    <DataQualityBadges
                      freshnessStatus={country.metrics[indicatorId]?.freshnessStatus ?? null}
                      qualityFlags={country.metrics[indicatorId]?.qualityFlags ?? []}
                      locale={locale}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
