import { DEFAULT_COMPARISON_SCENARIOS } from "@/config/app";
import { mockDestinations } from "@/services/apis/mockCatalog";
import { buildBookingComSearchLink } from "@/utils/externalLinks";
import { resolveAirlineNames } from "@/utils/presentation";
import type {
  ActivitiesEstimate,
  BudgetApiResponse,
  DestinationOption,
  ExtraCostsEstimate,
  FinalBudgetSummary,
  FoodEstimate,
  FlightEstimate,
  LodgingEstimate,
  LocalTransportEstimate,
  PriceConfidence,
  TripSearchInput
} from "@/types";
import { roundCurrency } from "@/utils/currency";

type ModelValue = {
  value: number;
  minimum: number;
  expected: number;
  high: number;
  confidence: PriceConfidence;
  sourceType: "mock" | "estimated";
  summary: string;
  methodology: string;
  formula: string;
};

function baseMultiplier(destination: DestinationOption): number {
  switch (destination.countryCode) {
    case "US":
      return 1.15;
    case "ES":
    case "PT":
    case "IT":
    case "FR":
      return 0.95;
    case "JP":
      return 1.4;
    case "TH":
      return 0.8;
    case "AR":
      return 0.78;
    case "AE":
      return 1.2;
    case "MX":
      return 0.88;
    default:
      return 1;
  }
}

function seed(destination: DestinationOption): number {
  return destination.label.length + destination.countryName.length + destination.cityName.length;
}

function model(
  value: number,
  confidence: PriceConfidence,
  sourceType: "mock" | "estimated",
  summary: string,
  methodology: string,
  formula: string,
  volatility: number
): ModelValue {
  return {
    value: roundCurrency(value),
    minimum: roundCurrency(value * (1 - volatility * 0.8)),
    expected: roundCurrency(value),
    high: roundCurrency(value * (1 + volatility)),
    confidence,
    sourceType,
    summary,
    methodology,
    formula
  };
}

function flightEstimate(input: TripSearchInput, destination: DestinationOption): FlightEstimate {
  const travelers = Math.max(1, input.travelers.totalTravelers);
  const perPassenger = roundCurrency(120 + seed(destination) * 3.25 + baseMultiplier(destination) * 180);
  const checkedBagCost = input.includeCheckedBag ? roundCurrency(travelers * 42) : 0;
  const total = roundCurrency(perPassenger * travelers + checkedBagCost);
  const summary = model(
    total,
    destination.iataCode ? "medium" : "low",
    "mock",
    "Flight pricing is seeded from destination profile and traveler count.",
    "Mock flight search stands in for the future official search endpoint.",
    "perPassenger x travelers + checkedBagCost",
    0.2
  );

  return {
    value: summary.value,
    total: summary.value,
    currency: input.preferredCurrency,
    sourceType: summary.sourceType,
    confidence: summary.confidence,
    explanation: {
      summary: summary.summary,
      methodology: summary.methodology,
      formula: summary.formula,
      inputs: [
        { label: "Travelers", value: travelers },
        { label: "Per passenger", value: perPassenger },
        { label: "Checked bag cost", value: checkedBagCost }
      ],
      limitations: ["Demo flight prices are estimates until the official API is connected."]
    },
    range: {
      minimum: summary.minimum,
      expected: summary.expected,
      high: summary.high,
      currency: input.preferredCurrency
    },
    perPassenger,
    groupTotal: total,
    passengerPricing: [
      {
        travelerType: "adult",
        quantity: input.travelers.breakdown.adults,
        unitPrice: perPassenger,
        totalPrice: roundCurrency(perPassenger * input.travelers.breakdown.adults),
        sourceType: "mock"
      },
      {
        travelerType: "child",
        quantity: input.travelers.breakdown.children,
        unitPrice: roundCurrency(perPassenger * 0.8),
        totalPrice: roundCurrency(perPassenger * 0.8 * input.travelers.breakdown.children),
        sourceType: "estimated"
      },
      {
        travelerType: "infant",
        quantity: input.travelers.breakdown.infants,
        unitPrice: roundCurrency(perPassenger * 0.2),
        totalPrice: roundCurrency(perPassenger * 0.2 * input.travelers.breakdown.infants),
        sourceType: "estimated"
      }
    ],
    checkedBagCost,
    itinerarySummary: {
      validatingAirlineCodes: [destination.iataCode ?? "N/A"],
      validatingAirlineNames: resolveAirlineNames([destination.iataCode ?? "N/A"]),
      originLabel: input.origin.label,
      destinationLabel: destination.label,
      stopCount: destination.countryCode === "US" ? 0 : 1
    },
    lastUpdatedAt: new Date().toISOString(),
    sourceName: "Mock flight search"
  };
}

function lodgingEstimate(input: TripSearchInput, destination: DestinationOption): LodgingEstimate {
  const travelers = Math.max(1, input.travelers.totalTravelers);
  const nightlyRateBase =
    72 * baseMultiplier(destination) *
    (input.lodgingStyle === "saving" ? 0.82 : input.lodgingStyle === "comfortable" ? 1.2 : 1);
  const roomCount = travelers <= 2 ? 1 : travelers <= 4 ? 2 : Math.ceil(travelers / 2);
  const nightlyRate = roundCurrency(nightlyRateBase + seed(destination) * 1.1);
  const total = roundCurrency(nightlyRate * input.nights * roomCount);
  const summary = model(
    total,
    "medium",
    "estimated",
    "Lodging is estimated from destination profile, stay length and room allocation.",
    "Mock lodging profile uses a configurable nightly rate and occupancy plan.",
    "nightlyRate x nights x roomCount",
    0.2
  );

  return {
    value: summary.value,
    total: summary.value,
    currency: input.preferredCurrency,
    sourceType: summary.sourceType,
    confidence: summary.confidence,
    explanation: {
      summary: summary.summary,
      methodology: summary.methodology,
      formula: summary.formula,
      inputs: [
        { label: "Nights", value: input.nights },
        { label: "Room count", value: roomCount },
        { label: "Nightly rate", value: nightlyRate }
      ],
      limitations: ["Room-level availability and taxes are not fetched in demo mode."]
    },
    range: {
      minimum: summary.minimum,
      expected: summary.expected,
      high: summary.high,
      currency: input.preferredCurrency
    },
    totalNights: input.nights,
    roomCount,
    unitType: input.accommodationType,
    nightlyRate,
    hotelOptions: [
      {
        tier: "saving",
        label: "Budget hotel",
        sourceName: "Booking.com",
        sourceType: "external",
        confidence: "medium",
        propertyName: undefined,
        propertyType: undefined,
        boardType: "room only",
        roomDescription: "Budget-friendly stay with transparent demo pricing.",
        nightlyRate: roundCurrency(nightlyRate * 0.82),
        stayTotal: roundCurrency(nightlyRate * 0.82 * input.nights * roomCount),
        currency: input.preferredCurrency,
        bookingLink: buildBookingComSearchLink({
          cityName: destination.cityName,
          countryName: destination.countryName,
          propertyName: "Estimated budget option",
          adults: input.travelers.breakdown.adults,
          children: input.travelers.breakdown.children,
          rooms: roomCount
        })
      },
      {
        tier: "standard",
        label: "Mid-range hotel",
        sourceName: "Booking.com",
        sourceType: "external",
        confidence: "medium",
        propertyName: undefined,
        propertyType: undefined,
        boardType: "room only",
        roomDescription: "Balanced stay with transparent demo pricing.",
        nightlyRate,
        stayTotal: roundCurrency(nightlyRate * input.nights * roomCount),
        currency: input.preferredCurrency,
        bookingLink: buildBookingComSearchLink({
          cityName: destination.cityName,
          countryName: destination.countryName,
          propertyName: "Estimated mid-range option",
          adults: input.travelers.breakdown.adults,
          children: input.travelers.breakdown.children,
          rooms: roomCount
        })
      },
      {
        tier: "comfortable",
        label: "Premium hotel",
        sourceName: "Booking.com",
        sourceType: "external",
        confidence: "medium",
        propertyName: undefined,
        propertyType: undefined,
        boardType: "room only",
        roomDescription: "Premium stay with transparent demo pricing.",
        nightlyRate: roundCurrency(nightlyRate * 1.28),
        stayTotal: roundCurrency(nightlyRate * 1.28 * input.nights * roomCount),
        currency: input.preferredCurrency,
        bookingLink: buildBookingComSearchLink({
          cityName: destination.cityName,
          countryName: destination.countryName,
          propertyName: "Estimated premium option",
          adults: input.travelers.breakdown.adults,
          children: input.travelers.breakdown.children,
          rooms: roomCount
        })
      }
    ],
    occupancyPlan: Array.from({ length: roomCount }, (_, index) => ({
      roomLabel: `Room ${index + 1}`,
      guests: index === 0 ? Math.ceil(travelers / roomCount) : Math.floor(travelers / roomCount)
    })),
    selectedPropertyName: `${destination.cityName} Central Stay`,
    selectedPropertyType: input.accommodationType,
    boardType: "room only",
    roomDescription: "Central stay with transparent demo pricing.",
    secondaryReference: {
      sourceName: "Booking.com",
      sourceType: "external",
      label: "Hotel search on Booking.com",
      bookingLink: buildBookingComSearchLink({
        cityName: destination.cityName,
        countryName: destination.countryName,
        propertyName: `${destination.cityName} Central Stay`,
        adults: input.travelers.breakdown.adults,
        children: input.travelers.breakdown.children,
        rooms: roomCount
      }),
      note: "This is the external booking option used when no secondary hotel price source is available."
    },
    bookingLink: buildBookingComSearchLink({
      cityName: destination.cityName,
      countryName: destination.countryName,
      propertyName: `${destination.cityName} Central Stay`,
      adults: input.travelers.breakdown.adults,
      children: input.travelers.breakdown.children,
      rooms: roomCount
    }),
    bookingLinkLabel: "Search hotel on Booking.com",
    lastUpdatedAt: new Date().toISOString(),
    sourceName: "Mock lodging search"
  };
}

function foodEstimate(input: TripSearchInput, destination: DestinationOption): FoodEstimate {
  const travelers = Math.max(1, input.travelers.totalTravelers);
  const styleMultiplier =
    input.foodStyle === "saving" ? 0.8 : input.foodStyle === "comfortable" ? 1.3 : 1;
  const dailyPerPerson = roundCurrency(
    (22 + seed(destination) * 0.65) * styleMultiplier * baseMultiplier(destination)
  );
  const total = roundCurrency(dailyPerPerson * input.nights * travelers);
  const summary = model(
    total,
    "medium",
    "estimated",
    "Food cost scales by style, nights and the size of the party.",
    "A daily per-person allowance is expanded across the trip duration.",
    "dailyPerPerson x nights x travelers",
    0.16
  );

  return {
    value: summary.value,
    total: summary.value,
    currency: input.preferredCurrency,
    sourceType: summary.sourceType,
    confidence: summary.confidence,
    explanation: {
      summary: summary.summary,
      methodology: summary.methodology,
      formula: summary.formula,
      inputs: [
        { label: "Daily per person", value: dailyPerPerson },
        { label: "Travelers", value: travelers },
        { label: "Nights", value: input.nights }
      ]
    },
    range: {
      minimum: summary.minimum,
      expected: summary.expected,
      high: summary.high,
      currency: input.preferredCurrency
    },
    dailyPerPerson,
    groupDailyTotal: roundCurrency(dailyPerPerson * travelers),
    style: input.foodStyle,
    lastUpdatedAt: new Date().toISOString(),
    sourceName: "Mock food estimator"
  };
}

function transportEstimate(input: TripSearchInput, destination: DestinationOption): LocalTransportEstimate {
  const base =
    input.localTransportStyle === "public"
      ? 14
      : input.localTransportStyle === "private"
        ? 38
        : 24;
  const dailyGroupCost = roundCurrency((base + seed(destination) * 0.22) * baseMultiplier(destination));
  const total = roundCurrency(dailyGroupCost * input.nights);
  const summary = model(
    total,
    "low",
    "estimated",
    "Local transport uses a per-day allowance adjusted for the destination profile.",
    "Estimated from public, mixed or private transport style.",
    "dailyGroupCost x nights",
    0.22
  );

  return {
    value: summary.value,
    total: summary.value,
    currency: input.preferredCurrency,
    sourceType: summary.sourceType,
    confidence: summary.confidence,
    explanation: {
      summary: summary.summary,
      methodology: summary.methodology,
      formula: summary.formula,
      inputs: [
        { label: "Daily group cost", value: dailyGroupCost },
        { label: "Nights", value: input.nights }
      ]
    },
    range: {
      minimum: summary.minimum,
      expected: summary.expected,
      high: summary.high,
      currency: input.preferredCurrency
    },
    dailyGroupCost,
    style: input.localTransportStyle,
    lastUpdatedAt: new Date().toISOString(),
    sourceName: "Mock transport estimator"
  };
}

function activitiesEstimate(input: TripSearchInput, destination: DestinationOption): ActivitiesEstimate {
  const paidActivitiesCount = Math.max(0, input.activityCount);
  const freeActivitiesCount = input.activityStyle === "light" ? 2 : input.activityStyle === "packed" ? 1 : 2;
  const averagePaidActivityCost = roundCurrency(28 + seed(destination) * 0.9);
  const total = roundCurrency(averagePaidActivityCost * paidActivitiesCount);
  const summary = model(
    total,
    "medium",
    "estimated",
    "Activities are estimated as a blend of paid and free options.",
    "The average paid activity cost is applied to the selected activity count.",
    "averagePaidActivityCost x paidActivitiesCount",
    0.25
  );

  return {
    value: summary.value,
    total: summary.value,
    currency: input.preferredCurrency,
    sourceType: summary.sourceType,
    confidence: summary.confidence,
    explanation: {
      summary: summary.summary,
      methodology: summary.methodology,
      formula: summary.formula,
      inputs: [
        { label: "Paid activities", value: paidActivitiesCount },
        { label: "Free activities", value: freeActivitiesCount },
        { label: "Average paid activity cost", value: averagePaidActivityCost }
      ]
    },
    range: {
      minimum: summary.minimum,
      expected: summary.expected,
      high: summary.high,
      currency: input.preferredCurrency
    },
    paidActivitiesCount,
    freeActivitiesCount,
    averagePaidActivityCost,
    lastUpdatedAt: new Date().toISOString(),
    sourceName: "Mock activities estimator"
  };
}

function foodTotal(input: TripSearchInput, destination: DestinationOption): number {
  const food = foodEstimate(input, destination);
  return food.value;
}

function extrasEstimate(
  input: TripSearchInput,
  destination: DestinationOption,
  flights: FlightEstimate,
  lodging: LodgingEstimate
): ExtraCostsEstimate {
  const travelers = Math.max(1, input.travelers.totalTravelers);
  const items = [
    {
      key: "insurance",
      label: "Travel insurance",
      value: input.includeTravelInsurance ? roundCurrency(18 * travelers) : 0,
      confidence: "medium" as PriceConfidence,
      sourceType: "estimated" as const,
      explanation: {
        summary: "Insurance is estimated per traveler.",
        methodology: "Flat per-traveler allowance.",
        formula: "18 x travelers",
        inputs: [{ label: "Travelers", value: travelers }]
      }
    },
    {
      key: "transfers",
      label: "Airport transfers",
      value: input.includeAirportTransfers ? roundCurrency(22 * (destination.countryCode === "US" ? 1.4 : 1)) : 0,
      confidence: "low" as PriceConfidence,
      sourceType: "estimated" as const,
      explanation: {
        summary: "Airport transfers use a fixed local allowance.",
        methodology: "Destination-sensitive transfer estimate.",
        formula: "flat transfer allowance",
        inputs: [{ label: "Destination", value: destination.label }]
      }
    },
    {
      key: "contingency",
      label: "Contingency buffer",
      value: input.includeContingency ? roundCurrency((flights.value + lodging.value) * 0.08) : 0,
      confidence: "medium" as PriceConfidence,
      sourceType: "estimated" as const,
      explanation: {
        summary: "Contingency is a percentage buffer on major fixed costs.",
        methodology: "Buffer applied to flights and lodging.",
        formula: "(flights + lodging) x 0.08",
        inputs: [
          { label: "Flights", value: flights.value },
          { label: "Lodging", value: lodging.value }
        ]
      }
    },
    {
      key: "souvenirs",
      label: "Souvenirs",
      value: input.includeSouvenirs ? roundCurrency(35 * travelers) : 0,
      confidence: "low" as PriceConfidence,
      sourceType: "estimated" as const,
      explanation: {
        summary: "Souvenirs are optional and modeled conservatively.",
        methodology: "Per-traveler discretionary spending allowance.",
        formula: "35 x travelers",
        inputs: [{ label: "Travelers", value: travelers }]
      }
    },
    {
      key: "visa",
      label: "Visa or eTA",
      value: input.includeVisaCosts ? roundCurrency(destination.countryCode === "US" ? 0 : 55 * travelers) : 0,
      confidence: "low" as PriceConfidence,
      sourceType: "estimated" as const,
      explanation: {
        summary: "Visa costs are marked separately when applicable.",
        methodology: "Destination and traveler count guide the allowance.",
        formula: "destination-based visa allowance",
        inputs: [{ label: "Country", value: destination.countryCode }]
      }
    },
    {
      key: "taxes",
      label: "Tourist taxes",
      value: input.includeTouristTaxes ? roundCurrency(lodging.value * 0.07) : 0,
      confidence: "medium" as PriceConfidence,
      sourceType: "estimated" as const,
      explanation: {
        summary: "Tourist taxes are modeled as a lodging surcharge.",
        methodology: "Percentage estimate based on lodging spend.",
        formula: "lodging x 0.07",
        inputs: [{ label: "Lodging", value: lodging.value }]
      }
    },
    {
      key: "tips",
      label: "Tips and service",
      value: input.includeTips ? roundCurrency((flights.value + foodTotal(input, destination)) * 0.04) : 0,
      confidence: "low" as PriceConfidence,
      sourceType: "estimated" as const,
      explanation: {
        summary: "Tips are a small trip-wide allowance.",
        methodology: "Percentage-based discretionary estimate.",
        formula: "(flights + food) x 0.04",
        inputs: [{ label: "Flights", value: flights.value }]
      }
    }
  ];

  const total = roundCurrency(items.reduce((sum, item) => sum + item.value, 0));
  const summary = model(
    total,
    "medium",
    "estimated",
    "Extras bundle optional trip-wide add-ons into a transparent summary.",
    "Each optional item is represented with its own explanation and confidence level.",
    "sum(optional items)",
    0.3
  );

  return {
    value: summary.value,
    total: summary.value,
    currency: input.preferredCurrency,
    sourceType: summary.sourceType,
    confidence: summary.confidence,
    explanation: {
      summary: summary.summary,
      methodology: summary.methodology,
      formula: summary.formula,
      inputs: [{ label: "Optional items", value: items.length }]
    },
    range: {
      minimum: summary.minimum,
      expected: summary.expected,
      high: summary.high,
      currency: input.preferredCurrency
    },
    items: items.map((item) => ({
      ...item,
      value: roundCurrency(item.value)
    })),
    lastUpdatedAt: new Date().toISOString(),
    sourceName: "Mock extras estimator"
  };
}

type ScenarioBase = Pick<
  FinalBudgetSummary,
  "flights" | "lodging" | "food" | "localTransport" | "activities" | "extras"
>;

function scenarioTotals(base: ScenarioBase): Record<"minimum" | "expected" | "high", number> {
  return DEFAULT_COMPARISON_SCENARIOS.reduce(
    (acc, scenario) => {
      const multiplier = scenario.multipliers;
      acc[scenario.key] = roundCurrency(
        base.flights.value * (multiplier.flights ?? 1) +
          base.lodging.value * (multiplier.lodging ?? 1) +
          base.food.value * (multiplier.food ?? 1) +
          base.localTransport.value * (multiplier.localTransport ?? 1) +
          base.activities.value * (multiplier.activities ?? 1) +
          base.extras.value * (multiplier.extras ?? 1)
      );
      return acc;
    },
    { minimum: 0, expected: 0, high: 0 }
  );
}

function summaryFor(input: TripSearchInput, destination: DestinationOption): FinalBudgetSummary {
  const flights = flightEstimate(input, destination);
  const lodging = lodgingEstimate(input, destination);
  const food = foodEstimate(input, destination);
  const localTransport = transportEstimate(input, destination);
  const activities = activitiesEstimate(input, destination);
  const extras = extrasEstimate(input, destination, flights, lodging);
  const total = roundCurrency(
    flights.value +
      lodging.value +
      food.value +
      localTransport.value +
      activities.value +
      extras.value
  );

  return {
    value: total,
    total,
    currency: input.preferredCurrency,
    sourceType: "mock",
    confidence: "medium",
    explanation: {
      summary: "The trip budget combines category estimates with explicit ranges.",
      methodology: "Each category is calculated independently and then summed.",
      formula: "flights + lodging + food + localTransport + activities + extras",
      inputs: [
        { label: "Flights", value: flights.value },
        { label: "Lodging", value: lodging.value },
        { label: "Food", value: food.value },
        { label: "Local transport", value: localTransport.value },
        { label: "Activities", value: activities.value },
        { label: "Extras", value: extras.value }
      ],
      sourceNotes: ["This is a demo fallback until the calculation engine is connected."],
      limitations: ["All trip values are estimates in demo mode."]
    },
    range: {
      minimum: roundCurrency(total * 0.88),
      expected: total,
      high: roundCurrency(total * 1.18),
      currency: input.preferredCurrency
    },
    destination,
    flights,
    lodging,
    food,
    localTransport,
    activities,
    extras,
    totalPerPerson: roundCurrency(total / Math.max(1, input.travelers.totalTravelers)),
    totalPerDay: roundCurrency(total / Math.max(1, input.nights)),
    scenarioTotals: scenarioTotals({
      flights,
      lodging,
      food,
      localTransport,
      activities,
      extras
    }),
    editableCategories: ["flights", "lodging", "food", "localTransport", "activities", "extras"],
    missingDataWarnings: destination.iataCode
      ? ["Results are based on demo data until the BFF returns real API values."]
      : ["Destination metadata is incomplete, so flight confidence is reduced."],
    lastUpdatedAt: new Date().toISOString(),
    sourceName: "Mock trip budget calculator"
  };
}

export function buildMockBudgetResponse(input: TripSearchInput): BudgetApiResponse {
  const destinations = input.destinations.length > 0 ? input.destinations : [mockDestinations[1]];

  return {
    requestedAt: new Date().toISOString(),
    summaries: destinations.map((destination) => summaryFor(input, destination)),
    warnings: [
      "Demo fallback data is being used. Connect the BFF to surface official API results.",
      "Exact pricing, taxes and flight availability may differ from live booking engines."
    ]
  };
}
