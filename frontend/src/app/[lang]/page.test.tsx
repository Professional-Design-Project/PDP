import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import Landing from "@/app/[lang]/page";

it("introduces ensaio and links to the setup screen", () => {
  render(<Landing />);
  expect(
    screen.getByRole("heading", { level: 1, name: "Rehearse the conversation before it happens." }),
  ).toBeInTheDocument();
  const links = screen.getAllByRole("link", { name: /Set the room/ });
  expect(links.length).toBeGreaterThan(0);
  links.forEach((link) => expect(link).toHaveAttribute("href", "/en/practice"));
  expect(screen.getByRole("link", { name: "How it works" })).toHaveAttribute(
    "href",
    "#how-it-works",
  );
});

it("lets the visitor pick who speaks in the room", () => {
  render(<Landing />);
  expect(screen.getByRole("button", { name: "Hear the hiring manager" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  fireEvent.click(screen.getByRole("button", { name: "Hear the tech lead" }));
  expect(screen.getByRole("button", { name: "Hear the tech lead" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.getByText(/Why that database/)).toBeInTheDocument();
});

it("shows how a different context changes the questions", () => {
  render(<Landing />);
  expect(screen.getByText(/store payments so nothing is ever counted twice/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("radio", { name: "Product designer" }));
  expect(
    screen.getByText(/Which decision in this project did research change/),
  ).toBeInTheDocument();
  expect(screen.queryByText(/store payments/)).not.toBeInTheDocument();
});
