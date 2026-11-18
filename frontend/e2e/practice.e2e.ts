import { expect, test, type Page } from "@playwright/test";

const sessions = "http://127.0.0.1:8000/v1/sessions";

async function tickRequiredConsents(page: Page) {
  const consent = page.getByRole("group", { name: "Consent" });
  for (const box of await consent.getByRole("checkbox").all()) {
    const label = await box.locator("xpath=ancestor::label").innerText();
    if (!label.includes("optional")) await box.check();
  }
}

test("the room stays closed until the required consents are ticked", async ({ page }) => {
  await page.goto("/en/practice");
  const enter = page.getByRole("button", { name: "Enter the room" });
  await expect(enter).toBeDisabled();
  await expect(page.getByText("Tick the three required boxes to enter.")).toBeVisible();
  await tickRequiredConsents(page);
  await expect(enter).toBeEnabled();
});

test("the session summary follows the chosen scenario", async ({ page }) => {
  await page.goto("/en/practice");
  const summary = page.getByRole("complementary");
  await expect(summary.getByText("Job interview")).toBeVisible();
  await page.getByText("Oral exam", { exact: true }).click();
  await expect(summary.getByText("Oral exam")).toBeVisible();
});

test("entering the room sends the setup and reports a failed start", async ({ page }) => {
  let body: Record<string, unknown> | null = null;
  await page.route(sessions, async (route) => {
    body = route.request().postDataJSON();
    await route.fulfill({ status: 503, json: { detail: "Voice is not configured" } });
  });
  await page.goto("/en/practice");
  await page.getByText("Oral exam", { exact: true }).click();
  await page.getByRole("textbox").first().fill("Operating systems, chapter 3");
  await tickRequiredConsents(page);
  await page.getByRole("button", { name: "Enter the room" }).click();

  await expect(
    page.getByRole("alert").filter({ hasText: "Could not start the conversation." }),
  ).toHaveText("Could not start the conversation. Request failed (503)");
  expect(body).toMatchObject({
    scenario_id: "oral-exam",
    language: "en",
    context: "Operating systems, chapter 3",
    consent: { voice: true, transcripts: true, outside_eu: true, language: "en" },
  });
});
