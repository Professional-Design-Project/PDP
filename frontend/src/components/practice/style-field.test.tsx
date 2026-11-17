import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { expect, it } from "vitest";
import { StyleField } from "@/components/practice/style-field";
import { LocaleProvider } from "@/i18n/locale";
import { defaultStyle } from "@/lib/interview-style";

function Field() {
  const [style, setStyle] = useState(defaultStyle);
  return (
    <StyleField scenario="thesis-defence" value={style} disabled={false} onChange={setStyle} />
  );
}

it("explains what each slider changes and updates it as it moves", () => {
  render(
    <LocaleProvider locale="pl">
      <Field />
    </LocaleProvider>,
  );
  expect(screen.getByText("Dziedzina studiów")).toBeInTheDocument();
  expect(screen.getByText("Twoja praca")).toBeInTheDocument();
  expect(screen.getByText(/Około 50% pytań/)).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Nacisk"), { target: { value: "3" } });
  expect(screen.getByText(/podważa słabe punkty/)).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Dopytania"), { target: { value: "0" } });
  expect(screen.getByText(/przechodzi do nowego pytania/)).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Na czym skupiają się pytania"), {
    target: { value: "100" },
  });
  expect(screen.getByText(/Każde pytanie opiera się/)).toBeInTheDocument();
});

it("moves one step with the arrow keys", () => {
  render(
    <LocaleProvider locale="en">
      <Field />
    </LocaleProvider>,
  );
  const precision = screen.getByLabelText("Question precision");
  fireEvent.keyDown(precision, { key: "ArrowRight" });
  expect(precision).toHaveAttribute("aria-valuenow", "3");
  expect(screen.getByText(/Precise questions about details/)).toBeInTheDocument();
  fireEvent.keyDown(precision, { key: "Home" });
  expect(precision).toHaveAttribute("aria-valuenow", "1");
  const focus = screen.getByLabelText("Question focus");
  fireEvent.keyDown(focus, { key: "ArrowLeft" });
  expect(focus).toHaveAttribute("aria-valuenow", "40");
});
