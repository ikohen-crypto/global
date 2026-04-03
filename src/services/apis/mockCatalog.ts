import { mockDestinationList } from "@/mocks";
import type { DestinationOption, ReferenceConfigResponse, TripSearchInput } from "@/types";

export const mockDestinations: DestinationOption[] = mockDestinationList();

export const mockReferenceConfig: ReferenceConfigResponse = {
  appName: "Travel Budget Comparator",
  defaultCurrency: "USD",
  defaultOrigin: mockDestinations[0],
  supportedCurrencies: ["USD", "EUR", "JPY", "THB", "ARS", "AED", "MXN", "GBP", "ILS"],
  dataAvailability: {
    flights: "api-ready",
    lodging: "api-ready",
    activities: "api-ready",
    exchangeRates: "api-ready",
    destinationSearch: "api-ready"
  },
  assumptionNotes: [
    "All non-fetched figures remain explicitly marked as estimates.",
    "Demo mode keeps the UI functional until the BFF is connected.",
    "Manual overrides always win over computed category values."
  ],
  lastUpdatedAt: new Date().toISOString(),
  supportsMockMode: true,
  scenarios: [],
  providers: []
};

export function buildDefaultTripInput(): TripSearchInput {
  const departureDate = new Date(Date.now() + 45 * 86_400_000).toISOString().slice(0, 10);
  const returnDate = new Date(Date.now() + 52 * 86_400_000).toISOString().slice(0, 10);

  return {
    origin: mockReferenceConfig.defaultOrigin,
    destinations: [mockDestinations[1], mockDestinations[2]],
    departureDate,
    returnDate,
    nights: 7,
    preferredCurrency: mockReferenceConfig.defaultCurrency,
    travelers: {
      breakdown: { adults: 2, children: 0, infants: 0 },
      totalTravelers: 2,
      partyType: "couple"
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
    manualOverrides: {}
  };
}

export function findMockDestination(query: string): DestinationOption[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return [];
  }

  return mockDestinations.filter((destination) => {
    const haystack = [
      destination.label,
      destination.cityName,
      destination.countryName,
      destination.countryCode,
      destination.iataCode ?? ""
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalized);
  });
}
