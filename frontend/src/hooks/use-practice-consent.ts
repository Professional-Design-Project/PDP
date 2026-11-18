"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  allowsSession,
  getConsentSnapshot,
  getServerConsent,
  saveConsent,
  subscribeConsent,
  type ConsentKey,
} from "@/lib/consent";
import { restoreRememberedConsent } from "@/lib/remembered-consent";
import { browserClient } from "@/lib/supabase/client";

export function usePracticeConsent() {
  const choices = useSyncExternalStore(subscribeConsent, getConsentSnapshot, getServerConsent);

  useEffect(() => {
    const supabase = browserClient();
    if (supabase) restoreRememberedConsent(supabase).catch(() => undefined);
  }, []);

  function change(key: ConsentKey, value: boolean) {
    saveConsent({ ...choices, [key]: value });
  }

  return { choices, change, allowed: allowsSession(choices) };
}
