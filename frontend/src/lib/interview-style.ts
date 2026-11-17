export type InterviewStyle = {
  focus: number;
  precision: number;
  pressure: number;
  follow_ups: number;
};

export type StyleKey = keyof InterviewStyle;

export const defaultStyle: InterviewStyle = { focus: 50, precision: 2, pressure: 2, follow_ups: 2 };

export const styleRanges: Record<StyleKey, { min: number; max: number; step: number }> = {
  focus: { min: 0, max: 100, step: 10 },
  precision: { min: 1, max: 3, step: 1 },
  pressure: { min: 1, max: 3, step: 1 },
  follow_ups: { min: 0, max: 3, step: 1 },
};

export function fillPercent(key: StyleKey, value: number) {
  const { min, max } = styleRanges[key];
  return ((value - min) / (max - min)) * 100;
}

export function snapStyleValue(key: StyleKey, raw: number) {
  const { min, max, step } = styleRanges[key];
  const snapped = min + Math.round((raw - min) / step) * step;
  return Math.min(max, Math.max(min, snapped));
}
