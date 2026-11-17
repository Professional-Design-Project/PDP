import { expect, it } from "vitest";
import { authErrorKey, validateCredentials, validateEmail } from "./auth-errors";

it("maps Supabase auth error codes to messages", () => {
  expect(authErrorKey({ code: "invalid_credentials" })).toBe("invalid_credentials");
  expect(authErrorKey({ code: "email_exists" })).toBe("user_already_exists");
  expect(authErrorKey({ code: "something_new" })).toBe("generic");
  expect(authErrorKey(null)).toBe("generic");
});

it("validates email and password before calling Supabase", () => {
  expect(validateEmail("student@uni.pl")).toBeNull();
  expect(validateEmail("student@")).toBe("invalid_email");
  expect(validateCredentials("student@uni.pl", "short")).toBe("short_password");
  expect(validateCredentials("student@uni.pl", "long enough")).toBeNull();
});
