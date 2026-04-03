import type { FoodEstimate, ManualCostOverride } from "@/types";
import {
  applyManualOverride,
  createBudgetValue,
  createExplanation,
  money
} from "@/services/calculators/common";
import { resolveDestinationCostProfile } from "@/services/calculators/reference";
import type { TripComputationContext } from "@/types";
import { getTripDaysFromNights } from "@/utils/date";

export interface FoodBudgetOptions {
  override?: ManualCostOverride;
}

function baseDailyPerPerson(style: TripComputationContext["preferences"]["foodStyle"]): number {
  if (style === "saving") {
    return 24;
  }

  if (style === "standard") {
    return 42;
  }

  return 68;
}

export function calculateFoodBudget(
  context: TripComputationContext,
  options?: FoodBudgetOptions
): FoodEstimate {
  const profile = resolveDestinationCostProfile(context.referenceData);
  const days = getTripDaysFromNights(context.nights);
  const travelers = context.travelers.adults + context.travelers.children + context.travelers.infants;
  const estimatedDailyPerPerson = money(baseDailyPerPerson(context.preferences.foodStyle) * profile.mealMultiplier);
  const groupDailyTotal = money(estimatedDailyPerPerson * travelers);
  const total = money(groupDailyTotal * days);

  const confidence = context.referenceData.metadata ? "medium" : "low";
  const sourceType = context.referenceData.metadata ? "mixed" : "estimated";

  const base = createBudgetValue({
    value: total,
    currency: context.preferredCurrency,
    sourceType,
    confidence,
    sourceName: context.referenceData.metadata ? "destination-metadata" : "destination-food-model",
    lastUpdatedAt: context.referenceData.metadata?.fetchedAt,
    explanation: createExplanation(
      context.referenceData.metadata
        ? "Food budget was adjusted by destination meal-cost metadata."
        : "Food budget was estimated from meal style and trip length.",
      context.referenceData.metadata
        ? "The engine uses city/country meal-cost indicators when they exist and scales them by traveler count and nights."
        : "A transparent daily-per-person model is used until city-level reference data is available.",
      [
        { label: "Days", value: days },
        { label: "Travelers", value: travelers },
        { label: "Style", value: context.preferences.foodStyle },
        { label: "Daily per person", value: estimatedDailyPerPerson },
        { label: "Group daily total", value: groupDailyTotal },
        { label: "Meal multiplier", value: profile.mealMultiplier }
      ],
      {
        formula: "dailyPerPerson x travelers x days",
        sourceNotes: context.referenceData.metadata ? [context.referenceData.destination.label] : undefined
      }
    ),
    range: {
      minimum: money(total * 0.84),
      expected: total,
      high: money(total * 1.28),
      currency: context.preferredCurrency
    }
  });

  const patched = applyManualOverride(base, options?.override, (override, original) => ({
    ...original.explanation,
    summary: "Food budget manually overridden.",
    methodology: original.explanation.methodology,
    sourceNotes: [
      ...(original.explanation.sourceNotes ?? []),
      `Manual override applied at ${override.appliedAt ?? new Date().toISOString()}`,
      ...(override.reason ? [`Reason: ${override.reason}`] : [])
    ]
  }));

  return {
    ...patched,
    dailyPerPerson: estimatedDailyPerPerson,
    groupDailyTotal,
    style: context.preferences.foodStyle
  };
}
