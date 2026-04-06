import { describe, expect, it } from "vitest";

import { formatPopulation } from "@/lib/formatters";
import { buildSearchIndex } from "@/lib/search";
import { seedCountries } from "@/lib/data/seedCountries";

describe("buildSearchIndex", () => {
  it("preserves country population metadata for search results", () => {
    const index = buildSearchIndex(seedCountries);
    const argentina = index.find((entry) => entry.type === "country" && entry.id === "ARG");

    expect(argentina).toMatchObject({
      type: "country",
      title: "Argentina",
      population: 45773884,
      populationLabel: formatPopulation(45773884),
    });
  });
});
