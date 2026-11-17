import type { User } from "@supabase/supabase-js";
import { expect, it } from "vitest";
import { callbackUrl, signInMethods } from "@/lib/auth-providers";

function userWith(appMetadata: User["app_metadata"]) {
  return { app_metadata: appMetadata } as User;
}

it("sends the provider back to the callback with the localized next page", () => {
  expect(callbackUrl("http://localhost:3000", "/pl/practice")).toBe(
    "http://localhost:3000/auth/callback?next=%2Fpl%2Fpractice",
  );
});

it("tells password accounts from accounts linked to providers", () => {
  expect(signInMethods(userWith({ provider: "email", providers: ["email"] }))).toEqual({
    password: true,
    linked: [],
  });
  expect(signInMethods(userWith({ provider: "github", providers: ["github"] }))).toEqual({
    password: false,
    linked: ["github"],
  });
  expect(
    signInMethods(userWith({ provider: "email", providers: ["github", "email", "google"] })),
  ).toEqual({ password: true, linked: ["google", "github"] });
  expect(signInMethods(userWith({ provider: "google" }))).toEqual({
    password: false,
    linked: ["google"],
  });
});
