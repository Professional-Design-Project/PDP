import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SessionActions } from "@/components/history/session-actions";
import { LocaleProvider } from "@/i18n/locale";
import type { PastSessionDetail } from "@/lib/history";

const session: PastSessionDetail = {
  id: "abc",
  scenarioId: "oral-exam",
  language: "en",
  status: "ended",
  createdAt: "2026-11-18T10:00:00Z",
  duration: 600,
  transcript: [],
  feedback: null,
};

afterEach(() => vi.restoreAllMocks());

it("links to the practice room with the same settings", () => {
  render(
    <LocaleProvider locale="en">
      <SessionActions session={session} />
    </LocaleProvider>,
  );
  expect(screen.getByRole("link", { name: /Practise again/ })).toHaveAttribute(
    "href",
    "/en/practice?again=abc",
  );
});

it("prints the session under a file-friendly title and restores the page title", () => {
  document.title = "Your sessions";
  const print = vi.spyOn(window, "print").mockImplementation(() => {
    expect(document.title).toMatch(/^ensaio - Oral exam - /);
    window.dispatchEvent(new Event("afterprint"));
  });
  render(
    <LocaleProvider locale="en">
      <SessionActions session={session} />
    </LocaleProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: /Download PDF/ }));
  expect(print).toHaveBeenCalledOnce();
  expect(document.title).toBe("Your sessions");
});
