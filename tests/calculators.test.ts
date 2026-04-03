import {
  buildFinalBudgetSummary,
  calculateActivitiesBudget,
  calculateExtraCosts,
  calculateFlightBudget,
  calculateFoodBudget,
  calculateLodgingBudget,
  calculateLocalTransportBudget
} from "@/services/calculators";

import { buildComputationContext } from "../tests/helpers";

describe("budget calculators", () => {
  it("builds a consistent final budget summary from category outputs", () => {
    const context = buildComputationContext();

    const summary = buildFinalBudgetSummary(context, {
      includeCheckedBag: true,
      includeTravelInsurance: true,
      includeAirportTransfers: true,
      includeContingency: true,
      includeTouristTaxes: true,
      includeTips: true,
      activityCount: 4
    });

    const categoryTotal =
      summary.flights.value +
      summary.lodging.value +
      summary.food.value +
      summary.localTransport.value +
      summary.activities.value +
      summary.extras.value;

    expect(summary.value).toBeCloseTo(categoryTotal, 2);
    expect(summary.totalPerPerson).toBeGreaterThan(0);
    expect(summary.totalPerDay).toBeGreaterThan(0);
    expect(summary.scenarioTotals.expected).toBeCloseTo(summary.value, 2);
  });

  it("supports manual overrides without breaking the total", () => {
    const context = buildComputationContext();

    const summary = buildFinalBudgetSummary(context, {
      overrides: {
        food: {
          value: 999,
          currency: "USD",
          appliedAt: "2026-03-23T10:00:00.000Z",
          reason: "User knows their restaurant plan"
        }
      }
    });

    expect(summary.food.value).toBe(999);
    expect(summary.food.sourceType).toBe("manual");
    expect(summary.value).toBeCloseTo(
      summary.flights.value +
        summary.lodging.value +
        summary.food.value +
        summary.localTransport.value +
        summary.activities.value +
        summary.extras.value,
      2
    );
  });

  it("calculates each category with explainable metadata", () => {
    const context = buildComputationContext();

    const flights = calculateFlightBudget(context, { includeCheckedBag: true });
    const lodging = calculateLodgingBudget(context);
    const food = calculateFoodBudget(context);
    const localTransport = calculateLocalTransportBudget(context);
    const activities = calculateActivitiesBudget(context, { activityCount: 3 });
    const extras = calculateExtraCosts(context, {
      includeCheckedBag: true,
      includeTravelInsurance: true,
      includeAirportTransfers: true,
      includeContingency: true,
      includeTouristTaxes: true,
      includeTips: true,
      flightBudget: flights,
      lodgingBudget: lodging
    });

    expect(flights.passengerPricing.length).toBeGreaterThan(0);
    expect(lodging.roomCount).toBeGreaterThan(0);
    expect(food.dailyPerPerson).toBeGreaterThan(0);
    expect(localTransport.dailyGroupCost).toBeGreaterThan(0);
    expect(activities.paidActivitiesCount).toBe(3);
    expect(extras.items.some((item) => item.label === "Travel insurance")).toBe(true);

    for (const category of [flights, lodging, food, localTransport, activities, extras]) {
      expect(category.explanation.summary).not.toHaveLength(0);
      expect(category.range.expected).toBeGreaterThan(0);
    }
  });
});
