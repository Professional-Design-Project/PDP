import { act, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { StableLabel } from "@/components/stable-label";
import { resetLocaleMemory, setLocale } from "@/i18n/locale";

afterEach(() => {
  window.localStorage.clear();
  resetLocaleMemory();
});

it("keeps every language in the layout but exposes only the active one", () => {
  render(
    <button type="button">
      <StableLabel pick={(t) => t.header.practice} />
    </button>,
  );
  const button = screen.getByRole("button");
  expect(button).toHaveAccessibleName("Practice");
  expect(button).toHaveTextContent("Ćwicz");
  act(() => setLocale("pl"));
  expect(screen.getByRole("button")).toHaveAccessibleName("Ćwicz");
});
