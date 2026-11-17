import type { Dictionary } from "@/i18n/en";

export type AuthErrorKey = keyof Dictionary["auth"]["errors"];

const known: AuthErrorKey[] = [
  "invalid_credentials",
  "email_not_confirmed",
  "user_already_exists",
  "weak_password",
  "over_email_send_rate_limit",
];

export function authErrorKey(error: { code?: string; message?: string } | null): AuthErrorKey {
  const code = error?.code ?? "";
  if (code === "email_exists") return "user_already_exists";
  return known.find((key) => key === code) ?? "generic";
}

export function validateEmail(email: string): AuthErrorKey | null {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? null : "invalid_email";
}

export function validateCredentials(email: string, password: string): AuthErrorKey | null {
  const invalid = validateEmail(email);
  if (invalid) return invalid;
  if (password.length < 8) return "short_password";
  return null;
}
