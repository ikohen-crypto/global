import type { FinalBudgetSummary } from "../types/index.js";
import { buildBookingComSearchLink } from "@/utils/externalLinks";

function buildDemoHotelOptions(
  cityName: string,
  countryName: string,
  basePropertyName: string,
  propertyType: string,
  nights: number,
  roomCount: number,
  nightlyRate: number
) {
  return [
    {
      tier: "saving" as const,
      label: "Budget hotel",
      sourceName: "Mock lodging search",
      sourceType: "mock" as const,
      confidence: "medium" as const,
      propertyName: `${cityName} Budget Stay`,
      propertyType,
      boardType: "room only",
      roomDescription: "Budget-friendly stay with transparent demo pricing.",
      nightlyRate: Math.round(nightlyRate * 0.82),
      stayTotal: Math.round(nightlyRate * 0.82 * nights * roomCount),
      currency: "USD",
      bookingLink: buildBookingComSearchLink({
        cityName,
        countryName,
        propertyName: `${cityName} Budget Stay`,
        adults: 2,
        children: 0,
        rooms: roomCount
      })
    },
    {
      tier: "standard" as const,
      label: "Mid-range hotel",
      sourceName: "Mock lodging search",
      sourceType: "mock" as const,
      confidence: "medium" as const,
      propertyName: basePropertyName,
      propertyType,
      boardType: "room only",
      roomDescription: "Balanced stay with transparent demo pricing.",
      nightlyRate: Math.round(nightlyRate),
      stayTotal: Math.round(nightlyRate * nights * roomCount),
      currency: "USD",
      bookingLink: buildBookingComSearchLink({
        cityName,
        countryName,
        propertyName: basePropertyName,
        adults: 2,
        children: 0,
        rooms: roomCount
      })
    },
    {
      tier: "comfortable" as const,
      label: "Premium hotel",
      sourceName: "Mock lodging search",
      sourceType: "mock" as const,
      confidence: "medium" as const,
      propertyName: `${cityName} Premium Stay`,
      propertyType,
      boardType: "room only",
      roomDescription: "Premium stay with transparent demo pricing.",
      nightlyRate: Math.round(nightlyRate * 1.28),
      stayTotal: Math.round(nightlyRate * 1.28 * nights * roomCount),
      currency: "USD",
      bookingLink: buildBookingComSearchLink({
        cityName,
        countryName,
        propertyName: `${cityName} Premium Stay`,
        adults: 2,
        children: 0,
        rooms: roomCount
      })
    }
  ];
}

function buildSummary(summary: Omit<FinalBudgetSummary, "editableCategories" | "missingDataWarnings">): FinalBudgetSummary {
  return {
    ...summary,
    editableCategories: ["flights", "lodging", "food", "localTransport", "activities", "extras"],
    missingDataWarnings: []
  };
}

export const DEMO_COMPARISON_SUMMARIES: FinalBudgetSummary[] = [
  buildSummary({
    destination: {
      id: "lisbon-pt",
      label: "Lisbon",
      cityName: "Lisbon",
      countryName: "Portugal",
      countryCode: "PT",
      currency: "USD"
    },
    value: 3890,
    currency: "USD",
    sourceType: "mock",
    confidence: "medium",
    explanation: {
      summary: "Demo comparison for a long-weekend European trip.",
      methodology: "Built from representative mock values for UI preview.",
      formula: "category totals + travel buffer",
      inputs: [
        { label: "Nights", value: 5 },
        { label: "Travelers", value: 2 }
      ]
    },
    range: {
      minimum: 3410,
      expected: 3890,
      high: 4630,
      currency: "USD"
    },
    totalPerPerson: 1945,
    totalPerDay: 389,
    scenarioTotals: {
      minimum: 3410,
      expected: 3890,
      high: 4630
    },
    flights: {
      value: 1140,
      currency: "USD",
      sourceType: "mock",
      confidence: "medium",
      explanation: {
        summary: "Demo return flights for two travelers.",
        methodology: "Mock median flight price for UI preview.",
        formula: "per-passenger fare x travelers",
        inputs: [{ label: "Passengers", value: 2 }]
      },
      range: { minimum: 980, expected: 1140, high: 1320, currency: "USD" },
      perPassenger: 570,
      groupTotal: 1140,
      passengerPricing: [
        { travelerType: "adult", quantity: 2, unitPrice: 570, totalPrice: 1140, sourceType: "mock" }
      ],
      checkedBagCost: 0
    },
    lodging: {
      value: 1240,
      currency: "USD",
      sourceType: "mock",
      confidence: "medium",
      explanation: {
        summary: "Demo apartment stay.",
        methodology: "Mock nightly rate times nights.",
        formula: "nightly rate x nights",
        inputs: [{ label: "Nights", value: 5 }]
      },
      range: { minimum: 1080, expected: 1240, high: 1420, currency: "USD" },
      totalNights: 5,
      roomCount: 1,
      unitType: "apartment",
      nightlyRate: 248,
      occupancyPlan: [{ roomLabel: "Main unit", guests: 2 }],
      hotelOptions: buildDemoHotelOptions("Lisbon", "Portugal", "Sample Riverside Apartment", "apartment", 5, 1, 248),
      selectedPropertyName: "Sample Riverside Apartment"
    },
    food: {
      value: 720,
      currency: "USD",
      sourceType: "mock",
      confidence: "medium",
      explanation: {
        summary: "Balanced food budget for two people.",
        methodology: "Daily per-person estimate x travelers x nights.",
        formula: "daily per person x passengers x days",
        inputs: [
          { label: "Daily per person", value: 72 },
          { label: "Passengers", value: 2 },
          { label: "Days", value: 5 }
        ]
      },
      range: { minimum: 620, expected: 720, high: 860, currency: "USD" },
      dailyPerPerson: 72,
      groupDailyTotal: 144,
      style: "standard"
    },
    localTransport: {
      value: 260,
      currency: "USD",
      sourceType: "mock",
      confidence: "low",
      explanation: {
        summary: "Local transit plus a few rideshares.",
        methodology: "Daily city transport estimate x stay length.",
        formula: "daily group cost x days",
        inputs: [{ label: "Days", value: 5 }]
      },
      range: { minimum: 200, expected: 260, high: 340, currency: "USD" },
      dailyGroupCost: 52,
      style: "mixed"
    },
    activities: {
      value: 330,
      currency: "USD",
      sourceType: "mock",
      confidence: "low",
      explanation: {
        summary: "Museum entry and two paid experiences.",
        methodology: "Paid activity count times average ticket estimate.",
        formula: "paid activities x average cost",
        inputs: [{ label: "Paid activities", value: 2 }]
      },
      range: { minimum: 240, expected: 330, high: 470, currency: "USD" },
      paidActivitiesCount: 2,
      freeActivitiesCount: 2,
      averagePaidActivityCost: 110
    },
    extras: {
      value: 200,
      currency: "USD",
      sourceType: "mock",
      confidence: "low",
      explanation: {
        summary: "Insurance, contingency and local fees.",
        methodology: "Bundle of common travel extras.",
        formula: "sum of optional travel add-ons",
        inputs: [{ label: "Included extras", value: 4 }]
      },
      range: { minimum: 150, expected: 200, high: 280, currency: "USD" },
      items: [
        {
          key: "insurance",
          label: "Travel insurance",
          value: 64,
          sourceType: "mock",
          confidence: "low",
          explanation: {
            summary: "Demo insurance line item.",
            methodology: "Fixed demo value.",
            inputs: [{ label: "Travelers", value: 2 }]
          }
        },
        {
          key: "contingency",
          label: "Contingency",
          value: 136,
          sourceType: "mock",
          confidence: "low",
          explanation: {
            summary: "Demo contingency buffer.",
            methodology: "Fixed demo value.",
            inputs: [{ label: "Buffer", value: 1 }]
          }
        }
      ]
    }
  }),
  buildSummary({
    destination: {
      id: "tokyo-jp",
      label: "Tokyo",
      cityName: "Tokyo",
      countryName: "Japan",
      countryCode: "JP",
      currency: "USD"
    },
    value: 5240,
    currency: "USD",
    sourceType: "mock",
    confidence: "medium",
    explanation: {
      summary: "Demo comparison for a longer-haul Asia trip.",
      methodology: "Built from representative mock values for UI preview.",
      formula: "category totals + travel buffer",
      inputs: [
        { label: "Nights", value: 6 },
        { label: "Travelers", value: 2 }
      ]
    },
    range: {
      minimum: 4680,
      expected: 5240,
      high: 6120,
      currency: "USD"
    },
    totalPerPerson: 2620,
    totalPerDay: 436.67,
    scenarioTotals: {
      minimum: 4680,
      expected: 5240,
      high: 6120
    },
    flights: {
      value: 1820,
      currency: "USD",
      sourceType: "mock",
      confidence: "medium",
      explanation: {
        summary: "Demo long-haul flights.",
        methodology: "Mock median flight price for UI preview.",
        formula: "per-passenger fare x travelers",
        inputs: [{ label: "Passengers", value: 2 }]
      },
      range: { minimum: 1600, expected: 1820, high: 2140, currency: "USD" },
      perPassenger: 910,
      groupTotal: 1820,
      passengerPricing: [
        { travelerType: "adult", quantity: 2, unitPrice: 910, totalPrice: 1820, sourceType: "mock" }
      ],
      checkedBagCost: 80
    },
    lodging: {
      value: 1680,
      currency: "USD",
      sourceType: "mock",
      confidence: "medium",
      explanation: {
        summary: "Demo hotel stay.",
        methodology: "Mock nightly rate times nights.",
        formula: "nightly rate x nights",
        inputs: [{ label: "Nights", value: 6 }]
      },
      range: { minimum: 1480, expected: 1680, high: 1960, currency: "USD" },
      totalNights: 6,
      roomCount: 1,
      unitType: "hotel",
      nightlyRate: 280,
      occupancyPlan: [{ roomLabel: "Standard room", guests: 2 }],
      hotelOptions: buildDemoHotelOptions("Tokyo", "Japan", "Sample Central Hotel", "hotel", 6, 1, 280),
      selectedPropertyName: "Sample Central Hotel"
    },
    food: {
      value: 960,
      currency: "USD",
      sourceType: "mock",
      confidence: "medium",
      explanation: {
        summary: "Balanced food budget for two people.",
        methodology: "Daily per-person estimate x travelers x nights.",
        formula: "daily per person x passengers x days",
        inputs: [
          { label: "Daily per person", value: 80 },
          { label: "Passengers", value: 2 },
          { label: "Days", value: 6 }
        ]
      },
      range: { minimum: 860, expected: 960, high: 1120, currency: "USD" },
      dailyPerPerson: 80,
      groupDailyTotal: 160,
      style: "standard"
    },
    localTransport: {
      value: 520,
      currency: "USD",
      sourceType: "mock",
      confidence: "low",
      explanation: {
        summary: "Transit cards plus some taxis.",
        methodology: "Daily city transport estimate x stay length.",
        formula: "daily group cost x days",
        inputs: [{ label: "Days", value: 6 }]
      },
      range: { minimum: 420, expected: 520, high: 700, currency: "USD" },
      dailyGroupCost: 86.67,
      style: "mixed"
    },
    activities: {
      value: 520,
      currency: "USD",
      sourceType: "mock",
      confidence: "low",
      explanation: {
        summary: "Temple passes, museums and a paid experience.",
        methodology: "Paid activity count times average ticket estimate.",
        formula: "paid activities x average cost",
        inputs: [{ label: "Paid activities", value: 3 }]
      },
      range: { minimum: 420, expected: 520, high: 760, currency: "USD" },
      paidActivitiesCount: 3,
      freeActivitiesCount: 2,
      averagePaidActivityCost: 140
    },
    extras: {
      value: 240,
      currency: "USD",
      sourceType: "mock",
      confidence: "low",
      explanation: {
        summary: "Insurance, roaming and contingencies.",
        methodology: "Bundle of common travel extras.",
        formula: "sum of optional travel add-ons",
        inputs: [{ label: "Included extras", value: 4 }]
      },
      range: { minimum: 180, expected: 240, high: 340, currency: "USD" },
      items: [
        {
          key: "insurance",
          label: "Travel insurance",
          value: 72,
          sourceType: "mock",
          confidence: "low",
          explanation: {
            summary: "Demo insurance line item.",
            methodology: "Fixed demo value.",
            inputs: [{ label: "Travelers", value: 2 }]
          }
        },
        {
          key: "contingency",
          label: "Contingency",
          value: 168,
          sourceType: "mock",
          confidence: "low",
          explanation: {
            summary: "Demo contingency buffer.",
            methodology: "Fixed demo value.",
            inputs: [{ label: "Buffer", value: 1 }]
          }
        }
      ]
    }
  }),
  buildSummary({
    destination: {
      id: "cancun-mx",
      label: "Cancun",
      cityName: "Cancun",
      countryName: "Mexico",
      countryCode: "MX",
      currency: "USD"
    },
    value: 4120,
    currency: "USD",
    sourceType: "mock",
    confidence: "medium",
    explanation: {
      summary: "Demo comparison for a beach holiday.",
      methodology: "Built from representative mock values for UI preview.",
      formula: "category totals + travel buffer",
      inputs: [
        { label: "Nights", value: 5 },
        { label: "Travelers", value: 2 }
      ]
    },
    range: {
      minimum: 3610,
      expected: 4120,
      high: 4890,
      currency: "USD"
    },
    totalPerPerson: 2060,
    totalPerDay: 412,
    scenarioTotals: {
      minimum: 3610,
      expected: 4120,
      high: 4890
    },
    flights: {
      value: 1280,
      currency: "USD",
      sourceType: "mock",
      confidence: "medium",
      explanation: {
        summary: "Demo direct flights.",
        methodology: "Mock median flight price for UI preview.",
        formula: "per-passenger fare x travelers",
        inputs: [{ label: "Passengers", value: 2 }]
      },
      range: { minimum: 1120, expected: 1280, high: 1490, currency: "USD" },
      perPassenger: 640,
      groupTotal: 1280,
      passengerPricing: [
        { travelerType: "adult", quantity: 2, unitPrice: 640, totalPrice: 1280, sourceType: "mock" }
      ],
      checkedBagCost: 40
    },
    lodging: {
      value: 1180,
      currency: "USD",
      sourceType: "mock",
      confidence: "medium",
      explanation: {
        summary: "Demo resort stay.",
        methodology: "Mock nightly rate times nights.",
        formula: "nightly rate x nights",
        inputs: [{ label: "Nights", value: 5 }]
      },
      range: { minimum: 1020, expected: 1180, high: 1340, currency: "USD" },
      totalNights: 5,
      roomCount: 1,
      unitType: "hotel",
      nightlyRate: 236,
      occupancyPlan: [{ roomLabel: "Standard room", guests: 2 }],
      hotelOptions: buildDemoHotelOptions("Cancun", "Mexico", "Sample Beach Hotel", "hotel", 5, 1, 236),
      selectedPropertyName: "Sample Beach Hotel"
    },
    food: {
      value: 760,
      currency: "USD",
      sourceType: "mock",
      confidence: "medium",
      explanation: {
        summary: "Balanced food budget for two people.",
        methodology: "Daily per-person estimate x travelers x nights.",
        formula: "daily per person x passengers x days",
        inputs: [
          { label: "Daily per person", value: 76 },
          { label: "Passengers", value: 2 },
          { label: "Days", value: 5 }
        ]
      },
      range: { minimum: 660, expected: 760, high: 900, currency: "USD" },
      dailyPerPerson: 76,
      groupDailyTotal: 152,
      style: "standard"
    },
    localTransport: {
      value: 300,
      currency: "USD",
      sourceType: "mock",
      confidence: "low",
      explanation: {
        summary: "Airport transfer and a few taxis.",
        methodology: "Daily city transport estimate x stay length.",
        formula: "daily group cost x days",
        inputs: [{ label: "Days", value: 5 }]
      },
      range: { minimum: 240, expected: 300, high: 390, currency: "USD" },
      dailyGroupCost: 60,
      style: "mixed"
    },
    activities: {
      value: 420,
      currency: "USD",
      sourceType: "mock",
      confidence: "low",
      explanation: {
        summary: "Water activities and one excursion.",
        methodology: "Paid activity count times average ticket estimate.",
        formula: "paid activities x average cost",
        inputs: [{ label: "Paid activities", value: 2 }]
      },
      range: { minimum: 320, expected: 420, high: 600, currency: "USD" },
      paidActivitiesCount: 2,
      freeActivitiesCount: 3,
      averagePaidActivityCost: 140
    },
    extras: {
      value: 180,
      currency: "USD",
      sourceType: "mock",
      confidence: "low",
      explanation: {
        summary: "Insurance, taxes and contingency.",
        methodology: "Bundle of common travel extras.",
        formula: "sum of optional travel add-ons",
        inputs: [{ label: "Included extras", value: 4 }]
      },
      range: { minimum: 140, expected: 180, high: 270, currency: "USD" },
      items: [
        {
          key: "insurance",
          label: "Travel insurance",
          value: 52,
          sourceType: "mock",
          confidence: "low",
          explanation: {
            summary: "Demo insurance line item.",
            methodology: "Fixed demo value.",
            inputs: [{ label: "Travelers", value: 2 }]
          }
        },
        {
          key: "contingency",
          label: "Contingency",
          value: 128,
          sourceType: "mock",
          confidence: "low",
          explanation: {
            summary: "Demo contingency buffer.",
            methodology: "Fixed demo value.",
            inputs: [{ label: "Buffer", value: 1 }]
          }
        }
      ]
    }
  })
];

export const DEMO_COMPARISON_NAME = "Beach, city and long-haul demo";
