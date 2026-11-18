export const CONSENT_VERSION = "2026-11-draft";

export type ConsentKey = "voice" | "transcripts" | "improvement" | "outside_eu";

export type ConsentChoices = Record<ConsentKey, boolean>;

export const consentKeys: ConsentKey[] = ["voice", "transcripts", "improvement", "outside_eu"];

export const requiredConsents: ConsentKey[] = ["voice", "transcripts", "outside_eu"];

export const noConsent: ConsentChoices = {
  voice: false,
  transcripts: false,
  improvement: false,
  outside_eu: false,
};

const STORAGE_KEY = "ensaio.consent";
const listeners = new Set<() => void>();
let memory: ConsentChoices | null = null;
let chosen = false;

export function allowsSession(choices: ConsentChoices) {
  return requiredConsents.every((key) => choices[key]);
}

function readStorage(): ConsentChoices {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
    if (stored?.version !== CONSENT_VERSION) return noConsent;
    return Object.fromEntries(
      consentKeys.map((key) => [key, stored.choices?.[key] === true]),
    ) as ConsentChoices;
  } catch {
    return noConsent;
  }
}

export function hasStoredConsent() {
  if (chosen) return true;
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
    return stored?.version === CONSENT_VERSION;
  } catch {
    return false;
  }
}

function notify() {
  listeners.forEach((listener) => listener());
}

function onStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY) return;
  memory = null;
  notify();
}

export function subscribeConsent(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

export function getConsentSnapshot() {
  memory ??= readStorage();
  return memory;
}

export function getServerConsent() {
  return noConsent;
}

export function saveConsent(choices: ConsentChoices) {
  memory = choices;
  chosen = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: CONSENT_VERSION, choices }));
  } catch {
    memory = choices;
  }
  notify();
}

export function resetConsentMemory() {
  memory = null;
  chosen = false;
}
