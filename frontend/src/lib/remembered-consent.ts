import type { SupabaseClient } from "@supabase/supabase-js";
import { latestConsent, type StoredConsent } from "@/lib/account";
import {
  allowsSession,
  CONSENT_VERSION,
  consentKeys,
  hasStoredConsent,
  saveConsent,
  type ConsentChoices,
} from "@/lib/consent";

export function rememberedChoices(stored: StoredConsent | null): ConsentChoices | null {
  if (!stored || stored.version !== CONSENT_VERSION || stored.withdrawnAt) return null;
  const choices = Object.fromEntries(
    consentKeys.map((key) => [key, stored[key] === true]),
  ) as ConsentChoices;
  return allowsSession(choices) ? choices : null;
}

export async function restoreRememberedConsent(supabase: SupabaseClient) {
  if (hasStoredConsent()) return;
  const { data } = await supabase.auth.getSession();
  if (!data.session) return;
  const choices = rememberedChoices(await latestConsent(supabase));
  if (choices && !hasStoredConsent()) saveConsent(choices);
}
