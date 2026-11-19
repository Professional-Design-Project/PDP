import { expect, test, type Page } from "@playwright/test";

const sessions = "http://127.0.0.1:8000/v1/sessions";

async function tickRequiredConsents(page: Page) {
  const consent = page.getByRole("group", { name: "Consent" });
  await expect(consent.getByRole("checkbox")).toHaveCount(4);
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
  await expect(summary.getByText("HR screening")).toBeVisible();
  await page.getByRole("radio", { name: "Specialist interview", exact: true }).check();
  await expect(summary.getByText("Specialist interview")).toBeVisible();
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
  await page.getByRole("radio", { name: "Specialist interview", exact: true }).check();
  await page
    .getByRole("textbox")
    .first()
    .fill("Junior landscape architect, community garden project");
  await tickRequiredConsents(page);
  await page.getByRole("button", { name: "Enter the room" }).click();

  await expect(
    page.getByRole("alert").filter({ hasText: "Could not start the conversation." }),
  ).toHaveText("Could not start the conversation. Request failed (503)");
  expect(body).toMatchObject({
    scenario_id: "specialist-interview",
    language: "en",
    context: "Junior landscape architect, community garden project",
    consent: { voice: true, transcripts: true, outside_eu: true, language: "en" },
  });
});

for (const restAvailable of [true, false]) {
  test(`recovers from a closed WebRTC channel with REST ${restAvailable ? "available" : "unavailable"}`, async ({
    page,
  }) => {
    const saved = {
      status: "ended",
      started_at: "2026-11-19T12:00:00Z",
      ended_at: "2026-11-19T12:00:30Z",
      end_reason: "scenario_completed",
    };
    await page.route(`${sessions}/browser-test/**`, async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith("/offer")) {
        const offer = route.request().postDataJSON();
        const answer = await page.evaluate(async (offer) => {
          const remote = new RTCPeerConnection({ iceServers: [] });
          remote.ondatachannel = ({ channel }) => {
            Object.assign(window, { testChannel: channel });
            channel.onopen = () => {
              for (const data of [
                { kind: "session.ready" },
                { kind: "transcript.final", sequence: 1, role: "user", text: "Local answer." },
              ]) {
                channel.send(JSON.stringify({ type: "server-message", data }));
              }
            };
          };
          await remote.setRemoteDescription(offer);
          await remote.setLocalDescription(await remote.createAnswer());
          if (remote.iceGatheringState !== "complete") {
            await new Promise<void>((resolve) => {
              remote.onicegatheringstatechange = () => {
                if (remote.iceGatheringState === "complete") resolve();
              };
            });
          }
          return remote.localDescription?.toJSON();
        }, offer);
        await route.fulfill({ json: answer });
      } else if (!restAvailable) {
        await route.abort("internetdisconnected");
      } else if (path.endsWith("/transcript")) {
        await route.fulfill({
          json: [
            {
              sequence: 2,
              timestamp: "2026-11-19T12:00:25Z",
              data: { role: "user", text: "Final answer saved on the server.", interrupted: false },
            },
          ],
        });
      } else {
        await route.fulfill({ json: saved });
      }
    });
    await page.route(`${sessions}/browser-test`, async (route) => {
      if (restAvailable) await route.fulfill({ json: saved });
      else await route.abort("internetdisconnected");
    });
    await page.route(sessions, (route) =>
      route.fulfill({
        json: {
          id: "browser-test",
          access_token: "test-token",
          signaling_url: "/v1/sessions/browser-test/offer",
          ice_servers: [],
        },
      }),
    );
    await page.goto("/en/practice");
    await tickRequiredConsents(page);
    await page.getByRole("button", { name: "Enter the room" }).click();
    await page.getByRole("button", { name: "Show transcript" }).click();
    await expect(page.getByText("Local answer.", { exact: true })).toBeVisible();

    await page.evaluate(() => {
      const channel = (window as unknown as { testChannel: RTCDataChannel }).testChannel;
      channel.close();
    });

    await expect(page.getByRole("dialog")).not.toBeVisible();
    if (restAvailable) {
      await expect(
        page.getByText("Final answer saved on the server.", { exact: true }),
      ).toBeVisible();
      await expect(page.getByText("The scenario is complete.", { exact: false })).toBeVisible();
      await expect(page.getByText("Local answer.", { exact: true })).not.toBeVisible();
    } else {
      await expect(page.getByText("Local answer.", { exact: true })).toBeVisible();
      await expect(page.getByRole("status")).toContainText("may be incomplete");
    }
  });
}
