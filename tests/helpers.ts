import { mockDestinationList, mockDestinationReferenceData } from "@/mocks";
import type { DestinationOption, TripSearchInput, TripComputationContext } from "@/types";

export function buildTripInput(
  overrides: Partial<TripSearchInput> = {}
): TripSearchInput {
  const destinations = mockDestinationList();

  return {
    origin: destinations[2],
    destinations: [destinations[1], destinations[0]],
    departureDate: "2026-06-10",
    returnDate: "2026-06-17",
    nights: 7,
    preferredCurrency: "USD",
    travelers: {
      breakdown: { adults: 2, children: 1, infants: 0 },
      totalTravelers: 3,
      partyType: "family"
    },
    accommodationType: "hotel",
    lodgingStyle: "standard",
    foodStyle: "standard",
    localTransportStyle: "mixed",
    activityStyle: "balanced",
    activityCount: 4,
    includeCheckedBag: true,
    includeTravelInsurance: true,
    includeRoaming: false,
    includeAirportTransfers: true,
    includeContingency: true,
    includeSouvenirs: false,
    includeVisaCosts: false,
    includeTouristTaxes: true,
    includeTips: true,
    manualOverrides: {},
    ...overrides
  };
}

export function buildComputationContext(
  destination: DestinationOption = mockDestinationList()[1],
  overrides: Partial<TripSearchInput> = {}
): TripComputationContext {
  const input = buildTripInput(overrides);
  const referenceData = mockDestinationReferenceData(destination);

  return {
    destination,
    preferredCurrency: input.preferredCurrency,
    nights: input.nights,
    travelers: input.travelers.breakdown,
    preferences: {
      lodgingStyle: input.lodgingStyle,
      foodStyle: input.foodStyle,
      localTransportStyle: input.localTransportStyle,
      activityStyle: input.activityStyle,
      accommodationType: input.accommodationType
    },
    referenceData
  };
}
