import { expect, it } from "vitest";
import { defaultStyle, fillPercent, styleRanges } from "@/lib/interview-style";

it("starts every slider inside its range", () => {
  for (const [key, value] of Object.entries(defaultStyle)) {
    const range = styleRanges[key as keyof typeof styleRanges];
    expect(value).toBeGreaterThanOrEqual(range.min);
    expect(value).toBeLessThanOrEqual(range.max);
  }
});

it("fills the track in proportion to the value", () => {
  expect(fillPercent("focus", 60)).toBe(60);
  expect(fillPercent("precision", 1)).toBe(0);
  expect(fillPercent("pressure", 3)).toBe(100);
  expect(fillPercent("follow_ups", 1)).toBeCloseTo(33.33, 1);
});
