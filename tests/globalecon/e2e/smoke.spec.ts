import { expect, test } from "@playwright/test";

test("home page renders core value proposition", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Compare the world economy with clarity instead of clutter.",
    }),
  ).toBeVisible();
});
