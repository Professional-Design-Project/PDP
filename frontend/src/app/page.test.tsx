import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import Home from "@/app/page";

it("renders the main landmark", () => {
  render(<Home />);
  expect(screen.getByRole("main")).toBeInTheDocument();
});
