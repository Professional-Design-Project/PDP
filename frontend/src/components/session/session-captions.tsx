"use client";

import { Loader } from "@/components/loader";
import { CaptionScroll } from "@/components/session/caption-scroll";
import type { LiveState } from "@/components/session/session-state";
import { SpeakingBars } from "@/components/speaking-bars";
import { useLocale } from "@/i18n/locale";

type SessionCaptionsProps = {
  state: LiveState;
  live: boolean;
  muted: boolean;
};

export function SessionCaptions({ state, live, muted }: SessionCaptionsProps) {
  const { t } = useLocale();
  const userTurn = state.userSpeaking || Boolean(state.userCaption);
  const lastQuestion = [...state.transcript].reverse().find((line) => line.role === "assistant");
  const question = state.botCaption || lastQuestion?.text;
  const hint = muted ? t.live.hintMuted : state.botSpeaking ? t.live.hintWait : t.live.hintReady;

  return (
    <div className="flex min-h-0 flex-1 flex-col pt-8 pb-6">
      <CaptionScroll follow={userTurn ? state.userCaption : state.botCaption}>
        {userTurn ? (
          <div key="user" className="animate-caption">
            <p className="inline-flex items-center gap-2 text-[15px] font-semibold text-persona-slate">
              {t.common.you}
              {state.userSpeaking && <SpeakingBars className="h-3" />}
            </p>
            <p className="mt-3 max-w-4xl text-[28px] leading-[1.2] font-medium tracking-tight sm:text-[40px]">
              {state.userCaption || t.live.listeningToYou}
            </p>
          </div>
        ) : state.botCaption ? (
          <blockquote
            key="bot"
            className="max-w-4xl animate-caption text-[30px] leading-[1.15] font-medium tracking-tight sm:text-[48px]"
          >
            {t.common.quote(state.botCaption.trim())}
          </blockquote>
        ) : (
          <p
            key="waiting"
            className="max-w-2xl animate-caption text-[26px] leading-snug text-ink-muted sm:text-[36px]"
          >
            {live ? t.live.aboutToStart : t.live.settingRoom}
            <Loader className="ml-3 align-middle text-[0.5em] text-cobalt" />
          </p>
        )}
      </CaptionScroll>

      <div className="mt-6 grid max-w-3xl shrink-0 content-start gap-6 border-t border-ink-line pt-5 sm:min-h-32 sm:grid-cols-2 sm:gap-10">
        <div>
          <p className="font-semibold">{t.common.you}</p>
          <p className="mt-1 text-[15px] leading-relaxed text-ink-muted">{hint}</p>
        </div>
        {userTurn && question && (
          <div>
            <p className="font-semibold">{t.live.lastQuestion}</p>
            <p className="mt-1 line-clamp-3 text-[15px] leading-relaxed text-ink-muted">
              {question}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
