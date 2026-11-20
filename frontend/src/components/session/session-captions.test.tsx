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

it("keeps long captions in a scrolling area that follows the newest words", () => {
  const { rerender } = renderCaptions("Hello.");
  const area = screen.getByTestId("caption-scroll");
  Object.defineProperty(area, "scrollHeight", { configurable: true, value: 900 });
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
  expect(area).toHaveClass("overflow-y-auto", "min-h-0");
  expect(area.scrollTop).toBe(900);
  expect(screen.getByText("You").closest("div.grid")).toHaveClass("shrink-0");
});
