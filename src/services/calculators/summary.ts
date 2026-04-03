import type {
  ActivitiesEstimate,
  BudgetCategoryKey,
  ComparisonScenario,
  DestinationOption,
  ExtraCostsEstimate,
  FinalBudgetSummary,
  FlightEstimate,
  FoodEstimate,
  LodgingEstimate,
  LocalTransportEstimate,
  ManualCostOverride
} from "@/types";
import {
  combineConfidence,
  combineSourceType,
  createBudgetValue,
  createExplanation,
  money,
  scenarioTotal,
  sum
} from "@/services/calculators/common";
import {
  calculateActivitiesBudget,
  type ActivitiesBudgetOptions
} from "@/services/calculators/activities";
import {
  calculateExtraCosts,
  type ExtraBudgetOptions
} from "@/services/calculators/extras";
import {
  calculateFlightBudget,
  type FlightBudgetOptions
} from "@/services/calculators/flight";
import {
  calculateFoodBudget,
  type FoodBudgetOptions
} from "@/services/calculators/food";
import {
  calculateLocalTransportBudget,
  type LocalTransportBudgetOptions
} from "@/services/calculators/localTransport";
import {
  calculateLodgingBudget,
  type LodgingBudgetOptions
} from "@/services/calculators/lodging";
import type { TripComputationContext } from "@/types";
import { DEFAULT_COMPARISON_SCENARIOS } from "@/config/app";
import { getTripDaysFromNights } from "@/utils/date";

export interface BudgetComputationOptions {
  includeCheckedBag?: boolean;
  includeTravelInsurance?: boolean;
  includeRoaming?: boolean;
  includeAirportTransfers?: boolean;
  includeContingency?: boolean;
  includeSouvenirs?: boolean;
  includeVisaCosts?: boolean;
  includeTouristTaxes?: boolean;
  includeTips?: boolean;
  activityCount?: number;
  scenarios?: ComparisonScenario[];
  overrides?: Partial<Record<BudgetCategoryKey, ManualCostOverride>>;
}

function computeScenarioTotals(
  categories: Record<BudgetCategoryKey, FinalBudgetSummary["flights"] | FlightEstimate | LodgingEstimate | FoodEstimate | LocalTransportEstimate | ActivitiesEstimate | ExtraCostsEstimate>,
  scenarios: ComparisonScenario[]
): Record<ComparisonScenario["key"], number> {
  return scenarios.reduce((accumulator, scenario) => {
    accumulator[scenario.key] = scenarioTotal(categories as Record<BudgetCategoryKey, any>, scenario);
    return accumulator;
  }, {} as Record<ComparisonScenario["key"], number>);
}

export function buildFinalBudgetSummary(
  context: TripComputationContext,
  options?: BudgetComputationOptions
): FinalBudgetSummary {
  const flightOptions: FlightBudgetOptions = {
    includeCheckedBag: options?.includeCheckedBag,
    override: options?.overrides?.flights
  };
  const lodgingOptions: LodgingBudgetOptions = {
    override: options?.overrides?.lodging
  };
  const foodOptions: FoodBudgetOptions = {
    override: options?.overrides?.food
  };
  const transportOptions: LocalTransportBudgetOptions = {
    override: options?.overrides?.localTransport
  };
  const activityOptions: ActivitiesBudgetOptions = {
    override: options?.overrides?.activities,
    activityCount: options?.activityCount
  };
  const extrasOptions: ExtraBudgetOptions = {
    includeCheckedBag: options?.includeCheckedBag,
    includeTravelInsurance: options?.includeTravelInsurance,
    includeRoaming: options?.includeRoaming,
    includeAirportTransfers: options?.includeAirportTransfers,
    includeContingency: options?.includeContingency,
    includeSouvenirs: options?.includeSouvenirs,
    includeVisaCosts: options?.includeVisaCosts,
    includeTouristTaxes: options?.includeTouristTaxes,
    includeTips: options?.includeTips,
    override: options?.overrides?.extras
  };

  const flights = calculateFlightBudget(context, flightOptions);
  const lodging = calculateLodgingBudget(context, lodgingOptions);
  const food = calculateFoodBudget(context, foodOptions);
  const localTransport = calculateLocalTransportBudget(context, transportOptions);
  const activities = calculateActivitiesBudget(context, activityOptions);
  const extras = calculateExtraCosts(context, {
    ...extrasOptions,
    flightBudget: flights,
    lodgingBudget: lodging
  });

  const categories = {
    flights,
    lodging,
    food,
    localTransport,
    activities,
    extras
  } satisfies Record<BudgetCategoryKey, FlightEstimate | LodgingEstimate | FoodEstimate | LocalTransportEstimate | ActivitiesEstimate | ExtraCostsEstimate>;

  const expectedTotal = sum(Object.values(categories).map((item) => item.value));
  const minimumTotal = sum(Object.values(categories).map((item) => item.range.minimum));
  const highTotal = sum(Object.values(categories).map((item) => item.range.high));
  const preferredCurrency = context.preferredCurrency;
  const tripDays = getTripDaysFromNights(context.nights);
  const travelers = context.travelers.adults + context.travelers.children + context.travelers.infants;
  const scenarios = options?.scenarios ?? DEFAULT_COMPARISON_SCENARIOS;

  return {
    ...createBudgetValue({
      value: expectedTotal,
      currency: preferredCurrency,
      sourceType: combineSourceType(Object.values(categories).map((item) => item.sourceType)),
      confidence: combineConfidence(Object.values(categories).map((item) => item.confidence)),
      explanation: createExplanation(
        "Trip budget summary combines flights, lodging, food, local transport, activities and extras.",
        "Totals are derived from category-level outputs so each line item remains auditable and editable.",
        [
          { label: "Flights", value: flights.value },
          { label: "Lodging", value: lodging.value },
          { label: "Food", value: food.value },
          { label: "Local transport", value: localTransport.value },
          { label: "Activities", value: activities.value },
          { label: "Extras", value: extras.value }
        ],
        {
          formula: "sum(category totals)",
          sourceNotes: Object.entries(categories).map(([key, value]) => `${key}: ${value.sourceType}`),
          limitations: context.referenceData.warnings
        }
      ),
      range: {
        minimum: minimumTotal,
        expected: expectedTotal,
        high: highTotal,
        currency: preferredCurrency
      }
    }),
    destination: context.destination,
    flights,
    lodging,
    food,
    localTransport,
    activities,
    extras,
    totalPerPerson: money(expectedTotal / Math.max(1, travelers)),
    totalPerDay: money(expectedTotal / Math.max(1, tripDays)),
    scenarioTotals: computeScenarioTotals(categories, scenarios),
    editableCategories: ["flights", "lodging", "food", "localTransport", "activities", "extras"],
    missingDataWarnings: context.referenceData.warnings
  };
}

export function calculateScenarioTotals(
  summary: Pick<
    FinalBudgetSummary,
    "flights" | "lodging" | "food" | "localTransport" | "activities" | "extras"
  >,
  scenarios: ComparisonScenario[]
): Record<ComparisonScenario["key"], number> {
  const categories = {
    flights: summary.flights,
    lodging: summary.lodging,
    food: summary.food,
    localTransport: summary.localTransport,
    activities: summary.activities,
    extras: summary.extras
  } as const;

  return scenarios.reduce((accumulator, scenario) => {
    accumulator[scenario.key] = scenarioTotal(categories as Record<BudgetCategoryKey, any>, scenario);
    return accumulator;
  }, {} as Record<ComparisonScenario["key"], number>);
}
