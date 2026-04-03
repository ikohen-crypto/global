import type { FlightEstimate, ManualCostOverride } from "@/types";
import {
  applyManualOverride,
  createBudgetValue,
  createExplanation,
  median,
  money,
} from "@/services/calculators/common";
import {
  convertCurrencyAmount,
  getEnvelopeItems,
  resolveDestinationCostProfile
} from "@/services/calculators/reference";
import type { TripComputationContext, FlightReferenceOffer } from "@/types";
import { buildAviasalesSearchLink } from "@/utils/externalLinks";
import { resolveAirlineNames } from "@/utils/presentation";

export interface FlightBudgetOptions {
  includeCheckedBag?: boolean;
  override?: ManualCostOverride;
}

function estimateAdultFareFromDestination(context: TripComputationContext): number {
  const profile = resolveDestinationCostProfile(context.referenceData);
  const destination = context.referenceData.destination;
  const tags = profile.destinationTags;
  const longHaulMultiplier =
    tags.some((tag) => ["remote", "island", "far", "long-haul"].includes(tag.toLowerCase()))
      ? 1.25
      : 1;
  const premiumMultiplier = tags.some((tag) => ["luxury", "premium", "capital"].includes(tag.toLowerCase()))
    ? 1.08
    : 1;
  const baseFare = 320;
  const currencyFactor = destination.currency === context.preferredCurrency ? 1 : 1.04;

  return money(baseFare * profile.flightMultiplier * longHaulMultiplier * premiumMultiplier * currencyFactor);
}

function haversineDistanceKm(
  origin?: { latitude?: number; longitude?: number },
  destination?: { latitude?: number; longitude?: number }
): number {
  if (
    origin?.latitude === undefined ||
    origin?.longitude === undefined ||
    destination?.latitude === undefined ||
    destination?.longitude === undefined
  ) {
    return 0;
  }

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(destination.latitude - origin.latitude);
  const deltaLon = toRadians(destination.longitude - origin.longitude);
  const lat1 = toRadians(origin.latitude);
  const lat2 = toRadians(destination.latitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function routeDistanceMultiplier(context: TripComputationContext): number {
  const distanceKm = haversineDistanceKm(context.origin, context.destination);

  if (distanceKm <= 0) {
    return 1;
  }

  if (distanceKm < 800) {
    return 0.72;
  }

  if (distanceKm < 2000) {
    return 0.88;
  }

  if (distanceKm < 4500) {
    return 1;
  }

  if (distanceKm < 7000) {
    return 1.18;
  }

  return 1.32;
}

function estimateRouteFareFromDestination(context: TripComputationContext): number {
  const baseFare = estimateAdultFareFromDestination(context);
  const routeMultiplier = routeDistanceMultiplier(context);
  const originCurrencyFactor =
    context.origin.currency === context.preferredCurrency || context.destination.currency === context.preferredCurrency
      ? 1
      : 1.04;

  return money(baseFare * routeMultiplier * originCurrencyFactor);
}

function estimatePassengerPricing(
  adultFare: number,
  travelers: TripComputationContext["travelers"]
): FlightEstimate["passengerPricing"] {
  const adultCount = travelers.adults;
  const childCount = travelers.children;
  const infantCount = travelers.infants;

  const childFare = money(adultFare * 0.78);
  const infantFare = money(adultFare * 0.12);

  return [
    {
      travelerType: "adult",
      quantity: adultCount,
      unitPrice: adultFare,
      totalPrice: money(adultCount * adultFare),
      sourceType: "estimated"
    },
    {
      travelerType: "child",
      quantity: childCount,
      unitPrice: childFare,
      totalPrice: money(childCount * childFare),
      sourceType: "estimated"
    },
    {
      travelerType: "infant",
      quantity: infantCount,
      unitPrice: infantFare,
      totalPrice: money(infantCount * infantFare),
      sourceType: "estimated"
    }
  ];
}

function normalizeOfferPrice(
  offer: FlightReferenceOffer,
  context: TripComputationContext
): number {
  const converted = convertCurrencyAmount(
    offer.priceTotal,
    offer.currency,
    context.preferredCurrency,
    context.referenceData
  );

  return converted.amount;
}

function parseDurationToMinutes(duration?: string): number {
  if (!duration) {
    return 0;
  }

  const match = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?$/i.exec(duration);
  if (!match) {
    return 0;
  }

  const days = Number.parseInt(match[1] ?? "0", 10);
  const hours = Number.parseInt(match[2] ?? "0", 10);
  const minutes = Number.parseInt(match[3] ?? "0", 10);

  return days * 24 * 60 + hours * 60 + minutes;
}

function selectRepresentativeOffer(
  offers: FlightReferenceOffer[],
  context: TripComputationContext
): FlightReferenceOffer | undefined {
  if (offers.length === 0) {
    return undefined;
  }

  const travelpayoutsOffers = offers.filter((offer) => offer.id.startsWith("travelpayouts-"));
  if (travelpayoutsOffers.length > 0) {
    return travelpayoutsOffers[0];
  }

  const prioritizedOffers = offers;

  const minStops = Math.min(...prioritizedOffers.map((offer) => offer.stopCount));
  const conservativePool = prioritizedOffers.filter((offer) => offer.stopCount === minStops);
  const pool = conservativePool.length > 0 ? conservativePool : offers;

  const prices = pool.map((offer) => normalizeOfferPrice(offer, context));
  const durations = pool.map((offer) => parseDurationToMinutes(offer.totalDuration)).filter((value) => value > 0);
  const priceMedian = median(prices);
  const durationMedian = durations.length ? median(durations) : 0;

  return pool
    .map((offer) => {
      const price = normalizeOfferPrice(offer, context);
      const duration = parseDurationToMinutes(offer.totalDuration);
      const priceDistance = priceMedian > 0 ? Math.abs(price - priceMedian) / priceMedian : 0;
      const durationDistance =
        durationMedian > 0 && duration > 0 ? Math.abs(duration - durationMedian) / durationMedian : 0;

      return {
        offer,
        score: priceDistance * 0.7 + durationDistance * 0.3,
        price
      };
    })
    .sort((left, right) => left.score - right.score || left.price - right.price)[0]?.offer;
}

function normalizeCheckedBagPrice(
  offer: FlightReferenceOffer | undefined,
  context: TripComputationContext,
  fallbackEstimated: number
): number {
  if (!offer?.checkedBagPrice) {
    return fallbackEstimated;
  }

  return convertCurrencyAmount(
    offer.checkedBagPrice,
    offer.currency,
    context.preferredCurrency,
    context.referenceData
  ).amount;
}

function buildOfferPassengerPricing(
  offer: FlightReferenceOffer,
  context: TripComputationContext
): FlightEstimate["passengerPricing"] {
  const totalTravelers = Math.max(1, context.travelers.adults + context.travelers.children + context.travelers.infants);
  const sourceBreakdown = offer.passengerBreakdown;

  const entries: FlightEstimate["passengerPricing"] = [
    {
      travelerType: "adult",
      quantity: context.travelers.adults,
      unitPrice: money(
        convertCurrencyAmount(
          sourceBreakdown.find((item) => item.travelerType === "adult")?.fare ??
            offer.priceTotal / totalTravelers,
          offer.currency,
          context.preferredCurrency,
          context.referenceData
        ).amount
      ),
      totalPrice: 0,
      sourceType: offer.sourceType
    },
    {
      travelerType: "child",
      quantity: context.travelers.children,
      unitPrice: money(
        convertCurrencyAmount(
          sourceBreakdown.find((item) => item.travelerType === "child")?.fare ??
            offer.priceTotal / totalTravelers * 0.78,
          offer.currency,
          context.preferredCurrency,
          context.referenceData
        ).amount
      ),
      totalPrice: 0,
      sourceType: offer.sourceType
    },
    {
      travelerType: "infant",
      quantity: context.travelers.infants,
      unitPrice: money(
        convertCurrencyAmount(
          sourceBreakdown.find((item) => item.travelerType === "infant")?.fare ??
            offer.priceTotal / totalTravelers * 0.12,
          offer.currency,
          context.preferredCurrency,
          context.referenceData
        ).amount
      ),
      totalPrice: 0,
      sourceType: offer.sourceType
    }
  ];

  return entries.map((entry) => ({
    ...entry,
    totalPrice: money(entry.unitPrice * entry.quantity)
  }));
}

export function calculateFlightBudget(
  context: TripComputationContext,
  options?: FlightBudgetOptions
): FlightEstimate {
  const offers = getEnvelopeItems(context.referenceData.flights);
  const profile = resolveDestinationCostProfile(context.referenceData);
  const sourceCurrency = context.referenceData.flights?.currency ?? context.preferredCurrency;
  const routeDistanceKm = haversineDistanceKm(context.origin, context.destination);
  const routeMultiplier = routeDistanceMultiplier(context);

  const offerTotals = offers
    .map((offer) =>
      normalizeOfferPrice(offer, context)
    )
    .filter((value) => Number.isFinite(value) && value >= 0);

  const selectedOffer = selectRepresentativeOffer(offers, context);
  const fallbackFlightLink = buildAviasalesSearchLink({
    originIata: context.origin.iataCode ?? context.origin.airports?.[0]?.iataCode ?? "",
    destinationIata: context.destination.iataCode ?? context.destination.airports?.[0]?.iataCode ?? "",
    departureDate: context.searchInput.departureDate,
    returnDate: context.searchInput.returnDate,
    adults: context.travelers.adults,
    children: context.travelers.children,
    infants: context.travelers.infants
  });

  const expectedTotal = selectedOffer
    ? normalizeOfferPrice(selectedOffer, context)
    : money(
        estimatePassengerPricing(estimateRouteFareFromDestination(context), context.travelers).reduce(
          (accumulator, item) => accumulator + item.totalPrice,
          0
        )
      );

  const minimumTotal = offerTotals.length > 0 ? Math.min(...offerTotals) : money(expectedTotal * 0.88);
  const highTotal = offerTotals.length > 0 ? Math.max(...offerTotals) : money(expectedTotal * 1.28);

  const passengerPricing = selectedOffer
    ? buildOfferPassengerPricing(selectedOffer, context)
    : estimatePassengerPricing(estimateRouteFareFromDestination(context), context.travelers);

  const checkedBagCost = options?.includeCheckedBag === false
    ? 0
    : normalizeCheckedBagPrice(
        selectedOffer,
        context,
        money((context.travelers.adults + context.travelers.children) * 34 * 2)
      );

  const totalPassengers = Math.max(1, context.travelers.adults + context.travelers.children + context.travelers.infants);
  const normalizedSourceType = context.referenceData.flights?.sourceType ?? (context.referenceData.metadata ? "mixed" : "estimated");
  const confidence = context.referenceData.flights
    ? context.referenceData.flights.confidence
    : context.referenceData.metadata
      ? "medium"
      : "low";

  const limitations = Array.from(
    new Set([
      ...(context.referenceData.flights?.limitations ?? []),
      ...(!selectedOffer
        ? ["Flight estimates are based on official offers when available; otherwise a destination-level model is used."]
        : [])
    ])
  );
  const technicalNotes = Array.from(
    new Set([
      "Passenger-level prices are normalized from the group fare total.",
      ...(selectedOffer?.bookingLinkSource === "travelpayouts"
        ? ["Travelpayouts affiliate deeplink was attached to the current search."]
        : selectedOffer?.bookingLinkSource === "aviasales"
          ? ["A booking link from Aviasales was attached for this search."]
          : [])
    ])
  );

  const base = createBudgetValue({
    value: expectedTotal,
    currency: context.preferredCurrency,
    sourceType: normalizedSourceType,
    confidence,
    sourceName: context.referenceData.flights?.sourceName ?? "destination-flight-model",
    limitations,
    lastUpdatedAt: context.referenceData.flights?.fetchedAt,
    explanation: createExplanation(
      selectedOffer
        ? "Flight budget was normalized from an official flight offer."
        : "Flight budget was estimated from destination characteristics and traveler composition.",
      selectedOffer
        ? "The engine prefers direct flights first, then balances price and duration, and keeps the offer range visible."
        : "Without route-level flight data, the engine falls back to a destination-level airfare curve that remains easy to replace.",
      [
        { label: "Adults", value: context.travelers.adults },
        { label: "Children", value: context.travelers.children },
        { label: "Infants", value: context.travelers.infants },
        { label: "Expected airfare", value: expectedTotal },
        { label: "Selected baggage estimate", value: checkedBagCost },
        { label: "Preferred currency", value: context.preferredCurrency },
        { label: "Source currency", value: sourceCurrency },
        { label: "Route distance (km)", value: routeDistanceKm },
        { label: "Route multiplier", value: routeMultiplier },
        { label: "Destination flight multiplier", value: profile.flightMultiplier }
      ],
      {
        formula: "expected flight offer or fallback airfare model",
        sourceNotes: selectedOffer ? [selectedOffer.id] : undefined,
        technicalNotes,
        limitations
      }
    ),
    range: {
      minimum: money(minimumTotal),
      expected: money(expectedTotal),
      high: money(highTotal),
      currency: context.preferredCurrency
    }
  });

  const manualApplied = applyManualOverride(base, options?.override, (override, original) => ({
    ...original.explanation,
    summary: "Flight budget manually overridden.",
    methodology: original.explanation.methodology,
    sourceNotes: [
      ...(original.explanation.sourceNotes ?? []),
      `Manual override applied at ${override.appliedAt ?? new Date().toISOString()}`,
      ...(override.reason ? [`Reason: ${override.reason}`] : [])
    ]
  }));

  return {
    ...manualApplied,
    perPassenger: money(manualApplied.value / totalPassengers),
    groupTotal: manualApplied.value,
    travelerCount: totalPassengers,
    passengerPricing: passengerPricing.map((entry) => ({
      ...entry,
      totalPrice: money(entry.unitPrice * entry.quantity)
    })),
    checkedBagCost,
    originAirportCode: selectedOffer?.originAirportCode ?? context.origin.iataCode,
    destinationAirportCode: selectedOffer?.destinationAirportCode ?? context.destination.iataCode,
    secondaryReference:
      selectedOffer?.secondaryReference ?? {
        sourceName: "Aviasales",
        sourceType: "external",
        label: "Flight search on Aviasales",
        bookingLink: fallbackFlightLink,
        note: "No live flight offer was available for this search, so this external search link is shown instead."
      },
    bookingLink:
      selectedOffer?.bookingLink ?? fallbackFlightLink,
    bookingLinkLabel: selectedOffer?.bookingLinkLabel ?? "Buscar vuelo en Aviasales",
    bookingLinkSource: selectedOffer?.bookingLinkSource ?? "aviasales",
    itinerarySummary: selectedOffer
      ? {
          originAirportCode: selectedOffer.originAirportCode ?? context.origin.iataCode,
          destinationAirportCode: selectedOffer.destinationAirportCode ?? context.destination.iataCode,
          originLabel: context.origin.label,
          destinationLabel: context.destination.label,
          validatingAirlineCodes: selectedOffer.validatingAirlineCodes,
          validatingAirlineNames: resolveAirlineNames(
            selectedOffer.validatingAirlineCodes,
            selectedOffer.validatingAirlineNames
          ),
          stopCount: selectedOffer.stopCount,
          totalDuration: selectedOffer.totalDuration
        }
      : {
          originAirportCode: context.origin.iataCode,
          destinationAirportCode: context.destination.iataCode,
          originLabel: context.origin.label,
          destinationLabel: context.destination.label,
          validatingAirlineCodes: [],
          validatingAirlineNames: [],
          stopCount: 0
        }
  };
}
