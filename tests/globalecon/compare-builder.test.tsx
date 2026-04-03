import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { CompareBuilder } from "@/components/compare-builder";
import { I18nProvider } from "@/components/i18n-provider";
import { seedCountries } from "@/lib/data/seedCountries";

describe("CompareBuilder", () => {
  it("lets users add countries and enables the compare CTA", async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider initialLocale="en">
        <CompareBuilder countries={seedCountries} />
      </I18nProvider>,
    );

    await user.type(
      screen.getByPlaceholderText("Search a country like Argentina, Mexico, or Germany"),
      "mex",
    );
    await user.click(screen.getByRole("button", { name: /Mexico/i }));
    await user.type(
      screen.getByPlaceholderText("Search a country like Argentina, Mexico, or Germany"),
      "bra",
    );
    await user.click(screen.getByRole("button", { name: /Brazil/i }));

    expect(screen.getByRole("button", { name: "Compare now" })).toBeEnabled();
  });
});
