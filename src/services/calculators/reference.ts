import type {
  CategoryReferenceEnvelope,
  DestinationMetadataRecord,
  DestinationReferenceData,
  ExchangeRateReference
} from "@/types";
import { combineSourceType, clamp, money } from "@/services/calculators/common";
import type { CurrencyCode, DataSourceType, PriceConfidence } from "@/types";

export interface CurrencyConversionResult {
  amount: number;
  currency: CurrencyCode;
  sourceType: DataSourceType;
  confidence: PriceConfidence;
  limitations: string[];
}

export function getEnvelopeItem<T>(envelope?: CategoryReferenceEnvelope<T>): T | undefined {
  return envelope?.items?.[0];
}

export function getEnvelopeItems<T>(envelope?: CategoryReferenceEnvelope<T>): T[] {
  return envelope?.items ?? [];
}

export function resolveDestinationMetadata(
  referenceData: DestinationReferenceData
): DestinationMetadataRecord | undefined {
  return getEnvelopeItem(referenceData.metadata);
}

function resolveExchangeRateRecord(
  referenceData: DestinationReferenceData
): ExchangeRateReference | undefined {
  return getEnvelopeItem(referenceData.exchangeRates);
}

export function convertCurrencyAmount(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  referenceData: DestinationReferenceData
): CurrencyConversionResult {
  const rounded = money(amount);

  if (fromCurrency === toCurrency) {
    return {
      amount: rounded,
      currency: toCurrency,
      sourceType: referenceData.exchangeRates ? referenceData.exchangeRates.sourceType : "estimated",
      confidence: referenceData.exchangeRates?.confidence ?? "high",
      limitations: []
    };
  }

  const exchange = resolveExchangeRateRecord(referenceData);
  if (!exchange) {
    return {
      amount: rounded,
      currency: toCurrency,
      sourceType: "estimated",
      confidence: "low",
      limitations: [
        "Exchange-rate reference data is missing, so the amount was kept in the source currency assumption."
      ]
    };
  }

  if (exchange.baseCurrency === fromCurrency && exchange.rates[toCurrency] != null) {
    return {
      amount: money(rounded * exchange.rates[toCurrency]),
      currency: toCurrency,
      sourceType: referenceData.exchangeRates?.sourceType ?? "api",
      confidence: referenceData.exchangeRates?.confidence ?? "high",
      limitations: referenceData.exchangeRates?.limitations ?? []
    };
  }

  if (exchange.baseCurrency === toCurrency && exchange.rates[fromCurrency] != null) {
    return {
      amount: money(rounded / exchange.rates[fromCurrency]),
      currency: toCurrency,
      sourceType: referenceData.exchangeRates?.sourceType ?? "api",
      confidence: referenceData.exchangeRates?.confidence ?? "high",
      limitations: referenceData.exchangeRates?.limitations ?? []
    };
  }

  if (exchange.rates[fromCurrency] != null && exchange.rates[toCurrency] != null) {
    return {
      amount: money((rounded / exchange.rates[fromCurrency]) * exchange.rates[toCurrency]),
      currency: toCurrency,
      sourceType: referenceData.exchangeRates?.sourceType ?? "api",
      confidence: referenceData.exchangeRates?.confidence ?? "high",
      limitations: referenceData.exchangeRates?.limitations ?? []
    };
  }

  return {
    amount: rounded,
    currency: toCurrency,
    sourceType: "mixed",
    confidence: "low",
    limitations: [
      "Exchange-rate reference exists but did not include a usable pair for this conversion."
    ]
  };
}

export interface DestinationCostProfile {
  mealMultiplier: number;
  lodgingMultiplier: number;
  transportMultiplier: number;
  activityMultiplier: number;
  flightMultiplier: number;
  touristTaxNightly: number;
  visaRequired: boolean;
  destinationTags: string[];
  publicTransportScore: number;
  taxiCostIndex: number;
  mealCostIndex: number;
  limitations: string[];
  sourceTypes: DataSourceType[];
  confidenceScores: PriceConfidence[];
}

function tagMultiplier(tags: string[], allowed: string[], multiplier: number): number {
  return tags.some((tag) => allowed.includes(tag.toLowerCase())) ? multiplier : 1;
}

export function resolveDestinationCostProfile(
  referenceData: DestinationReferenceData
): DestinationCostProfile {
  const metadata = resolveDestinationMetadata(referenceData);
  const destinationTags = metadata?.destinationTags ?? [];
  const normalizedTags = destinationTags.map((tag) => tag.toLowerCase());

  const mealCostIndex = metadata?.mealCostIndex ?? 1;
  const transportScore = clamp(metadata?.publicTransportScore ?? 50, 0, 100);
  const taxiCostIndex = metadata?.taxiCostIndex ?? 1;

  const expensiveCurrencyGroup = ["usd", "eur", "gbp", "chf", "aud", "cad", "nzd", "sgd", "nok", "dkk"];
  const cheapCurrencyGroup = ["mxn", "brl", "ars", "clp", "cop", "pen", "idr", "vnd", "thb", "php", "inr"];
  const destinationCurrency = (
    metadata?.countryCurrency ?? referenceData.destination.currency ?? ""
  ).toLowerCase();

  const currencyMultiplier = expensiveCurrencyGroup.includes(destinationCurrency)
    ? 1.12
    : cheapCurrencyGroup.includes(destinationCurrency)
      ? 0.9
      : 1;

  const budgetTagMultiplier = tagMultiplier(normalizedTags, ["budget", "backpacker", "cheap"], 0.9);
  const luxuryTagMultiplier = tagMultiplier(normalizedTags, ["luxury", "premium", "high-end"], 1.18);
  const islandMultiplier = tagMultiplier(normalizedTags, ["island", "remote"], 1.12);
  const capitalMultiplier = tagMultiplier(normalizedTags, ["capital", "city-break", "metro"], 1.06);

  const mealMultiplier = money(mealCostIndex * currencyMultiplier * budgetTagMultiplier * luxuryTagMultiplier);
  const lodgingMultiplier = money((mealCostIndex * 0.9 + 0.1) * currencyMultiplier * islandMultiplier * luxuryTagMultiplier);
  const transportMultiplier = money(
    ((100 - transportScore) / 100) * 0.65 + 0.7 * taxiCostIndex * currencyMultiplier
  );
  const activityMultiplier = money(
    mealMultiplier * 0.7 + capitalMultiplier * 0.15 + islandMultiplier * 0.12
  );
  const flightMultiplier = money(1 + (islandMultiplier - 1) * 0.8 + (luxuryTagMultiplier - 1) * 0.4);

  const touristTaxNightly = metadata?.touristTaxNightly ?? 0;
  const visaRequired = metadata?.visaRequired ?? false;

  const sourceTypes = [referenceData.metadata, referenceData.exchangeRates]
    .filter(Boolean)
    .map((envelope) => envelope!.sourceType);

  const confidenceScores = [referenceData.metadata, referenceData.exchangeRates]
    .filter(Boolean)
    .map((envelope) => envelope!.confidence);

  return {
    mealMultiplier,
    lodgingMultiplier,
    transportMultiplier,
    activityMultiplier,
    flightMultiplier,
    touristTaxNightly,
    visaRequired,
    destinationTags,
    publicTransportScore: transportScore,
    taxiCostIndex,
    mealCostIndex,
    limitations: referenceData.warnings,
    sourceTypes,
    confidenceScores
  };
}

export function describeReferenceEnvelope<T>(
  envelope: CategoryReferenceEnvelope<T> | undefined
): string[] {
  if (!envelope) {
    return [];
  }

  return [
    `Source: ${envelope.sourceName}`,
    `Currency: ${envelope.currency}`,
    `Fetched at: ${envelope.fetchedAt}`,
    ...envelope.limitations
  ];
}

export function combineEnvelopeSourceType(
  envelopes: Array<CategoryReferenceEnvelope<unknown> | undefined>
): DataSourceType {
  const types = envelopes.filter(Boolean).map((envelope) => envelope!.sourceType);
  return combineSourceType(types as DataSourceType[]);
}
