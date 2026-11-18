import { expect, test } from "@playwright/test";

test("the root redirects to the preferred language", async ({ browser }) => {
  const context = await browser.newContext({ locale: "pl-PL" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page).toHaveURL(/\/pl$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "pl");
  await context.close();
});

test("the landing page leads to the practice room", async ({ page }) => {
  await page.goto("/en");
  await expect(
    page.getByRole("heading", { level: 1, name: "Rehearse the conversation before it happens." }),
  ).toBeVisible();
  await page.getByRole("main").getByRole("link", { name: "Set the room" }).first().click();
  await expect(page).toHaveURL(/\/en\/practice$/);
  await expect(page.getByRole("heading", { level: 1, name: "Set the room." })).toBeVisible();
});

test("the language switch keeps the current page", async ({ page }) => {
  await page.goto("/en/practice");
  await page
    .getByRole("group", { name: "Interface language" })
    .locator("label")
    .filter({ hasText: "Polski" })
    .click();
  await expect(page).toHaveURL(/\/pl\/practice$/);
  await expect(page.getByRole("heading", { level: 1, name: "Przygotuj pokój." })).toBeVisible();
});

test("an unknown page shows the not found screen", async ({ page }) => {
  const response = await page.goto("/en/no-such-room");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("This room is empty.")).toBeVisible();
});

test("account pages explain that sign-in is off in local mode", async ({ page }) => {
  await page.goto("/en/history");
  await expect(page.getByText("Sign-in is not set up yet.")).toBeVisible();
  await page.getByRole("link", { name: "Go to practice" }).click();
  await expect(page).toHaveURL(/\/en\/practice$/);
});
