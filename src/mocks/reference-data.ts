import type {
  AccommodationReferenceOffer,
  ActivityReferenceItem,
  CategoryReferenceEnvelope,
  DestinationMetadataRecord,
  DestinationReferenceData,
  ExchangeRateReference,
  FlightReferenceOffer,
  WeatherReference
} from "../types/index.js";
import type { DestinationOption } from "../types/budget.js";

const fetchedAt = "2026-03-23T09:00:00.000Z";

export const MOCK_DESTINATIONS: DestinationOption[] = [
  {
    id: "madrid-es",
    label: "Madrid, Spain",
    cityName: "Madrid",
    countryName: "Spain",
    countryCode: "ES",
    iataCode: "MAD",
    latitude: 40.4168,
    longitude: -3.7038,
    currency: "EUR",
    timeZone: "Europe/Madrid",
    airports: [{ iataCode: "MAD", name: "Adolfo Suarez Madrid-Barajas Airport" }]
  },
  {
    id: "paris-fr",
    label: "Paris, France",
    cityName: "Paris",
    countryName: "France",
    countryCode: "FR",
    iataCode: "PAR",
    latitude: 48.8566,
    longitude: 2.3522,
    currency: "EUR",
    timeZone: "Europe/Paris",
    airports: [
      { iataCode: "CDG", name: "Charles de Gaulle Airport" },
      { iataCode: "ORY", name: "Paris Orly Airport" }
    ]
  },
  {
    id: "new-york-us",
    label: "New York, United States",
    cityName: "New York",
    countryName: "United States",
    countryCode: "US",
    iataCode: "NYC",
    latitude: 40.7128,
    longitude: -74.006,
    currency: "USD",
    timeZone: "America/New_York",
    airports: [
      { iataCode: "JFK", name: "John F. Kennedy International Airport" },
      { iataCode: "LGA", name: "LaGuardia Airport" },
      { iataCode: "EWR", name: "Newark Liberty International Airport" }
    ]
  },
  {
    id: "tokyo-jp",
    label: "Tokyo, Japan",
    cityName: "Tokyo",
    countryName: "Japan",
    countryCode: "JP",
    iataCode: "TYO",
    latitude: 35.6762,
    longitude: 139.6503,
    currency: "JPY",
    timeZone: "Asia/Tokyo",
    airports: [
      { iataCode: "HND", name: "Haneda Airport" },
      { iataCode: "NRT", name: "Narita International Airport" }
    ]
  },
  {
    id: "rome-it",
    label: "Rome, Italy",
    cityName: "Rome",
    countryName: "Italy",
    countryCode: "IT",
    iataCode: "ROM",
    latitude: 41.9028,
    longitude: 12.4964,
    currency: "EUR",
    timeZone: "Europe/Rome",
    airports: [{ iataCode: "FCO", name: "Leonardo da Vinci Airport" }]
  },
  {
    id: "barcelona-es",
    label: "Barcelona, Spain",
    cityName: "Barcelona",
    countryName: "Spain",
    countryCode: "ES",
    iataCode: "BCN",
    latitude: 41.3874,
    longitude: 2.1686,
    currency: "EUR",
    timeZone: "Europe/Madrid",
    airports: [{ iataCode: "BCN", name: "Barcelona El Prat Airport" }]
  },
  {
    id: "lisbon-pt",
    label: "Lisbon, Portugal",
    cityName: "Lisbon",
    countryName: "Portugal",
    countryCode: "PT",
    iataCode: "LIS",
    latitude: 38.7223,
    longitude: -9.1393,
    currency: "EUR",
    timeZone: "Europe/Lisbon",
    airports: [{ iataCode: "LIS", name: "Humberto Delgado Airport" }]
  },
  {
    id: "london-gb",
    label: "London, United Kingdom",
    cityName: "London",
    countryName: "United Kingdom",
    countryCode: "GB",
    iataCode: "LON",
    latitude: 51.5072,
    longitude: -0.1276,
    currency: "GBP",
    timeZone: "Europe/London",
    airports: [
      { iataCode: "LHR", name: "Heathrow Airport" },
      { iataCode: "LGW", name: "Gatwick Airport" }
    ]
  },
  {
    id: "amsterdam-nl",
    label: "Amsterdam, Netherlands",
    cityName: "Amsterdam",
    countryName: "Netherlands",
    countryCode: "NL",
    iataCode: "AMS",
    latitude: 52.3676,
    longitude: 4.9041,
    currency: "EUR",
    timeZone: "Europe/Amsterdam",
    airports: [{ iataCode: "AMS", name: "Amsterdam Airport Schiphol" }]
  },
  {
    id: "berlin-de",
    label: "Berlin, Germany",
    cityName: "Berlin",
    countryName: "Germany",
    countryCode: "DE",
    iataCode: "BER",
    latitude: 52.52,
    longitude: 13.405,
    currency: "EUR",
    timeZone: "Europe/Berlin",
    airports: [{ iataCode: "BER", name: "Berlin Brandenburg Airport" }]
  },
  {
    id: "vienna-at",
    label: "Vienna, Austria",
    cityName: "Vienna",
    countryName: "Austria",
    countryCode: "AT",
    iataCode: "VIE",
    latitude: 48.2082,
    longitude: 16.3738,
    currency: "EUR",
    timeZone: "Europe/Vienna",
    airports: [{ iataCode: "VIE", name: "Vienna International Airport" }]
  },
  {
    id: "prague-cz",
    label: "Prague, Czech Republic",
    cityName: "Prague",
    countryName: "Czech Republic",
    countryCode: "CZ",
    iataCode: "PRG",
    latitude: 50.0755,
    longitude: 14.4378,
    currency: "EUR",
    timeZone: "Europe/Prague",
    airports: [{ iataCode: "PRG", name: "Vaclav Havel Airport Prague" }]
  },
  {
    id: "athens-gr",
    label: "Athens, Greece",
    cityName: "Athens",
    countryName: "Greece",
    countryCode: "GR",
    iataCode: "ATH",
    latitude: 37.9838,
    longitude: 23.7275,
    currency: "EUR",
    timeZone: "Europe/Athens",
    airports: [{ iataCode: "ATH", name: "Athens International Airport" }]
  },
  {
    id: "istanbul-tr",
    label: "Istanbul, Turkey",
    cityName: "Istanbul",
    countryName: "Turkey",
    countryCode: "TR",
    iataCode: "IST",
    latitude: 41.0082,
    longitude: 28.9784,
    currency: "EUR",
    timeZone: "Europe/Istanbul",
    airports: [{ iataCode: "IST", name: "Istanbul Airport" }]
  },
  {
    id: "tel-aviv-il",
    label: "Tel Aviv, Israel",
    cityName: "Tel Aviv",
    countryName: "Israel",
    countryCode: "IL",
    iataCode: "TLV",
    latitude: 32.0853,
    longitude: 34.7818,
    currency: "ILS",
    timeZone: "Asia/Jerusalem",
    airports: [{ iataCode: "TLV", name: "Ben Gurion Airport" }]
  },
  {
    id: "jerusalem-il",
    label: "Jerusalem, Israel",
    cityName: "Jerusalem",
    countryName: "Israel",
    countryCode: "IL",
    iataCode: "JRS",
    latitude: 31.7683,
    longitude: 35.2137,
    currency: "ILS",
    timeZone: "Asia/Jerusalem",
    airports: [{ iataCode: "TLV", name: "Ben Gurion Airport" }]
  },
  {
    id: "dubai-ae",
    label: "Dubai, United Arab Emirates",
    cityName: "Dubai",
    countryName: "United Arab Emirates",
    countryCode: "AE",
    iataCode: "DXB",
    latitude: 25.2048,
    longitude: 55.2708,
    currency: "AED",
    timeZone: "Asia/Dubai",
    airports: [{ iataCode: "DXB", name: "Dubai International Airport" }]
  },
  {
    id: "singapore-sg",
    label: "Singapore, Singapore",
    cityName: "Singapore",
    countryName: "Singapore",
    countryCode: "SG",
    iataCode: "SIN",
    latitude: 1.3521,
    longitude: 103.8198,
    currency: "USD",
    timeZone: "Asia/Singapore",
    airports: [{ iataCode: "SIN", name: "Singapore Changi Airport" }]
  },
  {
    id: "bangkok-th",
    label: "Bangkok, Thailand",
    cityName: "Bangkok",
    countryName: "Thailand",
    countryCode: "TH",
    iataCode: "BKK",
    latitude: 13.7563,
    longitude: 100.5018,
    currency: "THB",
    timeZone: "Asia/Bangkok",
    airports: [{ iataCode: "BKK", name: "Suvarnabhumi Airport" }]
  },
  {
    id: "seoul-kr",
    label: "Seoul, South Korea",
    cityName: "Seoul",
    countryName: "South Korea",
    countryCode: "KR",
    iataCode: "SEL",
    latitude: 37.5665,
    longitude: 126.978,
    currency: "JPY",
    timeZone: "Asia/Seoul",
    airports: [{ iataCode: "ICN", name: "Incheon International Airport" }]
  },
  {
    id: "osaka-jp",
    label: "Osaka, Japan",
    cityName: "Osaka",
    countryName: "Japan",
    countryCode: "JP",
    iataCode: "OSA",
    latitude: 34.6937,
    longitude: 135.5023,
    currency: "JPY",
    timeZone: "Asia/Tokyo",
    airports: [{ iataCode: "KIX", name: "Kansai International Airport" }]
  },
  {
    id: "kyoto-jp",
    label: "Kyoto, Japan",
    cityName: "Kyoto",
    countryName: "Japan",
    countryCode: "JP",
    iataCode: "UKY",
    latitude: 35.0116,
    longitude: 135.7681,
    currency: "JPY",
    timeZone: "Asia/Tokyo",
    airports: [{ iataCode: "KIX", name: "Kansai International Airport" }]
  },
  {
    id: "bali-id",
    label: "Bali, Indonesia",
    cityName: "Bali",
    countryName: "Indonesia",
    countryCode: "ID",
    iataCode: "DPS",
    latitude: -8.3405,
    longitude: 115.092,
    currency: "USD",
    timeZone: "Asia/Makassar",
    airports: [{ iataCode: "DPS", name: "Ngurah Rai International Airport" }]
  },
  {
    id: "hong-kong-hk",
    label: "Hong Kong, Hong Kong",
    cityName: "Hong Kong",
    countryName: "Hong Kong",
    countryCode: "HK",
    iataCode: "HKG",
    latitude: 22.3193,
    longitude: 114.1694,
    currency: "USD",
    timeZone: "Asia/Hong_Kong",
    airports: [{ iataCode: "HKG", name: "Hong Kong International Airport" }]
  },
  {
    id: "sydney-au",
    label: "Sydney, Australia",
    cityName: "Sydney",
    countryName: "Australia",
    countryCode: "AU",
    iataCode: "SYD",
    latitude: -33.8688,
    longitude: 151.2093,
    currency: "USD",
    timeZone: "Australia/Sydney",
    airports: [{ iataCode: "SYD", name: "Sydney Airport" }]
  },
  {
    id: "melbourne-au",
    label: "Melbourne, Australia",
    cityName: "Melbourne",
    countryName: "Australia",
    countryCode: "AU",
    iataCode: "MEL",
    latitude: -37.8136,
    longitude: 144.9631,
    currency: "USD",
    timeZone: "Australia/Melbourne",
    airports: [{ iataCode: "MEL", name: "Melbourne Airport" }]
  },
  {
    id: "cape-town-za",
    label: "Cape Town, South Africa",
    cityName: "Cape Town",
    countryName: "South Africa",
    countryCode: "ZA",
    iataCode: "CPT",
    latitude: -33.9249,
    longitude: 18.4241,
    currency: "USD",
    timeZone: "Africa/Johannesburg",
    airports: [{ iataCode: "CPT", name: "Cape Town International Airport" }]
  },
  {
    id: "cairo-eg",
    label: "Cairo, Egypt",
    cityName: "Cairo",
    countryName: "Egypt",
    countryCode: "EG",
    iataCode: "CAI",
    latitude: 30.0444,
    longitude: 31.2357,
    currency: "EUR",
    timeZone: "Africa/Cairo",
    airports: [{ iataCode: "CAI", name: "Cairo International Airport" }]
  },
  {
    id: "buenos-aires-ar",
    label: "Buenos Aires, Argentina",
    cityName: "Buenos Aires",
    countryName: "Argentina",
    countryCode: "AR",
    iataCode: "BUE",
    latitude: -34.6037,
    longitude: -58.3816,
    currency: "ARS",
    timeZone: "America/Argentina/Buenos_Aires",
    airports: [
      { iataCode: "EZE", name: "Ministro Pistarini International Airport" },
      { iataCode: "AEP", name: "Jorge Newbery Airfield" }
    ]
  },
  {
    id: "rio-de-janeiro-br",
    label: "Rio de Janeiro, Brazil",
    cityName: "Rio de Janeiro",
    countryName: "Brazil",
    countryCode: "BR",
    iataCode: "RIO",
    latitude: -22.9068,
    longitude: -43.1729,
    currency: "USD",
    timeZone: "America/Sao_Paulo",
    airports: [{ iataCode: "GIG", name: "Rio de Janeiro Galeao Airport" }]
  },
  {
    id: "sao-paulo-br",
    label: "Sao Paulo, Brazil",
    cityName: "Sao Paulo",
    countryName: "Brazil",
    countryCode: "BR",
    iataCode: "SAO",
    latitude: -23.5558,
    longitude: -46.6396,
    currency: "USD",
    timeZone: "America/Sao_Paulo",
    airports: [{ iataCode: "GRU", name: "Sao Paulo Guarulhos Airport" }]
  },
  {
    id: "lima-pe",
    label: "Lima, Peru",
    cityName: "Lima",
    countryName: "Peru",
    countryCode: "PE",
    iataCode: "LIM",
    latitude: -12.0464,
    longitude: -77.0428,
    currency: "USD",
    timeZone: "America/Lima",
    airports: [{ iataCode: "LIM", name: "Jorge Chavez International Airport" }]
  },
  {
    id: "bogota-co",
    label: "Bogota, Colombia",
    cityName: "Bogota",
    countryName: "Colombia",
    countryCode: "CO",
    iataCode: "BOG",
    latitude: 4.711,
    longitude: -74.0721,
    currency: "USD",
    timeZone: "America/Bogota",
    airports: [{ iataCode: "BOG", name: "El Dorado International Airport" }]
  },
  {
    id: "santiago-cl",
    label: "Santiago, Chile",
    cityName: "Santiago",
    countryName: "Chile",
    countryCode: "CL",
    iataCode: "SCL",
    latitude: -33.4489,
    longitude: -70.6693,
    currency: "USD",
    timeZone: "America/Santiago",
    airports: [{ iataCode: "SCL", name: "Arturo Merino Benitez International Airport" }]
  },
  {
    id: "mexico-city-mx",
    label: "Mexico City, Mexico",
    cityName: "Mexico City",
    countryName: "Mexico",
    countryCode: "MX",
    iataCode: "MEX",
    latitude: 19.4326,
    longitude: -99.1332,
    currency: "MXN",
    timeZone: "America/Mexico_City",
    airports: [{ iataCode: "MEX", name: "Benito Juarez International Airport" }]
  },
  {
    id: "cancun-mx",
    label: "Cancun, Mexico",
    cityName: "Cancun",
    countryName: "Mexico",
    countryCode: "MX",
    iataCode: "CUN",
    latitude: 21.1619,
    longitude: -86.8515,
    currency: "MXN",
    timeZone: "America/Cancun",
    airports: [{ iataCode: "CUN", name: "Cancun International Airport" }]
  },
  {
    id: "miami-us",
    label: "Miami, United States",
    cityName: "Miami",
    countryName: "United States",
    countryCode: "US",
    iataCode: "MIA",
    latitude: 25.7617,
    longitude: -80.1918,
    currency: "USD",
    timeZone: "America/New_York",
    airports: [{ iataCode: "MIA", name: "Miami International Airport" }]
  },
  {
    id: "los-angeles-us",
    label: "Los Angeles, United States",
    cityName: "Los Angeles",
    countryName: "United States",
    countryCode: "US",
    iataCode: "LAX",
    latitude: 34.0549,
    longitude: -118.2426,
    currency: "USD",
    timeZone: "America/Los_Angeles",
    airports: [{ iataCode: "LAX", name: "Los Angeles International Airport" }]
  },
  {
    id: "san-francisco-us",
    label: "San Francisco, United States",
    cityName: "San Francisco",
    countryName: "United States",
    countryCode: "US",
    iataCode: "SFO",
    latitude: 37.7749,
    longitude: -122.4194,
    currency: "USD",
    timeZone: "America/Los_Angeles",
    airports: [{ iataCode: "SFO", name: "San Francisco International Airport" }]
  },
  {
    id: "chicago-us",
    label: "Chicago, United States",
    cityName: "Chicago",
    countryName: "United States",
    countryCode: "US",
    iataCode: "CHI",
    latitude: 41.8781,
    longitude: -87.6298,
    currency: "USD",
    timeZone: "America/Chicago",
    airports: [{ iataCode: "ORD", name: "O Hare International Airport" }]
  },
  {
    id: "toronto-ca",
    label: "Toronto, Canada",
    cityName: "Toronto",
    countryName: "Canada",
    countryCode: "CA",
    iataCode: "YTO",
    latitude: 43.6532,
    longitude: -79.3832,
    currency: "USD",
    timeZone: "America/Toronto",
    airports: [{ iataCode: "YYZ", name: "Toronto Pearson International Airport" }]
  },
  {
    id: "vancouver-ca",
    label: "Vancouver, Canada",
    cityName: "Vancouver",
    countryName: "Canada",
    countryCode: "CA",
    iataCode: "YVR",
    latitude: 49.2827,
    longitude: -123.1207,
    currency: "USD",
    timeZone: "America/Vancouver",
    airports: [{ iataCode: "YVR", name: "Vancouver International Airport" }]
  }
];

const destinationMetadata: Record<string, DestinationMetadataRecord> = {
  "madrid-es": {
    destinationId: "madrid-es",
    destination: MOCK_DESTINATIONS[0],
    coordinates: { latitude: 40.4168, longitude: -3.7038 },
    countryCurrency: "EUR",
    publicTransportScore: 8.8,
    taxiCostIndex: 0.6,
    mealCostIndex: 0.7,
    touristTaxNightly: 3.5,
    visaRequired: false,
    destinationTags: ["capital", "walkable", "museums"]
  },
  "paris-fr": {
    destinationId: "paris-fr",
    destination: MOCK_DESTINATIONS[1],
    coordinates: { latitude: 48.8566, longitude: 2.3522 },
    countryCurrency: "EUR",
    publicTransportScore: 8.5,
    taxiCostIndex: 0.9,
    mealCostIndex: 0.85,
    touristTaxNightly: 5,
    visaRequired: false,
    destinationTags: ["capital", "romantic", "art"]
  },
  "new-york-us": {
    destinationId: "new-york-us",
    destination: MOCK_DESTINATIONS[2],
    coordinates: { latitude: 40.7128, longitude: -74.006 },
    countryCurrency: "USD",
    publicTransportScore: 8.2,
    taxiCostIndex: 1.25,
    mealCostIndex: 1.1,
    touristTaxNightly: 4.5,
    visaRequired: true,
    destinationTags: ["city-break", "shopping", "broadway"]
  },
  "tokyo-jp": {
    destinationId: "tokyo-jp",
    destination: MOCK_DESTINATIONS[3],
    coordinates: { latitude: 35.6762, longitude: 139.6503 },
    countryCurrency: "JPY",
    publicTransportScore: 9.7,
    taxiCostIndex: 1.4,
    mealCostIndex: 1.05,
    touristTaxNightly: 0,
    visaRequired: false,
    destinationTags: ["megacity", "food", "technology"]
  }
};

const exchangeRates: ExchangeRateReference = {
  baseCurrency: "EUR",
  rates: {
    EUR: 1,
    USD: 1.09,
    GBP: 0.86,
    ILS: 4.02,
    JPY: 163.5,
    MXN: 18.4,
    ARS: 1120,
    AED: 4.0,
    THB: 39.2
  },
  asOf: fetchedAt
};

const flights: Record<string, FlightReferenceOffer[]> = {
  "madrid-es": [
    {
      id: "flight-mad-nyc-1",
      priceTotal: 820,
      priceBase: 690,
      currency: "USD",
      validatingAirlineCodes: ["IB", "AA"],
      stopCount: 1,
      totalDuration: "11h 45m",
      cabinClass: "ECONOMY",
      departureDate: "2026-05-10",
      returnDate: "2026-05-17",
      passengerBreakdown: [
        { travelerType: "adult", total: 2, fare: 345, taxes: 35 }
      ],
      checkedBagPrice: 90,
      sourceType: "mock"
    }
  ],
  "paris-fr": [
    {
      id: "flight-par-tok-1",
      priceTotal: 1240,
      priceBase: 1070,
      currency: "EUR",
      validatingAirlineCodes: ["AF", "JL"],
      stopCount: 1,
      totalDuration: "14h 20m",
      cabinClass: "ECONOMY",
      departureDate: "2026-05-10",
      returnDate: "2026-05-17",
      passengerBreakdown: [
        { travelerType: "adult", total: 2, fare: 535, taxes: 100 }
      ],
      checkedBagPrice: 120,
      sourceType: "mock"
    }
  ],
  "new-york-us": [
    {
      id: "flight-nyc-mad-1",
      priceTotal: 690,
      priceBase: 575,
      currency: "USD",
      validatingAirlineCodes: ["DL", "UX"],
      stopCount: 0,
      totalDuration: "7h 35m",
      cabinClass: "ECONOMY",
      departureDate: "2026-05-10",
      returnDate: "2026-05-17",
      passengerBreakdown: [
        { travelerType: "adult", total: 2, fare: 287.5, taxes: 25 }
      ],
      checkedBagPrice: 80,
      sourceType: "mock"
    }
  ],
  "tokyo-jp": [
    {
      id: "flight-tyo-par-1",
      priceTotal: 1580,
      priceBase: 1390,
      currency: "JPY",
      validatingAirlineCodes: ["NH", "AF"],
      stopCount: 1,
      totalDuration: "17h 50m",
      cabinClass: "ECONOMY",
      departureDate: "2026-05-10",
      returnDate: "2026-05-17",
      passengerBreakdown: [
        { travelerType: "adult", total: 2, fare: 695, taxes: 95 }
      ],
      checkedBagPrice: 115,
      sourceType: "mock"
    }
  ]
};

const accommodation: Record<string, AccommodationReferenceOffer[]> = {
  "madrid-es": [
    {
      id: "hotel-mad-1",
      propertyName: "Gran Via Central Suites",
      propertyType: "apartment",
      boardType: "room only",
      roomDescription: "Two-bedroom apartment with kitchen",
      nightlyRate: 165,
      totalRate: 990,
      currency: "EUR",
      maxOccupancy: 4,
      latitude: 40.42,
      longitude: -3.7,
      amenities: ["wifi", "kitchen", "washer"],
      sourceType: "mock"
    }
  ],
  "paris-fr": [
    {
      id: "hotel-par-1",
      propertyName: "Left Bank Boutique Hotel",
      propertyType: "hotel",
      boardType: "breakfast included",
      roomDescription: "Double room near the Seine",
      nightlyRate: 220,
      totalRate: 1320,
      currency: "EUR",
      maxOccupancy: 2,
      latitude: 48.85,
      longitude: 2.34,
      amenities: ["wifi", "breakfast", "air-conditioning"],
      sourceType: "mock"
    }
  ],
  "new-york-us": [
    {
      id: "hotel-nyc-1",
      propertyName: "Midtown City Loft",
      propertyType: "apartment",
      boardType: "room only",
      roomDescription: "One-bedroom apartment for four",
      nightlyRate: 275,
      totalRate: 1650,
      currency: "USD",
      maxOccupancy: 4,
      latitude: 40.75,
      longitude: -73.99,
      amenities: ["wifi", "kitchen", "gym"],
      sourceType: "mock"
    }
  ],
  "tokyo-jp": [
    {
      id: "hotel-tyo-1",
      propertyName: "Shibuya Quiet Stay",
      propertyType: "hotel",
      boardType: "room only",
      roomDescription: "Compact twin room",
      nightlyRate: 19500,
      totalRate: 117000,
      currency: "JPY",
      maxOccupancy: 2,
      latitude: 35.66,
      longitude: 139.7,
      amenities: ["wifi", "laundry", "reception-24h"],
      sourceType: "mock"
    }
  ]
};

const activities: Record<string, ActivityReferenceItem[]> = {
  "madrid-es": [
    {
      id: "act-mad-1",
      title: "Prado Museum guided entry",
      description: "Timed admission with a small-group guided introduction.",
      duration: "3h",
      price: 38,
      currency: "EUR",
      bookingLink: "https://example.com/madrid-prado",
      tags: ["museum", "culture"],
      isFree: false,
      rating: 4.8,
      sourceType: "mock"
    },
    {
      id: "act-mad-2",
      title: "Retiro Park walk",
      duration: "2h",
      price: 0,
      currency: "EUR",
      tags: ["free", "outdoors"],
      isFree: true,
      rating: 4.7,
      sourceType: "mock"
    }
  ],
  "paris-fr": [
    {
      id: "act-par-1",
      title: "Seine river cruise",
      duration: "1h 15m",
      price: 29,
      currency: "EUR",
      bookingLink: "https://example.com/paris-cruise",
      tags: ["sightseeing", "romantic"],
      isFree: false,
      rating: 4.6,
      sourceType: "mock"
    },
    {
      id: "act-par-2",
      title: "Montmartre neighborhood walk",
      duration: "2h",
      price: 0,
      currency: "EUR",
      tags: ["free", "walking"],
      isFree: true,
      rating: 4.7,
      sourceType: "mock"
    }
  ],
  "new-york-us": [
    {
      id: "act-nyc-1",
      title: "Broadway backstage tour",
      duration: "2h",
      price: 65,
      currency: "USD",
      bookingLink: "https://example.com/nyc-broadway",
      tags: ["theatre", "city"],
      isFree: false,
      rating: 4.9,
      sourceType: "mock"
    },
    {
      id: "act-nyc-2",
      title: "Central Park self-guided loop",
      duration: "3h",
      price: 0,
      currency: "USD",
      tags: ["free", "outdoors"],
      isFree: true,
      rating: 4.8,
      sourceType: "mock"
    }
  ],
  "tokyo-jp": [
    {
      id: "act-tyo-1",
      title: "Senso-ji and Asakusa food walk",
      duration: "4h",
      price: 8800,
      currency: "JPY",
      bookingLink: "https://example.com/tokyo-asakusa",
      tags: ["food", "culture"],
      isFree: false,
      rating: 4.9,
      sourceType: "mock"
    }
  ]
};

const weather: Record<string, WeatherReference> = {
  "madrid-es": { averageMaxCelsius: 27, averageMinCelsius: 16, precipitationProbability: 18 },
  "paris-fr": { averageMaxCelsius: 24, averageMinCelsius: 14, precipitationProbability: 27 },
  "new-york-us": { averageMaxCelsius: 28, averageMinCelsius: 19, precipitationProbability: 24 },
  "tokyo-jp": { averageMaxCelsius: 29, averageMinCelsius: 22, precipitationProbability: 32 }
};

function envelope<TItem>(
  sourceName: string,
  currency: string,
  items: TItem[],
  confidence: "high" | "medium" | "low",
  limitations: string[] = [],
  sourceType: "api" | "estimated" | "mixed" | "mock" = "mock"
): CategoryReferenceEnvelope<TItem> {
  return {
    items,
    sourceName,
    sourceType,
    confidence,
    fetchedAt,
    currency,
    limitations
  };
}

export function mockDestinationReferenceData(destination: DestinationOption): DestinationReferenceData {
  const key = destination.id in destinationMetadata ? destination.id : "madrid-es";
  const metadataRecord = destinationMetadata[key];
  return {
    destination,
    metadata: envelope("Mock reference data", destination.currency, [{ ...metadataRecord, destination }], "high"),
    flights: envelope("Mock reference data", destination.currency, flights[key] ?? [], "high"),
    accommodation: envelope("Mock reference data", destination.currency, accommodation[key] ?? [], "high"),
    activities: envelope("Mock reference data", destination.currency, activities[key] ?? [], "high"),
    exchangeRates: envelope("Mock reference data", exchangeRates.baseCurrency, [exchangeRates], "high"),
    weather: envelope("Mock reference data", destination.currency, [weather[key] ?? {}], "medium"),
    warnings: []
  };
}

export function mockDestinationMetadata(destination: DestinationOption): DestinationMetadataRecord {
  const record = destinationMetadata[destination.id] ?? destinationMetadata["madrid-es"];
  return {
    ...record,
    destination
  };
}

export function mockFlightOffers(destination: DestinationOption): FlightReferenceOffer[] {
  return flights[destination.id] ?? [];
}

export function mockAccommodationOffers(destination: DestinationOption): AccommodationReferenceOffer[] {
  return accommodation[destination.id] ?? [];
}

export function mockActivityItems(destination: DestinationOption): ActivityReferenceItem[] {
  return activities[destination.id] ?? [];
}

export function mockExchangeRates(): ExchangeRateReference {
  return exchangeRates;
}

export function mockWeather(destination: DestinationOption): WeatherReference {
  return weather[destination.id] ?? {};
}

export function mockDestinationList(): DestinationOption[] {
  return MOCK_DESTINATIONS;
}
