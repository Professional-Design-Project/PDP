import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import Landing from "@/app/page";
import { SiteHeader } from "@/components/site-header";
import { en } from "./en";
import { resetLocaleMemory, setLocale } from "./locale";
import { pl } from "./pl";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn() }),
}));

afterEach(() => {
  window.localStorage.clear();
  resetLocaleMemory();
});

function keys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) => keys(child, `${prefix}.${key}`));
}

it("has the same keys in every language", () => {
  expect(keys(pl).sort()).toEqual(keys(en).sort());
});

it("switches the interface to Polish and remembers it", () => {
  render(
    <>
      <SiteHeader />
      <Landing />
    </>,
  );
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(en.landing.title);
  fireEvent.click(screen.getByRole("radio", { name: "Polski" }));
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(pl.landing.title);
  expect(window.localStorage.getItem("ensaio.locale")).toBe("pl");
  act(() => setLocale("en"));
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(en.landing.title);
});
