import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import Landing from "@/app/[lang]/page";
import { SiteHeader } from "@/components/site-header";
import { en } from "./en";
import { LocaleProvider } from "./locale";
import { pl } from "./pl";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/practice",
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn(), push }),
}));

beforeEach(() => {
  document.cookie = "ensaio.locale=; max-age=0; path=/";
});

afterEach(() => push.mockClear());

function keys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) => keys(child, `${prefix}.${key}`));
}

it("has the same keys in every language", () => {
  expect(keys(pl).sort()).toEqual(keys(en).sort());
});

it("renders the language from the route", () => {
  render(
    <LocaleProvider locale="pl">
      <Landing />
    </LocaleProvider>,
  );
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(pl.landing.title);
  screen
    .getAllByRole("link", { name: new RegExp(pl.common.setTheRoom) })
    .forEach((link) => expect(link).toHaveAttribute("href", "/pl/practice"));
});

it("moves to the same page in the other language and remembers the choice", () => {
  render(
    <LocaleProvider locale="en">
      <SiteHeader />
    </LocaleProvider>,
  );
  expect(screen.getByRole("radio", { name: "English" })).toBeChecked();
  fireEvent.click(screen.getByRole("radio", { name: "Polski" }));
  expect(push).toHaveBeenCalledWith("/pl/practice", { scroll: false });
  expect(document.cookie).toContain("ensaio.locale=pl");
});
