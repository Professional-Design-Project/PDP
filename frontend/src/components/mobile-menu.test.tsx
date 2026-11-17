import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { MobileMenu } from "@/components/mobile-menu";
import { LocaleProvider } from "@/i18n/locale";

const auth = vi.hoisted(() => ({ user: null as { email: string } | null, signOut: vi.fn() }));

vi.mock("next/navigation", () => ({ usePathname: () => "/pl" }));
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ enabled: true, loading: false, user: auth.user, signOut: auth.signOut }),
}));

beforeEach(() => {
  auth.user = null;
  auth.signOut.mockReset();
});

function renderMenu() {
  render(
    <LocaleProvider locale="pl">
      <MobileMenu showPractice />
    </LocaleProvider>,
  );
  return screen.getByRole("button", { name: "Menu" });
}

it("opens and closes the menu", () => {
  const button = renderMenu();
  expect(button).toHaveAttribute("aria-expanded", "false");
  fireEvent.click(button);
  expect(button).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("link", { name: /Ćwicz/ })).toHaveAttribute("href", "/pl/practice");
  expect(screen.getByRole("link", { name: "Zaloguj się" })).toHaveAttribute("href", "/pl/login");
  fireEvent.keyDown(window, { key: "Escape" });
  expect(button).toHaveAttribute("aria-expanded", "false");
});

it("shows the account links when signed in", () => {
  auth.user = { email: "student@example.com" };
  fireEvent.click(renderMenu());
  expect(screen.getByRole("link", { name: "Historia" })).toHaveAttribute("href", "/pl/history");
  expect(screen.getByRole("link", { name: /student@example.com/ })).toHaveAttribute(
    "href",
    "/pl/account",
  );
  fireEvent.click(screen.getByRole("button", { name: "Wyloguj się" }));
  expect(auth.signOut).toHaveBeenCalled();
});
