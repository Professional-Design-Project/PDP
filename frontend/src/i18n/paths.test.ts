import { expect, it } from "vitest";
import { preferredLocale } from "./negotiate";
import { localePath, splitLocale, swapLocale } from "./paths";

it("splits the locale from the path", () => {
  expect(splitLocale("/pl/history/1")).toEqual({ locale: "pl", rest: "/history/1" });
  expect(splitLocale("/en")).toEqual({ locale: "en", rest: "/" });
  expect(splitLocale("/practice")).toEqual({ locale: null, rest: "/practice" });
  expect(splitLocale("/plan")).toEqual({ locale: null, rest: "/plan" });
});

it("prefixes internal paths once and leaves the rest alone", () => {
  expect(localePath("pl", "/")).toBe("/pl");
  expect(localePath("pl", "/practice?next=1")).toBe("/pl/practice?next=1");
  expect(localePath("pl", "/en/practice")).toBe("/en/practice");
  expect(localePath("pl", "#top")).toBe("#top");
  expect(localePath("pl", "//evil.example")).toBe("//evil.example");
});

it("swaps the locale of the current page", () => {
  expect(swapLocale("/en/privacy", "pl")).toBe("/pl/privacy");
  expect(swapLocale("/pl", "en")).toBe("/en");
});

it("prefers the saved choice, then the browser, then English", () => {
  expect(preferredLocale("pl", "en-US,en;q=0.9")).toBe("pl");
  expect(preferredLocale(undefined, "de-DE,pl;q=0.8,en;q=0.5")).toBe("pl");
  expect(preferredLocale(undefined, "en;q=0.4,pl;q=0.9")).toBe("pl");
  expect(preferredLocale("xx", "de")).toBe("en");
  expect(preferredLocale(undefined, null)).toBe("en");
});
