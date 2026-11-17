import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { StableLabel } from "@/components/stable-label";
import { LocaleProvider } from "@/i18n/locale";

function renderIn(locale: "pl" | "en") {
  return render(
    <LocaleProvider locale={locale}>
      <button type="button">
        <StableLabel pick={(t) => t.header.practice} />
      </button>
    </LocaleProvider>,
  );
}

it("keeps every language in the layout but exposes only the active one", () => {
  const { unmount } = renderIn("en");
  const button = screen.getByRole("button");
  expect(button).toHaveAccessibleName("Practice");
  expect(button).toHaveTextContent("Ćwicz");
  unmount();
  renderIn("pl");
  expect(screen.getByRole("button")).toHaveAccessibleName("Ćwicz");
});
