import type { ActivityReferenceItem, ActivitiesEstimate, ManualCostOverride } from "@/types";
import {
  applyManualOverride,
  createBudgetValue,
  createExplanation,
  median,
  money
} from "@/services/calculators/common";
import { convertCurrencyAmount, getEnvelopeItems, resolveDestinationCostProfile } from "@/services/calculators/reference";
import type { TripComputationContext } from "@/types";
import { getTripDaysFromNights } from "@/utils/date";

export interface ActivitiesBudgetOptions {
  override?: ManualCostOverride;
  activityCount?: number;
}

function derivePaidActivityCount(days: number, style: TripComputationContext["preferences"]["activityStyle"]): number {
  if (style === "light") {
    return Math.max(1, Math.round(days * 0.8));
  }

  if (style === "balanced") {
    return Math.max(1, Math.round(days * 1.2));
  }

  return Math.max(1, Math.round(days * 1.7));
}

function deriveFreeActivityCount(
  days: number,
  style: TripComputationContext["preferences"]["activityStyle"],
  referenceFreeItems: number
): number {
  if (referenceFreeItems > 0) {
    return referenceFreeItems;
  }

  if (style === "light") {
    return Math.max(1, Math.round(days * 1.1));
  }

  if (style === "balanced") {
    return Math.max(1, Math.round(days * 1.5));
  }

  return Math.max(1, Math.round(days * 2));
}

function averageReferenceActivityPrice(
  items: ActivityReferenceItem[],
  context: TripComputationContext
): number | undefined {
  const pricedItems = items.filter((item) => !item.isFree && typeof item.price === "number");

  if (pricedItems.length === 0) {
    return undefined;
  }

  const prices = pricedItems.map((item) =>
    convertCurrencyAmount(item.price ?? 0, item.currency, context.preferredCurrency, context.referenceData).amount
  );

  return median(prices);
}

export function calculateActivitiesBudget(
  context: TripComputationContext,
  options?: ActivitiesBudgetOptions
): ActivitiesEstimate {
  const profile = resolveDestinationCostProfile(context.referenceData);
  const days = getTripDaysFromNights(context.nights);
  const items = getEnvelopeItems(context.referenceData.activities);
  const referencePaidItems = items.filter((item) => !item.isFree);
  const referenceFreeItems = items.filter((item) => item.isFree).length;
  const paidActivitiesCount = options?.activityCount ?? derivePaidActivityCount(days, context.preferences.activityStyle);
  const freeActivitiesCount = deriveFreeActivityCount(days, context.preferences.activityStyle, referenceFreeItems);
  const referenceAveragePrice = averageReferenceActivityPrice(items, context);
  const averagePaidActivityCost = money(
    referenceAveragePrice ?? (context.preferences.activityStyle === "light" ? 18 : context.preferences.activityStyle === "balanced" ? 34 : 58) * profile.activityMultiplier
  );
  const total = money(paidActivitiesCount * averagePaidActivityCost);

  const confidence = items.length > 0 ? context.referenceData.activities?.confidence ?? "medium" : "low";
  const sourceType = context.referenceData.activities?.sourceType ?? (context.referenceData.metadata ? "mixed" : "estimated");

  const base = createBudgetValue({
    value: total,
    currency: context.preferredCurrency,
    sourceType,
    confidence,
    sourceName: context.referenceData.activities?.sourceName ?? "destination-activities-model",
    lastUpdatedAt: context.referenceData.activities?.fetchedAt,
    explanation: createExplanation(
      items.length > 0
        ? "Activities budget was derived from reference attraction items."
        : "Activities budget was estimated from activity style and trip length.",
      items.length > 0
        ? "The engine uses the average paid item price and a derived activity cadence."
        : "This keeps the category visible even when no attraction API is connected.",
      [
        { label: "Days", value: days },
        { label: "Paid activities", value: paidActivitiesCount },
        { label: "Free activities", value: freeActivitiesCount },
        { label: "Average paid activity cost", value: averagePaidActivityCost },
        { label: "Activity multiplier", value: profile.activityMultiplier },
        { label: "Reference paid items", value: referencePaidItems.length }
      ],
      {
        formula: "paidActivitiesCount x averagePaidActivityCost",
        sourceNotes: items.length > 0 ? items.map((item) => item.title) : undefined
      }
    ),
    range: {
      minimum: money(total * 0.7),
      expected: total,
      high: money(total * 1.4),
      currency: context.preferredCurrency
    }
  });

  const patched = applyManualOverride(base, options?.override, (override, original) => ({
    ...original.explanation,
    summary: "Activities budget manually overridden.",
    methodology: original.explanation.methodology,
    sourceNotes: [
      ...(original.explanation.sourceNotes ?? []),
      `Manual override applied at ${override.appliedAt ?? new Date().toISOString()}`,
      ...(override.reason ? [`Reason: ${override.reason}`] : [])
    ]
  }));

  return {
    ...patched,
    paidActivitiesCount,
    freeActivitiesCount,
    averagePaidActivityCost
  };
}
