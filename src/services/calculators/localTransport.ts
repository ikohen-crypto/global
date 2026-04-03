import type { LocalTransportEstimate, ManualCostOverride } from "@/types";
import {
  applyManualOverride,
  createBudgetValue,
  createExplanation,
  money
} from "@/services/calculators/common";
import { resolveDestinationCostProfile } from "@/services/calculators/reference";
import type { TripComputationContext } from "@/types";
import { getTripDaysFromNights } from "@/utils/date";

export interface LocalTransportBudgetOptions {
  override?: ManualCostOverride;
}

function baseDailyGroupCost(style: TripComputationContext["preferences"]["localTransportStyle"]): number {
  if (style === "public") {
    return 11;
  }

  if (style === "mixed") {
    return 27;
  }

  return 58;
}

export function calculateLocalTransportBudget(
  context: TripComputationContext,
  options?: LocalTransportBudgetOptions
): LocalTransportEstimate {
  const profile = resolveDestinationCostProfile(context.referenceData);
  const days = getTripDaysFromNights(context.nights);
  const estimatedDailyGroupCost = money(baseDailyGroupCost(context.preferences.localTransportStyle) * profile.transportMultiplier);
  const total = money(estimatedDailyGroupCost * days);

  const confidence = context.referenceData.metadata ? "medium" : "low";
  const sourceType = context.referenceData.metadata ? "mixed" : "estimated";

  const base = createBudgetValue({
    value: total,
    currency: context.preferredCurrency,
    sourceType,
    confidence,
    sourceName: context.referenceData.metadata ? "destination-metadata" : "destination-transport-model",
    lastUpdatedAt: context.referenceData.metadata?.fetchedAt,
    explanation: createExplanation(
      context.referenceData.metadata
        ? "Local transport was adjusted by destination transport metadata."
        : "Local transport was estimated from travel style and trip length.",
      context.referenceData.metadata
        ? "Transport score and taxi-cost index are used when official local transport data is available."
        : "This category remains intentionally replaceable by city-level transport data later.",
      [
        { label: "Days", value: days },
        { label: "Style", value: context.preferences.localTransportStyle },
        { label: "Daily group cost", value: estimatedDailyGroupCost },
        { label: "Transport multiplier", value: profile.transportMultiplier },
        { label: "Taxi index", value: profile.taxiCostIndex },
        { label: "Public transport score", value: profile.publicTransportScore }
      ],
      {
        formula: "dailyGroupCost x days",
        sourceNotes: context.referenceData.metadata ? [context.referenceData.destination.label] : undefined
      }
    ),
    range: {
      minimum: money(total * 0.8),
      expected: total,
      high: money(total * 1.33),
      currency: context.preferredCurrency
    }
  });

  const patched = applyManualOverride(base, options?.override, (override, original) => ({
    ...original.explanation,
    summary: "Local transport budget manually overridden.",
    methodology: original.explanation.methodology,
    sourceNotes: [
      ...(original.explanation.sourceNotes ?? []),
      `Manual override applied at ${override.appliedAt ?? new Date().toISOString()}`,
      ...(override.reason ? [`Reason: ${override.reason}`] : [])
    ]
  }));

  return {
    ...patched,
    dailyGroupCost: estimatedDailyGroupCost,
    style: context.preferences.localTransportStyle
  };
}
