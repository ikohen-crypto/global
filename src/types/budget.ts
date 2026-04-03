export type CurrencyCode = string;

export type PriceConfidence = "high" | "medium" | "low";

export type DataSourceType = "api" | "estimated" | "mixed" | "manual" | "mock" | "external";

export type BudgetCategoryKey =
  | "flights"
  | "lodging"
  | "food"
  | "localTransport"
  | "activities"
  | "extras";

export type TravelPartyType = "solo" | "couple" | "family" | "group";

export type LodgingStyle = "saving" | "standard" | "comfortable";

export type FoodStyle = "saving" | "standard" | "comfortable";

export type LocalTransportStyle = "public" | "mixed" | "private";

export type ActivityStyle = "light" | "balanced" | "packed";

export type AccommodationType = "hotel" | "apartment" | "hostel";

export type ScenarioKey = "minimum" | "expected" | "high";

export interface AlternativeTravelOption {
  sourceName: string;
  sourceType: DataSourceType;
  label: string;
  value?: number;
  currency?: CurrencyCode;
  bookingLink?: string;
  note?: string;
  lastUpdatedAt?: string;
}

export interface EstimateExplanation {
  summary: string;
  methodology: string;
  formula?: string;
  inputs: Array<{
    label: string;
    value: number | string;
  }>;
  sourceNotes?: string[];
  technicalNotes?: string[];
  limitations?: string[];
}

export interface MoneyRange {
  minimum: number;
  expected: number;
  high: number;
  currency: CurrencyCode;
}

export interface BudgetValue {
  value: number;
  total?: number;
  currency: CurrencyCode;
  sourceType: DataSourceType;
  confidence: PriceConfidence;
  explanation: EstimateExplanation;
  range: MoneyRange;
  lastUpdatedAt?: string;
  sourceName?: string;
  limitations?: string[];
}

export interface ManualCostOverride {
  value: number;
  currency: CurrencyCode;
  reason?: string;
  appliedAt: string;
}

export interface PassengerBreakdown {
  adults: number;
  children: number;
  infants: number;
  childAges?: number[];
}

export interface TravelerGroup {
  breakdown: PassengerBreakdown;
  totalTravelers: number;
  partyType: TravelPartyType;
}

export interface DestinationOption {
  id: string;
  label: string;
  cityName: string;
  countryName: string;
  countryCode: string;
  iataCode?: string;
  latitude?: number;
  longitude?: number;
  currency: CurrencyCode;
  timeZone?: string;
  airports?: Array<{
    iataCode: string;
    name: string;
  }>;
}

export interface TripSearchInput {
  origin: DestinationOption;
  destinations: DestinationOption[];
  departureDate: string;
  returnDate: string;
  nights: number;
  preferredCurrency: CurrencyCode;
  travelers: TravelerGroup;
  accommodationType: AccommodationType;
  lodgingStyle: LodgingStyle;
  foodStyle: FoodStyle;
  localTransportStyle: LocalTransportStyle;
  activityStyle: ActivityStyle;
  activityCount: number;
  includeCheckedBag: boolean;
  includeTravelInsurance: boolean;
  includeRoaming: boolean;
  includeAirportTransfers: boolean;
  includeContingency: boolean;
  includeSouvenirs: boolean;
  includeVisaCosts: boolean;
  includeTouristTaxes: boolean;
  includeTips: boolean;
  manualOverrides?: Partial<Record<BudgetCategoryKey, ManualCostOverride>>;
}

export interface DestinationContext {
  destination: DestinationOption;
  input: TripSearchInput;
}

export interface FlightPassengerPrice {
  travelerType: "adult" | "child" | "infant";
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sourceType: DataSourceType;
}

export interface FlightEstimate extends BudgetValue {
  perPassenger: number;
  groupTotal: number;
  travelerCount?: number;
  passengerPricing: FlightPassengerPrice[];
  checkedBagCost: number;
  originAirportCode?: string;
  destinationAirportCode?: string;
  secondaryReference?: AlternativeTravelOption;
  bookingLink?: string;
  bookingLinkLabel?: string;
  bookingLinkSource?: "travelpayouts" | "aviasales";
  itinerarySummary?: {
    originAirportCode?: string;
    destinationAirportCode?: string;
    originLabel?: string;
    destinationLabel?: string;
    validatingAirlineCodes: string[];
    validatingAirlineNames: string[];
    stopCount: number;
    totalDuration?: string;
  };
}

export interface LodgingEstimate extends BudgetValue {
  totalNights: number;
  roomCount: number;
  unitType: AccommodationType;
  nightlyRate: number;
  occupancyPlan: Array<{
    roomLabel: string;
    guests: number;
  }>;
  hotelOptions: Array<{
    tier: "saving" | "standard" | "comfortable";
    label: string;
    sourceName: string;
    sourceType: DataSourceType;
    confidence: PriceConfidence;
    propertyName?: string;
    propertyType?: string;
    boardType?: string;
    roomDescription?: string;
    nightlyRate: number;
    stayTotal: number;
    currency: CurrencyCode;
    bookingLink?: string;
    note?: string;
    lastUpdatedAt?: string;
  }>;
  selectedPropertyName?: string;
  selectedPropertyType?: string;
  boardType?: string;
  roomDescription?: string;
  secondaryReference?: AlternativeTravelOption;
  bookingLink?: string;
  bookingLinkLabel?: string;
}

export interface FoodEstimate extends BudgetValue {
  dailyPerPerson: number;
  groupDailyTotal: number;
  style: FoodStyle;
}

export interface LocalTransportEstimate extends BudgetValue {
  dailyGroupCost: number;
  style: LocalTransportStyle;
}

export interface ActivitiesEstimate extends BudgetValue {
  paidActivitiesCount: number;
  freeActivitiesCount: number;
  averagePaidActivityCost: number;
}

export interface ExtraCostsEstimate extends BudgetValue {
  items: Array<{
    key: string;
    label: string;
    value: number;
    sourceType: DataSourceType;
    confidence: PriceConfidence;
    explanation: EstimateExplanation;
  }>;
}

export interface FinalBudgetSummary extends BudgetValue {
  destination: DestinationOption;
  flights: FlightEstimate;
  lodging: LodgingEstimate;
  food: FoodEstimate;
  localTransport: LocalTransportEstimate;
  activities: ActivitiesEstimate;
  extras: ExtraCostsEstimate;
  totalPerPerson: number;
  totalPerDay: number;
  scenarioTotals: Record<ScenarioKey, number>;
  editableCategories: BudgetCategoryKey[];
  missingDataWarnings: string[];
}

export interface ComparisonScenario {
  key: ScenarioKey;
  label: string;
  description: string;
  multipliers: Partial<Record<BudgetCategoryKey, number>>;
}

export interface ComparisonDestinationSnapshot {
  destinationId: string;
  destinationLabel: string;
  summary: FinalBudgetSummary;
  scenarioKey: ScenarioKey;
  scenarioTotal: number;
  totalPerPerson: number;
  totalPerDay: number;
  rank: number;
  savingsFromCheapest: number;
  confidenceScore: number;
}

export interface ComparisonResult {
  scenarios: ComparisonScenario[];
  rankedDestinations: ComparisonDestinationSnapshot[];
  cheapestDestinationId?: string;
  highestConfidenceDestinationId?: string;
}
