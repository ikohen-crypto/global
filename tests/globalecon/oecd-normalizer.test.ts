import { describe, expect, it } from "vitest";

import { normalizeOecdInflationCsv } from "@/lib/normalizers/oecd";

const sampleCsv = `STRUCTURE,REF_AREA,TIME_PERIOD,OBS_VALUE
DATAFLOW,ARG,2024-10,193.00
DATAFLOW,ARG,2024-11,166.00
DATAFLOW,ARG,2024-12,117.80
DATAFLOW,ARG,2025-01,84.53
DATAFLOW,ARG,2025-02,66.87
DATAFLOW,BRA,2025-02,5.06`;

describe("normalizeOecdInflationCsv", () => {
  it("keeps the latest monthly reading for each year", () => {
    const series = normalizeOecdInflationCsv(sampleCsv, "ARG", "2026-03-29");

    expect(series).not.toBeNull();
    expect(series?.sourceProvider).toBe("oecd");
    expect(series?.latestYear).toBe(2025);
    expect(series?.latestAvailableLabel).toBe("2025-02");
    expect(series?.latestValue).toBe(66.87);
    expect(series?.points).toEqual([
      { year: 2024, value: 117.8 },
      { year: 2025, value: 66.87 },
    ]);
  });
});
