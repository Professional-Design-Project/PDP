import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import Landing from "@/app/page";

it("introduces ensaio and links to the setup screen", () => {
  render(<Landing />);
  expect(
    screen.getByRole("heading", { level: 1, name: "Rehearse the conversation before it happens." }),
  ).toBeInTheDocument();
  const links = screen.getAllByRole("link", { name: /Set the room/ });
  expect(links.length).toBeGreaterThan(0);
  links.forEach((link) => expect(link).toHaveAttribute("href", "/practice"));
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
