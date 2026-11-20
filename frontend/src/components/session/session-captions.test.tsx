import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { SessionCaptions } from "@/components/session/session-captions";
import { initialLiveState } from "@/components/session/session-state";
import { LocaleProvider } from "@/i18n/locale";

function renderCaptions(botCaption: string) {
  return render(
    <LocaleProvider locale="en">
      <SessionCaptions
        state={{ ...initialLiveState, readyAt: Date.now(), botSpeaking: true, botCaption }}
        live
        muted={false}
      />
    </LocaleProvider>,
  );
}

it("keeps long captions in a fixed area without a scrollbar that shows the newest words", () => {
  const { rerender } = renderCaptions("Hello.");
  const area = screen.getByTestId("caption-scroll");
  Object.defineProperty(area, "scrollHeight", { configurable: true, value: 900 });
  Object.defineProperty(area, "clientHeight", { configurable: true, value: 300 });
  rerender(
    <LocaleProvider locale="en">
      <SessionCaptions
        state={{
          ...initialLiveState,
          readyAt: Date.now(),
          botSpeaking: true,
          botCaption: "Hello. ".repeat(80),
        }}
        live
        muted={false}
      />
    </LocaleProvider>,
  );
  expect(area).toHaveClass("overflow-hidden", "min-h-0");
  expect(area).not.toHaveClass("overflow-y-auto");
  expect(area.scrollTop).toBe(900);
  expect(area).toHaveAttribute("data-clipped", "true");
  expect(area).toHaveClass("flex-1");
  expect(screen.getByText("You").closest("div.grid")).toHaveClass("shrink-0", "sm:min-h-32");
});

it("does not fade a caption that fits", () => {
  renderCaptions("Hello.");
  expect(screen.getByTestId("caption-scroll")).toHaveAttribute("data-clipped", "false");
});
