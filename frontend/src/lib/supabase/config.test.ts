import { expect, it } from "vitest";
import { isProtected, safeNext } from "./config";

it("only follows relative redirects inside the app", () => {
  expect(safeNext("/history?id=1")).toBe("/history?id=1");
  expect(safeNext("https://evil.example")).toBe("/practice");
  expect(safeNext("//evil.example")).toBe("/practice");
  expect(safeNext(String.raw`/\evil.example`)).toBe("/practice");
  expect(safeNext(null)).toBe("/practice");
  expect(safeNext("", "/")).toBe("/");
});

it("protects practice, account and history", () => {
  expect(isProtected("/practice")).toBe(true);
  expect(isProtected("/account/password")).toBe(true);
  expect(isProtected("/history")).toBe(true);
  expect(isProtected("/report")).toBe(true);
  expect(isProtected("/admin")).toBe(true);
  expect(isProtected("/")).toBe(false);
  expect(isProtected("/login")).toBe(false);
  expect(isProtected("/practiceroom")).toBe(false);
});
