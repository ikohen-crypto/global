import { mockDestinationList } from "@/mocks";
import { buildFinalBudgetSummary } from "@/services/calculators";
import {
  buildCategoryRows,
  compareDestinationSummaries,
  getScenarioSummary
} from "@/services/comparison";

import { buildComputationContext } from "../tests/helpers";

describe("comparison services", () => {
  it("ranks destinations from cheapest to most expensive for a scenario", () => {
    const [madrid, paris] = mockDestinationList();
    const madridSummary = buildFinalBudgetSummary(buildComputationContext(madrid));
    const parisSummary = buildFinalBudgetSummary(buildComputationContext(paris));

    const result = compareDestinationSummaries([parisSummary, madridSummary], "high");

    expect(result.rankedDestinations).toHaveLength(2);
    expect(result.rankedDestinations[0].scenarioTotal).toBeLessThanOrEqual(
      result.rankedDestinations[1].scenarioTotal
    );
    expect(result.cheapestDestinationId).toBe(result.rankedDestinations[0].destinationId);
  });

  it("builds category rows and marks the cheapest value per category", () => {
    const summaries = mockDestinationList()
      .slice(0, 2)
      .map((destination) => buildFinalBudgetSummary(buildComputationContext(destination)));

    const rows = buildCategoryRows(summaries);

    expect(rows).toHaveLength(6);
    expect(rows.every((row) => row.cells.some((cell) => cell.isCheapest))).toBe(true);
  });

  it("derives scenario summaries from the selected budget scenario", () => {
    const summary = buildFinalBudgetSummary(buildComputationContext(mockDestinationList()[1]));
    const scenario = getScenarioSummary(summary, "high");

    expect(scenario.scenarioKey).toBe("high");
    expect(scenario.scenarioTotal).toBeGreaterThan(summary.value);
    expect(scenario.totalPerPerson).toBeGreaterThan(0);
  });
});
