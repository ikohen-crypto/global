import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Header } from "@/components/layout/header";
import { I18nProvider } from "@/components/i18n-provider";
import { seedCountries } from "@/lib/data/seedCountries";

vi.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme: "light",
    setTheme: vi.fn(),
  }),
}));

describe("Header", () => {
  it("keeps desktop controls in a single aligned row", () => {
    const { container } = render(
      <I18nProvider initialLocale="es">
        <Header countries={seedCountries} />
      </I18nProvider>,
    );

    const desktopRow = container.querySelector("header > div");
    const zones = container.querySelectorAll("header > div > div");
    const [searchTrigger] = screen.getAllByRole("button", { name: "Buscar mercados, regiones y comparaciones" });
    const languageToggle = screen.getByRole("button", { name: "Idioma" });

    expect(desktopRow).toHaveClass("justify-between");
    expect(zones[0]).toHaveClass("lg:w-[14rem]");
    expect(zones[1]).toHaveClass("lg:w-[22rem]");
    expect(searchTrigger).toHaveClass("whitespace-nowrap");
    expect(searchTrigger).toHaveClass("justify-start");
    expect(languageToggle).toHaveClass("whitespace-nowrap");
  });
});
