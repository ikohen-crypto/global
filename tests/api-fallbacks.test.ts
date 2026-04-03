import { compareBudgets } from "@/services/apis/budgetApi";
import { searchDestinations } from "@/services/apis/destinationApi";
import { getReferenceConfig } from "@/services/apis/referenceApi";

import { buildTripInput } from "../tests/helpers";

describe("frontend API fallbacks", () => {
  it("falls back to mock budget data when the compare endpoint fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const response = await compareBudgets(buildTripInput());

    expect(response.summaries.length).toBeGreaterThan(0);
    expect(response.warnings.some((warning) => warning.toLowerCase().includes("demo"))).toBe(true);
  });

  it("falls back to mock destinations when the destination endpoint fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const response = await searchDestinations("paris");

    expect(response.destinations.length).toBeGreaterThan(0);
    expect(response.sourceType).toBe("mock");
  });

  it("falls back to mock reference config when the config endpoint fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const response = await getReferenceConfig();

    expect(response.appName).toBe("Travel Budget Comparator");
    expect(response.defaultOrigin.label).not.toHaveLength(0);
  });
});
