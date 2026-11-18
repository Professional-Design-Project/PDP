import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { ReportForm } from "@/components/reports/report-form";
import { LocaleProvider } from "@/i18n/locale";

const insert = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/client", () => ({
  browserClient: () => ({ from: () => ({ insert }) }),
}));

beforeEach(() => insert.mockReset());

function renderForm() {
  render(
    <LocaleProvider locale="en">
      <ReportForm />
    </LocaleProvider>,
  );
}

it("sends an idea and thanks the user", async () => {
  insert.mockResolvedValue({ error: null });
  renderForm();
  const send = screen.getByRole("button", { name: /Send report/ });
  expect(send).toBeDisabled();
  fireEvent.click(screen.getByLabelText("An idea"));
  fireEvent.change(screen.getByLabelText("Your message"), { target: { value: "Dark mode" } });
  fireEvent.click(send);
  await screen.findByText("Thanks, your report has been sent.");
  expect(insert).toHaveBeenCalledWith({ kind: "idea", message: "Dark mode" });
});

it("keeps the message when sending fails", async () => {
  insert.mockResolvedValue({ error: new Error("limit") });
  renderForm();
  fireEvent.change(screen.getByLabelText("Your message"), { target: { value: "Broken mic" } });
  fireEvent.click(screen.getByRole("button", { name: /Send report/ }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/could not be sent/));
  expect(screen.getByLabelText("Your message")).toHaveValue("Broken mic");
});
