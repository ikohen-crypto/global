import type { AccommodationReferenceOffer, LodgingEstimate, ManualCostOverride } from "@/types";
import {
  applyManualOverride,
  combineConfidence,
  createBudgetValue,
  createExplanation,
  median,
  money,
  sum
} from "@/services/calculators/common";
import {
  convertCurrencyAmount,
  getEnvelopeItems,
  resolveDestinationCostProfile
} from "@/services/calculators/reference";
import { buildBookingComSearchLink } from "@/utils/externalLinks";
import type { TripComputationContext } from "@/types";

export interface LodgingBudgetOptions {
  override?: ManualCostOverride;
}

function looksLikePlaceholderHotelName(value?: string): boolean {
  const normalized = value?.trim();
  if (!normalized || normalized.toLowerCase() === "hotel") {
    return true;
  }

  const suspiciousPatterns = [/test/i, /sample/i, /demo/i, /uat/i, /azure/i, /aws/i, /migration/i, /activate/i, /de-activate/i];
  if (suspiciousPatterns.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  return false;
}

function buildFallbackHotelName(cityName: string, tier: "saving" | "standard" | "comfortable"): string {
  if (tier === "saving") {
    return `${cityName} Budget Hotel`;
  }

  if (tier === "standard") {
    return `${cityName} Hotel`;
  }

  return `${cityName} Premium Hotel`;
}

function normalizeHotelDisplayType(value?: string): string | undefined {
  const normalized = value?.trim();
  if (!normalized || normalized.toLowerCase() === "hotel") {
    return undefined;
  }

  if (/^[a-z0-9]{2,5}$/i.test(normalized) && !/\s/.test(normalized)) {
    return undefined;
  }

  const readable = normalized.replace(/[_-]+/g, " ").replace(/\s+/g, " ").toLowerCase();
  if (readable === "hotel" || readable === "room" || readable === "property") {
    return undefined;
  }

  return readable;
}

function normalizeHotelBoardType(value?: string): string | undefined {
  const normalized = value?.trim();
  if (!normalized) {
    return undefined;
  }

  const readable = normalized.replace(/[_-]+/g, " ").replace(/\s+/g, " ").toLowerCase();
  return readable.charAt(0).toUpperCase() + readable.slice(1);
}

function estimateDestinationHotelMarketMultiplier(context: TripComputationContext): number {
  const profile = resolveDestinationCostProfile(context.referenceData);
  const tags = profile.destinationTags.map((tag) => tag.toLowerCase());
  const centralCityPressure =
    profile.publicTransportScore >= 80
      ? 1.12
      : profile.publicTransportScore >= 65
        ? 1.07
        : profile.publicTransportScore <= 40
          ? 0.94
          : 1;
  const touristTaxPressure = profile.touristTaxNightly > 0 ? 1 + Math.min(profile.touristTaxNightly / 100, 0.12) : 1;
  const capitalPressure = tags.some((tag) => ["capital", "city-break", "metro"].includes(tag)) ? 1.08 : 1;
  const luxuryPressure = tags.some((tag) => ["luxury", "premium", "high-end"].includes(tag)) ? 1.14 : 1;
  const islandPressure = tags.some((tag) => ["island", "remote"].includes(tag)) ? 1.09 : 1;

  return money(centralCityPressure * touristTaxPressure * capitalPressure * luxuryPressure * islandPressure);
}

function estimateNightlyRate(
  context: TripComputationContext,
  guestCount: number
): number {
  const profile = resolveDestinationCostProfile(context.referenceData);
  const styleBase =
    context.preferences.lodgingStyle === "saving"
      ? 44
      : context.preferences.lodgingStyle === "standard"
        ? 76
        : 126;
  const accommodationFactor =
    context.preferences.accommodationType === "hotel"
      ? 1.2
      : context.preferences.accommodationType === "apartment"
        ? 1.05
        : 0.7;
  const occupancyFactor = guestCount <= 2 ? 1 : guestCount <= 4 ? 0.92 : 0.84;
  const destinationMarketMultiplier = estimateDestinationHotelMarketMultiplier(context);

  return money(styleBase * accommodationFactor * occupancyFactor * profile.lodgingMultiplier * destinationMarketMultiplier);
}

function estimateRoomCount(
  guestCount: number,
  accommodationType: TripComputationContext["preferences"]["accommodationType"]
): number {
  if (guestCount <= 2) {
    return 1;
  }

  if (accommodationType === "hostel") {
    return Math.max(1, Math.ceil(guestCount / 4));
  }

  return Math.max(1, Math.ceil(guestCount / 2));
}

function selectAccommodationOffer(
  offers: AccommodationReferenceOffer[],
  context: TripComputationContext
): AccommodationReferenceOffer | undefined {
  if (offers.length === 0) {
    return undefined;
  }

  const normalized = offers
    .map((offer) => ({
      offer,
      nightlyRate: convertCurrencyAmount(
        offer.nightlyRate,
        offer.currency,
        context.preferredCurrency,
        context.referenceData
      ).amount
    }))
    .sort((left, right) => left.nightlyRate - right.nightlyRate);

  return normalized[Math.floor(normalized.length / 2)]?.offer;
}

function buildHotelOptions(
  offers: AccommodationReferenceOffer[],
  context: TripComputationContext,
  nights: number,
  roomCount: number,
  expectedNightlyRate: number,
  confidence: LodgingEstimate["confidence"]
): LodgingEstimate["hotelOptions"] {
  const normalized = offers
    .map((offer) => ({
      offer,
      nightlyRate: convertCurrencyAmount(
        offer.nightlyRate,
        offer.currency,
        context.preferredCurrency,
        context.referenceData
      ).amount
    }))
    .filter((item) => Number.isFinite(item.nightlyRate) && item.nightlyRate >= 0)
    .sort((left, right) => left.nightlyRate - right.nightlyRate);

  const candidateIndexes = Array.from(new Set([0, Math.floor(Math.max(0, normalized.length - 1) / 2), Math.max(0, normalized.length - 1)]));
  const tiers: Array<{ tier: "saving" | "standard" | "comfortable"; label: string; multiplier: number }> = [
    { tier: "saving", label: "Budget hotel", multiplier: 0.82 },
    { tier: "standard", label: "Mid-range hotel", multiplier: 1 },
    { tier: "comfortable", label: "Premium hotel", multiplier: 1.28 }
  ];

  return tiers.map((tier, index) => {
    const candidate = normalized[candidateIndexes[index]]?.offer;
    const nightlyRate = candidate
      ? convertCurrencyAmount(
          candidate.nightlyRate,
          candidate.currency,
          context.preferredCurrency,
          context.referenceData
        ).amount
      : money(expectedNightlyRate * tier.multiplier);
    const stayTotal = money(nightlyRate * nights * roomCount);
    const hasRealProperty = Boolean(candidate?.propertyName) && !looksLikePlaceholderHotelName(candidate?.propertyName);
    const propertyName = hasRealProperty ? candidate?.propertyName : undefined;

    return {
      tier: tier.tier,
      label: tier.label,
      sourceName: candidate?.propertyName ? context.referenceData.accommodation?.sourceName ?? "Amadeus Self-Service" : "Booking.com",
      sourceType: candidate?.propertyName
        ? context.referenceData.accommodation?.sourceType ?? (context.referenceData.metadata ? "mixed" : "estimated")
        : "external",
      confidence: candidate?.propertyName
        ? context.referenceData.accommodation?.confidence ?? confidence
        : confidence,
      propertyName,
      propertyType: hasRealProperty ? normalizeHotelDisplayType(candidate?.propertyType) ?? "hotel" : undefined,
      boardType: normalizeHotelBoardType(candidate?.boardType),
      roomDescription:
        hasRealProperty && candidate?.roomDescription && !looksLikePlaceholderHotelName(candidate.roomDescription)
          ? candidate.roomDescription
          : undefined,
      nightlyRate,
      stayTotal,
      currency: context.preferredCurrency,
      bookingLink: buildBookingComSearchLink({
        cityName: context.destination.cityName,
        countryName: context.destination.countryName,
        propertyName: propertyName ?? tier.label,
        adults: context.travelers.adults,
        children: context.travelers.children,
        rooms: roomCount
      }),
      note: hasRealProperty ? undefined : "Estimated hotel alternative based on destination profile.",
      lastUpdatedAt: hasRealProperty ? context.referenceData.accommodation?.fetchedAt : undefined
    };
  });
}

function buildOccupancyPlan(guestCount: number, roomCount: number): Array<{ roomLabel: string; guests: number }> {
  const baseGuestsPerRoom = Math.ceil(guestCount / roomCount);
  let remainingGuests = guestCount;

  return Array.from({ length: roomCount }, (_value, index) => {
    const guests = index === roomCount - 1 ? remainingGuests : Math.min(baseGuestsPerRoom, remainingGuests);
    remainingGuests -= guests;
    return {
      roomLabel: `Room ${index + 1}`,
      guests: Math.max(1, guests)
    };
  });
}

export function calculateLodgingBudget(
  context: TripComputationContext,
  options?: LodgingBudgetOptions
): LodgingEstimate {
  const offers = getEnvelopeItems(context.referenceData.accommodation);
  const guestCount = context.travelers.adults + context.travelers.children + context.travelers.infants;
  const selectedOffer = selectAccommodationOffer(offers, context);
  const nights = Math.max(1, context.nights);

  const expectedNightlyRate = selectedOffer
    ? convertCurrencyAmount(
        selectedOffer.nightlyRate,
        selectedOffer.currency,
        context.preferredCurrency,
        context.referenceData
      ).amount
    : estimateNightlyRate(context, guestCount);

  const nightlyRates = offers
    .map((offer) =>
      convertCurrencyAmount(offer.nightlyRate, offer.currency, context.preferredCurrency, context.referenceData).amount
    )
    .filter((value) => Number.isFinite(value) && value >= 0);

  const maxOccupancy = selectedOffer?.maxOccupancy ?? (context.preferences.accommodationType === "hostel" ? 4 : 2);
  const roomCount = Math.max(1, Math.ceil(guestCount / Math.max(1, maxOccupancy)));
  const total = money(expectedNightlyRate * nights * roomCount);

  const sourceType = context.referenceData.accommodation?.sourceType ?? (context.referenceData.metadata ? "mixed" : "estimated");
  const confidence = context.referenceData.accommodation
    ? context.referenceData.accommodation.confidence
    : context.referenceData.metadata
      ? "medium"
      : "low";

  const explanation = createExplanation(
    selectedOffer
      ? "Lodging cost was normalized from an official accommodation offer."
      : "Lodging cost was estimated from accommodation style and destination cost profile.",
    selectedOffer
      ? "The engine prefers official nightly rates and expands them by the stay length and necessary room count."
      : "A transparent nightly-rate model is used so the result can be replaced by property quotes later.",
    [
      { label: "Guests", value: guestCount },
      { label: "Nights", value: nights },
      { label: "Accommodation type", value: context.preferences.accommodationType },
      { label: "Style", value: context.preferences.lodgingStyle },
      { label: "Expected nightly rate", value: expectedNightlyRate },
      { label: "Room count", value: roomCount },
      { label: "Destination lodging multiplier", value: resolveDestinationCostProfile(context.referenceData).lodgingMultiplier },
      { label: "Destination hotel market multiplier", value: estimateDestinationHotelMarketMultiplier(context) }
    ],
    {
      formula: "nightlyRate x nights x roomCount",
      sourceNotes: selectedOffer ? [selectedOffer.propertyName] : undefined
    }
  );

  const base = createBudgetValue({
    value: total,
    currency: context.preferredCurrency,
    sourceType,
    confidence,
    sourceName: context.referenceData.accommodation?.sourceName ?? "destination-lodging-model",
    lastUpdatedAt: context.referenceData.accommodation?.fetchedAt,
    explanation,
    range: {
      minimum: money(nightlyRates.length > 0 ? Math.min(...nightlyRates) * nights * roomCount : total * 0.88),
      expected: total,
      high: money(nightlyRates.length > 0 ? Math.max(...nightlyRates) * nights * roomCount : total * 1.3),
      currency: context.preferredCurrency
    }
  });

  const patched = applyManualOverride(base, options?.override, (override, original) => ({
    ...original.explanation,
    summary: "Lodging budget manually overridden.",
    methodology: original.explanation.methodology,
    sourceNotes: [
      ...(original.explanation.sourceNotes ?? []),
      `Manual override applied at ${override.appliedAt ?? new Date().toISOString()}`,
      ...(override.reason ? [`Reason: ${override.reason}`] : [])
    ]
  }));

  return {
    ...patched,
    totalNights: nights,
    roomCount,
    unitType: context.preferences.accommodationType,
    nightlyRate: selectedOffer
      ? convertCurrencyAmount(selectedOffer.nightlyRate, selectedOffer.currency, context.preferredCurrency, context.referenceData).amount
      : expectedNightlyRate,
    hotelOptions: buildHotelOptions(offers, context, nights, roomCount, expectedNightlyRate, confidence),
    occupancyPlan: buildOccupancyPlan(guestCount, roomCount),
    selectedPropertyName: selectedOffer && !looksLikePlaceholderHotelName(selectedOffer.propertyName) ? selectedOffer.propertyName : undefined,
    selectedPropertyType:
      selectedOffer && !looksLikePlaceholderHotelName(selectedOffer.propertyName)
        ? normalizeHotelDisplayType(selectedOffer?.propertyType) ?? "hotel"
        : undefined,
    boardType: normalizeHotelBoardType(selectedOffer?.boardType),
    roomDescription:
      selectedOffer?.roomDescription && !looksLikePlaceholderHotelName(selectedOffer.roomDescription) ? selectedOffer.roomDescription : undefined,
    secondaryReference: {
      sourceName: "Booking.com",
      sourceType: "external",
      label: "Hotel search on Booking.com",
      bookingLink: buildBookingComSearchLink({
        cityName: context.destination.cityName,
        countryName: context.destination.countryName,
        propertyName: selectedOffer?.propertyName,
        adults: context.travelers.adults,
        children: context.travelers.children,
        rooms: roomCount
      }),
      note: "Travelpayouts does not provide a live hotel price source, so this is the external booking option."
    },
    bookingLink: buildBookingComSearchLink({
      cityName: context.destination.cityName,
      countryName: context.destination.countryName,
      propertyName: selectedOffer?.propertyName,
      adults: context.travelers.adults,
      children: context.travelers.children,
      rooms: roomCount
    }),
    bookingLinkLabel: "Open in Booking.com"
  };
}
