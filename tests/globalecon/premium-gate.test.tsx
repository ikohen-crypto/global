import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { PremiumGate } from "@/components/premium-gate";

describe("PremiumGate", () => {
  it("opens upgrade messaging for gated features", async () => {
    const user = userEvent.setup();
    render(<PremiumGate feature="csvExport" triggerLabel="Export CSV" />);

    await user.click(screen.getByRole("button", { name: "Export CSV" }));

    expect(screen.getByText("Export comparison data to CSV")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Maybe later" })).toBeInTheDocument();
  });
});
