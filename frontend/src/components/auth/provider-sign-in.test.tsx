import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { ProviderSignIn } from "@/components/auth/provider-sign-in";
import { LocaleProvider } from "@/i18n/locale";

const signInWithOAuth = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  browserClient: () => ({ auth: { signInWithOAuth } }),
}));

beforeEach(() => signInWithOAuth.mockReset());

function renderButton(locale: "pl" | "en") {
  render(
    <LocaleProvider locale={locale}>
      <ProviderSignIn next="/history" />
    </LocaleProvider>,
  );
}

it("starts GitHub sign-in and keeps the localized next page", async () => {
  signInWithOAuth.mockResolvedValue({ data: {}, error: null });
  renderButton("en");
  fireEvent.click(screen.getByRole("button", { name: "Continue with GitHub" }));
  await waitFor(() =>
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=%2Fen%2Fhistory` },
    }),
  );
});

it("starts Google sign-in from its own button", async () => {
  signInWithOAuth.mockResolvedValue({ data: {}, error: null });
  renderButton("pl");
  fireEvent.click(screen.getByRole("button", { name: "Kontynuuj z Google" }));
  await waitFor(() =>
    expect(signInWithOAuth).toHaveBeenCalledWith(expect.objectContaining({ provider: "google" })),
  );
});

it("says so when GitHub cannot be reached", async () => {
  signInWithOAuth.mockResolvedValue({ data: {}, error: new Error("offline") });
  renderButton("pl");
  fireEvent.click(screen.getByRole("button", { name: "Kontynuuj z GitHubem" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Nie udało się połączyć z GitHubem.");
  expect(screen.getByRole("button", { name: "Kontynuuj z GitHubem" })).toBeEnabled();
});
