import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { FinishedPanel } from "@/components/session/finished-panel";
import { LocaleProvider } from "@/i18n/locale";

function renderPanel(canRecord: boolean) {
  const onChoose = vi.fn();
  render(
    <LocaleProvider locale="en">
      <FinishedPanel canRecord={canRecord} onChoose={onChoose} />
    </LocaleProvider>,
  );
  return onChoose;
}

it("asks what to keep when the interviewer ended the conversation", () => {
  const onChoose = renderPanel(true);
  expect(screen.getByRole("heading", { name: "The conversation is over" })).toBeInTheDocument();
  expect(screen.getByRole("checkbox", { name: /Get feedback/ })).toBeChecked();
  const recording = screen.getByRole("checkbox", { name: /Save the recording/ });
  expect(recording).not.toBeChecked();
  fireEvent.click(recording);
  fireEvent.click(screen.getByRole("button", { name: "Show the summary" }));
  expect(onChoose).toHaveBeenCalledWith({ feedback: true, recording: true });
});

it("offers only feedback to guests", () => {
  const onChoose = renderPanel(false);
  expect(screen.queryByRole("checkbox", { name: /Save the recording/ })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("checkbox", { name: /Get feedback/ }));
  fireEvent.click(screen.getByRole("button", { name: "Show the summary" }));
  expect(onChoose).toHaveBeenCalledWith({ feedback: false, recording: false });
});
