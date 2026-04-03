import type {
  ActivityStyle,
  AccommodationType,
  AlternativeTravelOption,
  CurrencyCode,
  DataSourceType,
  DestinationOption,
  FoodStyle,
  LocalTransportStyle,
  LodgingStyle,
  PassengerBreakdown,
  PriceConfidence,
  TripSearchInput
} from "./budget.js";

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface DestinationMetadataRecord {
  destinationId: string;
  destination: DestinationOption;
  coordinates?: LocationCoordinates;
  countryCurrency?: CurrencyCode;
  publicTransportScore?: number;
  taxiCostIndex?: number;
  mealCostIndex?: number;
  touristTaxNightly?: number;
  visaRequired?: boolean;
  destinationTags: string[];
}

export interface FlightReferenceOffer {
  id: string;
  priceTotal: number;
  priceBase?: number;
  currency: CurrencyCode;
  originAirportCode?: string;
  destinationAirportCode?: string;
  validatingAirlineCodes: string[];
  validatingAirlineNames?: string[];
  stopCount: number;
  totalDuration?: string;
  cabinClass?: string;
  departureDate: string;
  returnDate: string;
  passengerBreakdown: Array<{
    travelerType: "adult" | "child" | "infant";
    total: number;
    fare?: number;
    taxes?: number;
  }>;
  checkedBagPrice?: number;
  bookingLink?: string;
  bookingLinkLabel?: string;
  bookingLinkSource?: "travelpayouts" | "aviasales";
  secondaryReference?: AlternativeTravelOption;
  sourceType: Exclude<DataSourceType, "manual">;
}

export interface AccommodationReferenceOffer {
  id: string;
  propertyName: string;
  propertyType?: AccommodationType | string;
  boardType?: string;
  roomDescription?: string;
  nightlyRate: number;
  totalRate: number;
  currency: CurrencyCode;
  maxOccupancy?: number;
  latitude?: number;
  longitude?: number;
  amenities?: string[];
  bookingLink?: string;
  bookingLinkLabel?: string;
  secondaryReference?: AlternativeTravelOption;
  sourceType: Exclude<DataSourceType, "manual">;
}

export interface ActivityReferenceItem {
  id: string;
  title: string;
  description?: string;
  duration?: string;
  price?: number;
  currency: CurrencyCode;
  bookingLink?: string;
  tags: string[];
  isFree: boolean;
  rating?: number;
  sourceType: Exclude<DataSourceType, "manual">;
}

export interface ExchangeRateReference {
  baseCurrency: CurrencyCode;
  rates: Record<CurrencyCode, number>;
  asOf: string;
}

export interface WeatherReference {
  averageMaxCelsius?: number;
  averageMinCelsius?: number;
  precipitationProbability?: number;
}

export interface CountryReference {
  countryCode: string;
  countryName: string;
  capitals?: string[];
  currencies?: CurrencyCode[];
  timezones?: string[];
  region?: string;
  subregion?: string;
  flag?: string;
}

export interface CategoryReferenceEnvelope<TItem> {
  items: TItem[];
  sourceName: string;
  sourceType: Exclude<DataSourceType, "manual">;
  confidence: PriceConfidence;
  fetchedAt: string;
  currency: CurrencyCode;
  limitations: string[];
}

export interface DestinationReferenceData {
  destination: DestinationOption;
  metadata?: CategoryReferenceEnvelope<DestinationMetadataRecord>;
  flights?: CategoryReferenceEnvelope<FlightReferenceOffer>;
  accommodation?: CategoryReferenceEnvelope<AccommodationReferenceOffer>;
  activities?: CategoryReferenceEnvelope<ActivityReferenceItem>;
  exchangeRates?: CategoryReferenceEnvelope<ExchangeRateReference>;
  weather?: CategoryReferenceEnvelope<WeatherReference>;
  warnings: string[];
}

export interface EstimationPreferences {
  lodgingStyle: LodgingStyle;
  foodStyle: FoodStyle;
  localTransportStyle: LocalTransportStyle;
  activityStyle: ActivityStyle;
  accommodationType: AccommodationType;
}

export interface TripComputationContext {
  searchInput: TripSearchInput;
  origin: DestinationOption;
  destination: DestinationOption;
  preferredCurrency: CurrencyCode;
  nights: number;
  travelers: PassengerBreakdown;
  preferences: EstimationPreferences;
  referenceData: DestinationReferenceData;
}
