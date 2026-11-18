import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, expect, it } from "vitest";
import type { StoredConsent } from "@/lib/account";
import {
  CONSENT_VERSION,
  getConsentSnapshot,
  noConsent,
  resetConsentMemory,
  saveConsent,
} from "@/lib/consent";
import { rememberedChoices, restoreRememberedConsent } from "@/lib/remembered-consent";

const given: StoredConsent = {
  id: 1,
  version: CONSENT_VERSION,
  language: "en",
  voice: true,
  transcripts: true,
  improvement: false,
  outside_eu: true,
  givenAt: "2026-11-18T10:00:00Z",
  withdrawnAt: null,
};

function fakeSupabase(row: StoredConsent | null, signedIn = true) {
  const dbRow = row && {
    id: row.id,
    version: row.version,
    language: row.language,
    voice: row.voice,
    transcripts: row.transcripts,
    improvement: row.improvement,
    outside_eu: row.outside_eu,
    given_at: row.givenAt,
    withdrawn_at: row.withdrawnAt,
  };
  const query = {
    select: () => query,
    order: () => query,
    limit: () => query,
    maybeSingle: async () => ({ data: dbRow, error: null }),
  };
  return {
    auth: { getSession: async () => ({ data: { session: signedIn ? {} : null } }) },
    from: () => query,
  } as unknown as SupabaseClient;
}

afterEach(() => {
  window.localStorage.clear();
  resetConsentMemory();
});

it("accepts only an active consent of the current version with every required box", () => {
  expect(rememberedChoices(given)).toEqual({
    voice: true,
    transcripts: true,
    improvement: false,
    outside_eu: true,
  });
  expect(rememberedChoices(null)).toBeNull();
  expect(rememberedChoices({ ...given, version: "old" })).toBeNull();
  expect(rememberedChoices({ ...given, withdrawnAt: "2026-11-18T11:00:00Z" })).toBeNull();
  expect(rememberedChoices({ ...given, outside_eu: false })).toBeNull();
});

it("restores the consent a signed-in user gave before", async () => {
  getConsentSnapshot();
  await restoreRememberedConsent(fakeSupabase(given));
  expect(getConsentSnapshot()).toMatchObject({ voice: true, transcripts: true, outside_eu: true });
});

it("keeps the choice already made in this browser", async () => {
  saveConsent(noConsent);
  await restoreRememberedConsent(fakeSupabase(given));
  expect(getConsentSnapshot()).toEqual(noConsent);
});

it("does nothing for a signed-out visitor or a withdrawn consent", async () => {
  await restoreRememberedConsent(fakeSupabase(given, false));
  expect(getConsentSnapshot()).toEqual(noConsent);
  await restoreRememberedConsent(fakeSupabase({ ...given, withdrawnAt: "2026-11-18T11:00:00Z" }));
  expect(getConsentSnapshot()).toEqual(noConsent);
});
