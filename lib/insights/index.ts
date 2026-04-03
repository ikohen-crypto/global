import { getIndicatorDefinition } from "@/lib/indicators/registry";
import type { Locale } from "@/lib/i18n";
import type { ComparisonCountry, IndicatorId, Insight } from "@/lib/types";

function latestValue(country: ComparisonCountry, indicatorId: IndicatorId) {
  return country.metrics[indicatorId]?.latestValue ?? null;
}

function growthOverRange(country: ComparisonCountry, indicatorId: IndicatorId) {
  const points = country.metrics[indicatorId]?.points.filter((point) => point.value != null) ?? [];
  if (points.length < 2) return null;
  const first = points[0].value ?? null;
  const last = points[points.length - 1].value ?? null;
  if (first == null || last == null || first === 0) return null;
  return ((last - first) / Math.abs(first)) * 100;
}

export function generateComparisonInsights(countries: ComparisonCountry[], locale: Locale = "en"): Insight[] {
  if (countries.length < 2) return [];

  const insights: Insight[] = [];

  const byGdpPerCapita = [...countries]
    .map((country) => ({ country, value: latestValue(country, "gdpPerCapita") }))
    .filter((entry) => entry.value != null)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  if (byGdpPerCapita.length > 0) {
    const leader = byGdpPerCapita[0];
    insights.push({
      id: "gdp-per-capita-leader",
      title:
        locale === "es"
          ? `${leader.country.country.name} es el mercado de mayor ingreso en este grupo`
          : `${leader.country.country.name} is the higher-income market in this set`,
      body:
        locale === "es"
          ? `${leader.country.country.name} lidera actualmente en ${getIndicatorDefinition("gdpPerCapita").shortLabel.toLowerCase()}, algo util cuando la comparacion se enfoca en poder adquisitivo, demanda premium o calidad de mercado.`
          : `${leader.country.country.name} currently leads on ${getIndicatorDefinition("gdpPerCapita").shortLabel.toLowerCase()}, which is useful when the comparison is about purchasing power, premium demand, or market quality.`,
    });
  }

  const byGrowth = [...countries]
    .map((country) => ({ country, value: growthOverRange(country, "gdp") }))
    .filter((entry) => entry.value != null)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  if (byGrowth.length > 0) {
    const leader = byGrowth[0];
    insights.push({
      id: "gdp-growth-over-range",
      title:
        locale === "es"
          ? `${leader.country.country.name} muestra el impulso de crecimiento mas fuerte`
          : `${leader.country.country.name} carries the strongest growth momentum`,
      body:
        locale === "es"
          ? `${leader.country.country.name} muestra la mayor expansion total del PIB en el periodo seleccionado, algo importante si te interesa la exposicion ciclica o el potencial de expansion.`
          : `${leader.country.country.name} shows the strongest total GDP expansion over the selected period, which matters when you care about cyclical exposure or expansion potential.`,
    });
  }

  const byInflation = [...countries]
    .map((country) => ({ country, value: latestValue(country, "inflation") }))
    .filter((entry) => entry.value != null)
    .sort((a, b) => (a.value ?? 0) - (b.value ?? 0));

  if (byInflation.length > 0) {
    const leader = byInflation[0];
    insights.push({
      id: "inflation-stability",
      title:
        locale === "es"
          ? `${leader.country.country.name} tiene el contexto inflacionario mas limpio`
          : `${leader.country.country.name} has the cleanest inflation backdrop`,
      body:
        locale === "es"
          ? `${leader.country.country.name} reporta la menor inflacion reciente del grupo, lo que reduce el riesgo de mayor endurecimiento monetario y ayuda a preservar retornos reales.`
          : `${leader.country.country.name} reports the lowest latest inflation reading in this group, which lowers policy-tightening risk and helps preserve real returns.`,
    });
  }

  const byPopulation = [...countries]
    .map((country) => ({ country, value: latestValue(country, "population") }))
    .filter((entry) => entry.value != null)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  if (byPopulation.length > 0) {
    const leader = byPopulation[0];
    insights.push({
      id: "population-scale",
      title:
        locale === "es"
          ? `${leader.country.country.name} ofrece la mayor escala de mercado`
          : `${leader.country.country.name} offers the largest market scale`,
      body:
        locale === "es"
          ? `El tamano poblacional influye en oferta laboral y demanda total direccionable, y ${leader.country.country.name} es el mercado mas grande de esta comparacion por poblacion.`
          : `Population size shapes labor supply and total addressable demand, and ${leader.country.country.name} is the largest market in this comparison by population.`,
    });
  }

  return insights.slice(0, 4);
}
