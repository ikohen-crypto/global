import { describe, expect, it } from "vitest";

import { buildCompareSlug, parseCompareSlug } from "@/lib/compare/slugs";
import { seedCountries } from "@/lib/data/seedCountries";

describe("compare slug helpers", () => {
  it("builds stable compare slugs", () => {
    const slug = buildCompareSlug([
      seedCountries.find((country) => country.iso3 === "USA")!,
      seedCountries.find((country) => country.iso3 === "CHN")!,
      seedCountries.find((country) => country.iso3 === "IND")!,
    ]);
    expect(slug).toBe("united-states-vs-china-vs-india");
  });

  it("parses multi-country compare slugs and de-dupes duplicates", () => {
    expect(parseCompareSlug("mexico-vs-brazil-vs-mexico")).toEqual({
      countries: ["mexico", "brazil"],
      isValid: true,
    });
  });

  it("rejects invalid comparison counts", () => {
    expect(parseCompareSlug("mexico").isValid).toBe(false);
    expect(parseCompareSlug("a-vs-b-vs-c-vs-d-vs-e-vs-f-vs-g").isValid).toBe(false);
  });
});
