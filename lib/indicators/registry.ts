import {
  formatCurrencyShort,
  formatNumber,
  formatPercent,
  formatPopulation,
} from "@/lib/formatters";
import type {
  ChartSuitability,
  FeatureGateId,
  IndicatorCategory,
  IndicatorId,
  IndicatorSourceMetadata,
  IndicatorUnit,
} from "@/lib/types";

export type IndicatorDefinition = {
  id: IndicatorId;
  shortLabel: string;
  fullLabel: string;
  category: IndicatorCategory;
  unit: IndicatorUnit;
  formatter: (value: number | null) => string;
  description: string;
  interpretation: string;
  caveats: string;
  lagNote: string;
  seoSummary: string;
  chartSuitability: ChartSuitability[];
  sources: {
    primary: IndicatorSourceMetadata;
    fallback?: IndicatorSourceMetadata[];
  };
  premiumGate?: FeatureGateId;
};

function buildWorldBankSource(
  sourceCode: string,
  options?: Partial<
    Pick<
      IndicatorSourceMetadata,
      "expectedStartYear" | "expectedEndYear" | "notes" | "frequency" | "sourceId"
    >
  >,
): IndicatorSourceMetadata {
  return {
    provider: "worldBank",
    sourceName: "World Bank",
    sourceCode,
    sourceId: options?.sourceId ?? null,
    frequency: options?.frequency ?? "annual",
    expectedStartYear: options?.expectedStartYear ?? 1960,
    expectedEndYear: options?.expectedEndYear ?? "latest-available",
    comparableAcrossCountries: true,
    notes: options?.notes ?? null,
  };
}

export const indicatorRegistry: Record<IndicatorId, IndicatorDefinition> = {
  gdp: {
    id: "gdp",
    shortLabel: "GDP",
    fullLabel: "Gross domestic product (current US$)",
    category: "economy",
    unit: "usd",
    formatter: formatCurrencyShort,
    description:
      "GDP measures the total market value of goods and services produced within a country in a year.",
    interpretation:
      "Higher GDP often means a larger economy, but it says little about living standards on its own.",
    caveats:
      "GDP can rise with inflation and may not reflect inequality, informal activity, or environmental costs.",
    lagNote: "GDP data is commonly reported with a lag of one year or more.",
    seoSummary: "Compare total economic output across countries using official World Bank GDP data.",
    chartSuitability: ["line", "bar", "indexed"],
    sources: {
      primary: {
        provider: "imf",
        sourceName: "IMF WEO GDP (current US$, includes estimates/projections)",
        sourceCode: "NGDPD",
        frequency: "annual",
        expectedStartYear: 1980,
        expectedEndYear: "latest-available",
        comparableAcrossCountries: true,
        notes:
          "Preferred for fresher cross-country GDP levels when World Bank annual releases lag. Includes IMF estimates and projections.",
      },
      fallback: [buildWorldBankSource("NY.GDP.MKTP.CD")],
    },
  },
  gdpPerCapita: {
    id: "gdpPerCapita",
    shortLabel: "GDP per capita",
    fullLabel: "GDP per capita (current US$)",
    category: "economy",
    unit: "usd_per_capita",
    formatter: formatCurrencyShort,
    description:
      "GDP per capita divides total output by population to estimate average economic output per person.",
    interpretation:
      "Higher values often indicate greater average income potential, though distribution still matters.",
    caveats:
      "GDP per capita is an average and does not capture inequality or non-market wellbeing.",
    lagNote: "GDP per capita generally follows GDP publication schedules with a similar lag.",
    seoSummary:
      "See which countries generate the most output per person and how that has changed over time.",
    chartSuitability: ["line", "bar", "indexed"],
    sources: {
      primary: {
        provider: "imf",
        sourceName: "IMF WEO GDP per capita (current US$, includes estimates/projections)",
        sourceCode: "NGDPDPC",
        frequency: "annual",
        expectedStartYear: 1980,
        expectedEndYear: "latest-available",
        comparableAcrossCountries: true,
        notes:
          "Preferred for fresher cross-country GDP per-capita coverage when World Bank annual releases lag. Includes IMF estimates and projections.",
      },
      fallback: [buildWorldBankSource("NY.GDP.PCAP.CD")],
    },
  },
  inflation: {
    id: "inflation",
    shortLabel: "Inflation",
    fullLabel: "Inflation, consumer prices (annual %)",
    category: "prices",
    unit: "percent",
    formatter: formatPercent,
    description:
      "Inflation measures the annual rate at which consumer prices rise across the economy.",
    interpretation:
      "Moderate inflation can signal healthy demand, while very high or negative inflation can indicate instability.",
    caveats:
      "Consumer baskets differ across countries, so inflation is not perfectly comparable everywhere.",
    lagNote: "Inflation data is often available faster than GDP but can still be revised.",
    seoSummary:
      "Track how quickly prices are rising across countries and compare inflation trends over time.",
    chartSuitability: ["line", "bar"],
    sources: {
      primary: {
        provider: "oecd",
        sourceName: "OECD Prices SDMX",
        sourceCode: "DSD_PRICES@DF_PRICES_ALL/CPI.PA.GY",
        frequency: "monthly",
        expectedStartYear: 2000,
        expectedEndYear: "latest-available",
        comparableAcrossCountries: true,
        notes: "Preferred for fresher monthly CPI year-over-year readings where OECD coverage is available.",
      },
      fallback: [
        {
          provider: "imf",
          sourceName: "IMF CPI / IFS",
          sourceCode: "CPI",
          frequency: "monthly",
          expectedStartYear: 2016,
          expectedEndYear: "latest-available",
          comparableAcrossCountries: true,
          notes: "Secondary monthly fallback when OECD coverage is unavailable and IMF credentials are configured.",
        },
        {
          provider: "imf",
          sourceName: "IMF WEO inflation (avg consumer prices; includes estimates/projections)",
          sourceCode: "PCPIPCH",
          frequency: "annual",
          expectedStartYear: 1980,
          expectedEndYear: "latest-available",
          comparableAcrossCountries: true,
          notes:
            "Annual IMF WEO fallback used when monthly OECD or IMF IFS coverage is unavailable or stale for a country.",
        },
        buildWorldBankSource("FP.CPI.TOTL.ZG", {
          notes: "Annual fallback when no monthly provider is available for the selected country.",
        }),
      ],
    },
  },
  unemployment: {
    id: "unemployment",
    shortLabel: "Unemployment",
    fullLabel: "Unemployment, total (% of total labor force)",
    category: "labor",
    unit: "percent",
    formatter: formatPercent,
    description:
      "Unemployment estimates the share of the labor force actively seeking work but not employed.",
    interpretation:
      "Lower unemployment usually reflects stronger labor market conditions, though context matters.",
    caveats:
      "Definitions and survey methods can vary, especially where informal employment is large.",
    lagNote: "Labor market data may be revised and can lag by a year in some economies.",
    seoSummary:
      "Compare labor market slack across countries with unemployment data from the World Bank.",
    chartSuitability: ["line", "bar"],
    sources: {
      primary: {
        provider: "oecd",
        sourceName: "OECD Labour Force Statistics",
        sourceCode: "DSD_LFS@DF_IALFS_UNE_M/UNE_LF_M",
        frequency: "monthly",
        expectedStartYear: 2000,
        expectedEndYear: "latest-available",
        comparableAcrossCountries: true,
        notes: "Seasonally adjusted monthly unemployment rate for total population aged 15 and over.",
      },
      fallback: [
        {
          provider: "imf",
          sourceName: "IMF WEO unemployment rate (includes estimates/projections)",
          sourceCode: "LUR",
          frequency: "annual",
          expectedStartYear: 1980,
          expectedEndYear: "latest-available",
          comparableAcrossCountries: true,
          notes:
            "Annual IMF WEO fallback used when OECD labour coverage is unavailable for the selected country.",
        },
        buildWorldBankSource("SL.UEM.TOTL.ZS"),
      ],
    },
  },
  population: {
    id: "population",
    shortLabel: "Population",
    fullLabel: "Population, total",
    category: "population",
    unit: "people",
    formatter: formatPopulation,
    description:
      "Population captures the total number of people living in a country.",
    interpretation:
      "Population size shapes market scale, labor supply, and pressure on services and infrastructure.",
    caveats:
      "Population counts are estimates and can be revised after census updates.",
    lagNote: "Population data is typically updated annually.",
    seoSummary:
      "See how country population size changes over time and how it shapes economic scale.",
    chartSuitability: ["line", "bar", "indexed"],
    sources: {
      primary: {
        provider: "un",
        sourceName: "UN World Population Prospects 2024",
        sourceCode: "WPP2024/GEN/F01/Estimates",
        frequency: "annual",
        expectedStartYear: 1950,
        expectedEndYear: 2023,
        comparableAcrossCountries: true,
        notes:
          "Preferred annual population estimates from the UN Population Division. Uses the Estimates sheet from WPP 2024.",
      },
      fallback: [
        buildWorldBankSource("SP.POP.TOTL", {
          notes: "Annual fallback when the UN WPP workbook is not available in the deployment.",
        }),
      ],
    },
  },
  gdpGrowth: {
    id: "gdpGrowth",
    shortLabel: "GDP growth",
    fullLabel: "GDP growth (annual %)",
    category: "economy",
    unit: "percent",
    formatter: formatPercent,
    description:
      "GDP growth measures the annual percentage change in inflation-adjusted economic output.",
    interpretation:
      "Higher growth can reflect expansion, but volatile spikes can be misleading without context.",
    caveats:
      "Low-base rebounds and crises can create sharp swings that distort long-term reading.",
    lagNote: "Growth rates depend on real GDP releases and can be revised after benchmark updates.",
    seoSummary:
      "Compare which economies are growing fastest and how resilient their growth has been.",
    chartSuitability: ["line", "bar"],
    sources: {
      primary: {
        provider: "oecd",
        sourceName: "OECD Quarterly National Accounts",
        sourceCode: "DSD_NAMAIN1@DF_QNA_EXPENDITURE_GROWTH_OECD/B1GQ.GY",
        frequency: "quarterly",
        expectedStartYear: 2000,
        expectedEndYear: "latest-available",
        comparableAcrossCountries: true,
        notes: "Seasonally adjusted real GDP growth rate over the same quarter a year earlier.",
      },
      fallback: [
        {
          provider: "imf",
          sourceName: "IMF WEO real GDP growth (includes estimates/projections)",
          sourceCode: "NGDP_RPCH",
          frequency: "annual",
          expectedStartYear: 1980,
          expectedEndYear: "latest-available",
          comparableAcrossCountries: true,
          notes:
            "Annual IMF WEO fallback used when OECD quarterly growth is unavailable or stale for the selected country.",
        },
        buildWorldBankSource("NY.GDP.MKTP.KD.ZG"),
      ],
    },
  },
  interestRate: {
    id: "interestRate",
    shortLabel: "Short-term rate",
    fullLabel: "Short-term interest rates (% per annum)",
    category: "prices",
    unit: "percent",
    formatter: formatPercent,
    description:
      "Short-term interest rates track the cost of very short-duration borrowing and are closely linked to monetary conditions.",
    interpretation:
      "Higher rates usually signal tighter financial conditions, while lower rates tend to support credit and demand.",
    caveats:
      "Market structure and transmission differ by country, so similar policy stances can produce different short-term rates.",
    lagNote: "Short-term rates are typically available monthly and update faster than annual macro aggregates.",
    seoSummary:
      "Track short-term interest-rate conditions across countries with fresher OECD financial market data.",
    chartSuitability: ["line", "bar"],
    sources: {
      primary: {
        provider: "oecd",
        sourceName: "OECD Financial Market",
        sourceCode: "DSD_STES@DF_FINMARK/IR3TIB",
        frequency: "monthly",
        expectedStartYear: 2000,
        expectedEndYear: "latest-available",
        comparableAcrossCountries: true,
        notes: "Monthly short-term interest rates from OECD financial market statistics.",
      },
      fallback: [
        buildWorldBankSource("FR.INR.LEND", {
          notes:
            "Annual lending-rate fallback used as an interest-rate proxy when OECD short-term market rates are not reported for the selected country.",
        }),
      ],
    },
  },
  externalDebt: {
    id: "externalDebt",
    shortLabel: "External debt",
    fullLabel: "External debt stocks, total (DOD, current US$)",
    category: "debt",
    unit: "usd",
    formatter: formatCurrencyShort,
    description:
      "External debt measures the amount owed to nonresidents that requires repayment of principal or interest.",
    interpretation:
      "Higher debt can be manageable for large, productive economies, but rapid accumulation raises risk.",
    caveats:
      "Debt data is incomplete for some countries and should be contextualized with income and reserves.",
    lagNote: "Debt data is often sparse and may lag more than core macro indicators.",
    seoSummary:
      "Review how countries compare on external debt using the closest broadly available World Bank measure.",
    chartSuitability: ["line", "bar", "indexed"],
    sources: {
      primary: buildWorldBankSource("DT.DOD.DECT.CD"),
    },
    premiumGate: "extendedHistory",
  },
  co2PerCapita: {
    id: "co2PerCapita",
    shortLabel: "CO2 per capita",
    fullLabel: "CO2 emissions (metric tons per capita)",
    category: "environment",
    unit: "tons_per_capita",
    formatter: (value) => formatNumber(value, " t"),
    description:
      "CO2 per capita estimates emissions intensity per person and is useful for sustainability comparisons.",
    interpretation:
      "Compare CO2 emissions per capita with GDP per capita to get a rough sustainability lens on development. This is most useful when paired with total emissions and energy mix data.",
    caveats:
      "Per-capita emissions do not capture total emissions, outsourced production, or historical responsibility.",
    lagNote: "Emissions data can lag significantly because measurement relies on compiled energy statistics.",
    seoSummary:
      "Explore the sustainability lens of development by comparing carbon emissions per person.",
    chartSuitability: ["line", "bar", "indexed"],
    sources: {
      primary: buildWorldBankSource("EN.ATM.CO2E.PC", {
        sourceId: "75",
        notes: "World Bank Climate Change Knowledge Portal source for CO2 per-capita coverage.",
      }),
    },
  },
  lifeExpectancy: {
    id: "lifeExpectancy",
    shortLabel: "Life expectancy",
    fullLabel: "Life expectancy at birth, total (years)",
    category: "development",
    unit: "years",
    formatter: (value) => formatNumber(value, " years"),
    description:
      "Life expectancy estimates the number of years a newborn is expected to live under current mortality patterns.",
    interpretation:
      "Higher life expectancy often reflects stronger healthcare, sanitation, and living conditions.",
    caveats:
      "Life expectancy is a summary measure and can mask deep internal disparities.",
    lagNote: "Population health indicators are updated annually and sometimes revised after major events.",
    seoSummary:
      "Benchmark wellbeing and development by comparing life expectancy across countries.",
    chartSuitability: ["line", "bar", "indexed"],
    sources: {
      primary: buildWorldBankSource("SP.DYN.LE00.IN"),
    },
  },
};

export const allIndicators = Object.values(indicatorRegistry);

export function getIndicatorDefinition(indicatorId: IndicatorId) {
  return indicatorRegistry[indicatorId];
}
