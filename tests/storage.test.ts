import {
  createSavedComparison,
  loadSavedComparisons,
  persistSavedComparisons,
  removeSavedComparison,
  upsertSavedComparison
} from "@/services/comparison";
import { buildFinalBudgetSummary } from "@/services/calculators";
import { mockDestinationList } from "@/mocks";

import { buildComputationContext } from "../tests/helpers";

describe("comparison storage", () => {
  it("creates, persists and reloads saved simulations", () => {
    const summary = buildFinalBudgetSummary(buildComputationContext(mockDestinationList()[0]));
    const comparison = createSavedComparison({
      name: "  Summer shortlist  ",
      scenarioKey: "expected",
      summaries: [summary]
    });

    persistSavedComparisons([comparison]);
    const loaded = loadSavedComparisons();

    expect(loaded).toHaveLength(1);
    expect(loaded[0].name).toBe("Summer shortlist");
    expect(loaded[0].summaries[0].destination.id).toBe(summary.destination.id);
  });

  it("updates and removes saved simulations safely", () => {
    const first = createSavedComparison({
      name: "Compare Europe",
      scenarioKey: "expected",
      summaries: [buildFinalBudgetSummary(buildComputationContext(mockDestinationList()[0]))]
    });

    const updated = upsertSavedComparison([], { ...first, name: "Compare Europe v2" });
    const trimmed = removeSavedComparison(updated, first.id);

    expect(updated[0].name).toBe("Compare Europe v2");
    expect(trimmed).toHaveLength(0);
  });
});
