"use client";

import { useSyncExternalStore } from "react";
import {
  allowsSession,
  getConsentSnapshot,
  getServerConsent,
  saveConsent,
  subscribeConsent,
  type ConsentKey,
} from "@/lib/consent";

export function usePracticeConsent() {
  const choices = useSyncExternalStore(subscribeConsent, getConsentSnapshot, getServerConsent);

  function change(key: ConsentKey, value: boolean) {
    saveConsent({ ...choices, [key]: value });
  }

  return { choices, change, allowed: allowsSession(choices) };
}
