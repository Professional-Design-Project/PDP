import type { User } from "@supabase/supabase-js";

export const oauthProviders = ["google", "github"] as const;

export type OAuthProvider = (typeof oauthProviders)[number];

export function callbackUrl(origin: string, next: string) {
  const url = new URL("/auth/callback", origin);
  url.searchParams.set("next", next);
  return url.toString();
}

export function signInMethods(user: User | null) {
  const providers = user?.app_metadata.providers;
  const list: string[] = Array.isArray(providers) ? providers : [user?.app_metadata.provider ?? ""];
  return {
    password: list.includes("email"),
    linked: oauthProviders.filter((provider) => list.includes(provider)),
  };
}
