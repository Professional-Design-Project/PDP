"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  CloseIcon,
  HangUpIcon,
  MicrophoneIcon,
  MicrophoneOffIcon,
  TranscriptIcon,
} from "@/components/icons";
import { PersonaPortrait } from "@/components/persona-portrait";
import { SpeakingBars } from "@/components/speaking-bars";
import { formatClock, type LiveState } from "@/components/session/session-state";

const LIMIT_SECONDS = 15 * 60;

type LiveSessionProps = {
  state: LiveState;
  connected: boolean;
  language: string;
  muted: boolean;
  ending: boolean;
  onToggleMute: () => void;
  onEnd: () => void;
};

function useClock(readyAt: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (readyAt === null) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [readyAt]);
  return readyAt === null
    ? 0
    : Math.min(LIMIT_SECONDS, Math.max(0, Math.floor((now - readyAt) / 1000)));
}

export function LiveSession({
  state,
  connected,
  language,
  muted,
  ending,
  onToggleMute,
  onEnd,
}: LiveSessionProps) {
  const [showTranscript, setShowTranscript] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const elapsed = useClock(state.readyAt);
  const live = state.readyAt !== null && connected;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }
    headingRef.current?.focus();
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [state.transcript.length, showTranscript]);

  const status = !live
    ? { label: "Joining the room", tone: "bg-ink-muted" }
    : state.botSpeaking
      ? { label: "Speaking", tone: "" }
      : { label: "Listening", tone: "bg-persona-sage" };

  const userTurn = state.userSpeaking || Boolean(state.userCaption);
  const lastQuestion = [...state.transcript].reverse().find((line) => line.role === "assistant");

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="session-title"
      onCancel={(event) => event.preventDefault()}
      className="fixed inset-0 z-50 m-0 h-dvh open:flex max-h-none w-full max-w-none animate-room flex-col overflow-hidden bg-ink p-0 text-white backdrop:bg-ink"
    >
      <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-ink-line px-4 sm:px-8">
        <Image src="/brand/logo-light.svg" alt="ensaio" width={88} height={31} />
        <p className="hidden text-[15px] text-ink-muted md:block">Job interview / {language}</p>
        <div className="flex items-center gap-5">
          <p className="text-[28px] leading-none font-bold tracking-[-0.04em] tabular-nums">
            {formatClock(elapsed)}
            <span className="sr-only"> elapsed of 15 minutes</span>
          </p>
          <p className="inline-flex items-center gap-2 text-[15px]">
            <span
              aria-hidden="true"
              className={`size-2.5 ${live ? "animate-pulse bg-cobalt" : "bg-ink-muted"}`}
            />
            {live ? "Live" : "Connecting"}
          </p>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col px-4 pt-8 pb-6 sm:px-8 sm:pt-12">
          <div className="flex items-center gap-5 border-b border-ink-line pb-8 sm:gap-8">
            <div
              className={`size-24 shrink-0 outline-4 outline-offset-0 transition-[outline-color] duration-500 sm:size-36 ${
                state.botSpeaking ? "outline-cobalt" : "outline-transparent"
              }`}
            >
              <PersonaPortrait tint="slate" className="size-full" />
            </div>
            <div className="min-w-0">
              <h2
                id="session-title"
                ref={headingRef}
                tabIndex={-1}
                className="text-[32px] leading-none font-bold tracking-[-0.03em] outline-none sm:text-[48px]"
              >
                Interviewer
              </h2>
              <p className="mt-2 text-ink-muted">AI interviewer, not a human</p>
              <p className="mt-3 inline-flex items-center gap-2 text-[15px]" aria-live="polite">
                {state.botSpeaking ? (
                  <SpeakingBars className="text-cobalt" />
                ) : (
                  <span aria-hidden="true" className={`size-2.5 ${status.tone}`} />
                )}
                {status.label}
              </p>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col justify-center py-8">
            {userTurn ? (
              <div key="user" className="animate-caption">
                <p className="inline-flex items-center gap-2 text-[15px] font-semibold text-persona-slate">
                  You
                  {state.userSpeaking && <SpeakingBars className="h-3" />}
                </p>
                <p className="mt-3 max-w-4xl text-[28px] leading-[1.2] font-medium tracking-tight sm:text-[40px]">
                  {state.userCaption || "Listening to you…"}
                </p>
              </div>
            ) : state.botCaption ? (
              <blockquote
                key="bot"
                className="max-w-4xl animate-caption text-[30px] leading-[1.15] font-medium tracking-tight sm:text-[48px]"
              >
                “{state.botCaption}”
              </blockquote>
            ) : (
              <p
                key="waiting"
                className="max-w-2xl animate-caption text-[26px] leading-snug text-ink-muted sm:text-[36px]"
              >
                {live ? "The interviewer is about to start." : "Setting the room…"}
              </p>
            )}

            <div className="mt-10 grid max-w-3xl gap-6 border-t border-ink-line pt-5 sm:grid-cols-2 sm:gap-10">
              <div>
                <p className="font-semibold">You</p>
                <p className="mt-1 text-[15px] leading-relaxed text-ink-muted">
                  {muted
                    ? "Your microphone is muted. Unmute it to answer."
                    : state.botSpeaking
                      ? "Take a breath. Answer when the question is finished."
                      : "Speak whenever you are ready. The interviewer waits for you."}
                </p>
              </div>
              {userTurn && (state.botCaption || lastQuestion) && (
                <div>
                  <p className="font-semibold">Last question</p>
                  <p className="mt-1 line-clamp-3 text-[15px] leading-relaxed text-ink-muted">
                    {state.botCaption || lastQuestion?.text}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <fieldset className="flex">
              <legend className="sr-only">Session controls</legend>
              <button
                type="button"
                onClick={onToggleMute}
                aria-pressed={muted}
                aria-label={muted ? "Unmute microphone" : "Mute microphone"}
                className={`grid size-16 place-items-center focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                  muted
                    ? "bg-persona-rose text-ink hover:bg-persona-rose/85"
                    : "bg-raised text-ink hover:bg-white"
                }`}
              >
                {muted ? (
                  <MicrophoneOffIcon className="size-6" />
                ) : (
                  <MicrophoneIcon className="size-6" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowTranscript((open) => !open)}
                aria-pressed={showTranscript}
                aria-label={showTranscript ? "Hide transcript" : "Show transcript"}
                className={`grid size-16 place-items-center border-l border-ink focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                  showTranscript
                    ? "bg-raised text-ink hover:bg-white"
                    : "bg-ink-line text-white hover:bg-ink-muted/30"
                }`}
              >
                <TranscriptIcon className="size-6" />
              </button>
              <button
                type="button"
                onClick={onEnd}
                disabled={ending}
                aria-label="End the session"
                className="grid size-16 place-items-center bg-cobalt text-white hover:bg-cobalt/85 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-60"
              >
                <HangUpIcon className="size-7" />
              </button>
            </fieldset>
            <p className="text-[13px] text-ink-muted">
              {ending
                ? "Ending the session…"
                : "Your voice goes to an external AI provider while the session runs."}
            </p>
          </div>
        </div>

        {showTranscript && (
          <aside
            aria-label="Transcript"
            className="absolute top-16 right-0 bottom-28 z-10 lg:bottom-auto flex w-full animate-panel flex-col bg-canvas text-ink sm:w-[26rem] lg:static lg:inset-auto"
          >
            <div className="flex items-center justify-between border-b-2 border-ink px-6 py-5">
              <h2 className="text-[30px] leading-none font-bold tracking-[-0.03em]">Transcript</h2>
              <button
                type="button"
                onClick={() => setShowTranscript(false)}
                aria-label="Close transcript"
                className="grid size-10 place-items-center hover:bg-raised focus-visible:outline-2 focus-visible:outline-cobalt"
              >
                <CloseIcon className="size-5" />
              </button>
            </div>
            <ol ref={listRef} className="min-h-0 flex-1 scroll-smooth overflow-y-auto">
              {state.transcript.length === 0 && (
                <li className="px-6 py-8 text-[15px] text-muted">
                  Lines appear here as soon as each turn is finished.
                </li>
              )}
              {state.transcript.map((line) => (
                <li
                  key={line.id}
                  className={`grid grid-cols-[3.5rem_1fr] gap-3 border-b border-line px-6 py-5 ${
                    line.role === "user" ? "bg-raised" : "bg-white"
                  }`}
                >
                  <span className="text-[14px] text-muted tabular-nums">
                    {formatClock(line.at)}
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold">
                      {line.role === "user" ? "You" : "Interviewer"}
                      {line.interrupted && (
                        <span className="font-normal text-muted"> · interrupted</span>
                      )}
                    </p>
                    <p className="mt-1 leading-relaxed">{line.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="border-t border-line px-6 py-4 text-[13px] leading-relaxed text-muted">
              Your interviewer is an AI, not a human. Its voice is synthetic.
            </p>
          </aside>
        )}
      </div>
    </dialog>
  );
}
