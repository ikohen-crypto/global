import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { I18nProvider } from "@/components/i18n-provider";
import { SearchCommand } from "@/components/search-command";
import { seedCountries } from "@/lib/data/seedCountries";
import { formatPopulation } from "@/lib/formatters";

describe("SearchCommand", () => {
  it("renders country population in search results and keeps the trigger single-line safe", async () => {
    const user = userEvent.setup();

    render(
      <I18nProvider initialLocale="en">
        <SearchCommand triggerClassName="w-full sm:w-80" countries={seedCountries} />
      </I18nProvider>,
    );

    const trigger = screen.getByRole("button", { name: "Search markets, regions, comparisons" });
    expect(trigger).toHaveClass("whitespace-nowrap");
    expect(trigger).toHaveClass("overflow-hidden");

    await user.click(trigger);
    await user.type(screen.getByPlaceholderText("Search Argentina, inflation risk, Europe, or Mexico vs Brazil"), "arg");

    expect(await screen.findByText("Argentina")).toBeInTheDocument();
    expect(screen.getByText(`— ${formatPopulation(45773884)}`)).toBeInTheDocument();
  });
});
