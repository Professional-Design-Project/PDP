import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import NotFound from "@/app/[lang]/not-found";
import { LocaleProvider } from "@/i18n/locale";

it("shows a Polish 404 with links that keep the language", () => {
  render(
    <LocaleProvider locale="pl">
      <NotFound />
    </LocaleProvider>,
  );
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Ten pokój jest pusty.");
  expect(screen.getByRole("link", { name: /Strona główna/ })).toHaveAttribute("href", "/pl");
  expect(screen.getByRole("link", { name: "Przygotuj pokój" })).toHaveAttribute(
    "href",
    "/pl/practice",
  );
});
