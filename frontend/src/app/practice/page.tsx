"use client";

import { useEffect, useReducer, useRef, useState, useSyncExternalStore } from "react";
import { arrowMotion } from "@/components/button-styles";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  ExamIcon,
  GraduationIcon,
  MicrophoneIcon,
} from "@/components/icons";
import { ConsentPanel } from "@/components/consent-panel";
import { DocumentsField } from "@/components/documents-field";
import {
  checkFile,
  guessKind,
  kindsFor,
  MAX_DOCUMENTS,
  type DocumentKind,
  type SessionDocument,
} from "@/lib/documents";
import {
  allowsSession,
  CONSENT_VERSION,
  getConsentSnapshot,
  getServerConsent,
  saveConsent,
  subscribeConsent,
  type ConsentKey,
} from "@/lib/consent";
import { useLocale, type Locale } from "@/i18n/locale";
import { scenarioIds, type ScenarioId } from "@/lib/scenarios";
import { Loader } from "@/components/loader";
import { Rise } from "@/components/rise";
import { Section } from "@/components/section";
import { LiveSession } from "@/components/session/live-session";
import {
  endKind,
  type EndKind,
  initialLiveState,
  liveReducer,
  type FeedbackResult,
  type FeedbackState,
  type TranscriptLine,
} from "@/components/session/session-state";
import { SessionSummary } from "@/components/session/session-summary";
import { StatusLine } from "@/components/status-line";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/v1";
const CONTEXT_LIMIT = 2000;

const scenarioIcons: Record<ScenarioId, typeof BriefcaseIcon> = {
  "job-interview": BriefcaseIcon,
  "thesis-defence": GraduationIcon,
  "oral-exam": ExamIcon,
};

const languages: { value: Locale; label: string }[] = [
  { value: "pl", label: "Polski" },
  { value: "en", label: "English" },
];

type MicStatus =
  | "unchecked"
  | "checking"
  | "available"
  | "none"
  | "denied"
  | "unavailable"
  | "insecure";
type ConnectionStatus = "ready" | "requesting" | "connecting" | "connected" | "failed";

type Session = {
  id: string;
  access_token: string;
  signaling_url: string;
  ice_servers: RTCIceServer[];
};

class HttpError extends Error {
  constructor(readonly status: number) {
    super(`Request failed (${status})`);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = path.startsWith("/v1") ? new URL(path, API_URL).toString() : `${API_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!response.ok) throw new HttpError(response.status);
  return response.json() as Promise<T>;
}

function micTone(status: MicStatus) {
  if (status === "available") return "good";
  if (status === "unchecked" || status === "checking") return "neutral";
  return "bad";
}

export default function Home() {
  const [phase, setPhase] = useState<"setup" | "session" | "summary">("setup");
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [ending, setEnding] = useState(false);
  const [muted, setMuted] = useState(false);
  const [live, dispatch] = useReducer(liveReducer, initialLiveState);
  const [summary, setSummary] = useState<{
    duration: number;
    transcript: TranscriptLine[];
    end: EndKind;
  } | null>(null);
  const [scenario, setScenario] = useState<ScenarioId>("job-interview");
  const consent = useSyncExternalStore(subscribeConsent, getConsentSnapshot, getServerConsent);
  const { locale, t } = useLocale();
  const [chosenLanguage, setLanguage] = useState<Locale | null>(null);
  const language = chosenLanguage ?? locale;
  const copy = t.scenarios[scenario];
  const [context, setContext] = useState("");
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [microphone, setMicrophone] = useState("");
  const [micStatus, setMicStatus] = useState<MicStatus>("unchecked");
  const [status, setStatus] = useState<ConnectionStatus>("ready");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const liveRef = useRef(live);
  const finishingRef = useRef(false);
  const lastSessionRef = useRef<Session | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>({ status: "undecided" });

  const locked = phase !== "setup" || connecting;
  const languageLabel = languages.find((option) => option.value === language)?.label ?? language;
  const selectedMicrophone = microphones.find((device) => device.deviceId === microphone);
  const microphoneSummary = selectedMicrophone
    ? selectedMicrophone.label || t.setup.selectedMicrophone
    : micStatus === "available"
      ? t.setup.defaultMicrophone
      : t.setup.mic.unchecked;

  useEffect(() => {
    liveRef.current = live;
  }, [live]);

  function changeConsent(key: ConsentKey, value: boolean) {
    saveConsent({ ...consent, [key]: value });
  }

  const [documents, setDocuments] = useState<SessionDocument[]>([]);
  const kinds = kindsFor[scenario];
  const readingDocuments = documents.some((document) => document.status === "reading");
  const readyDocuments = documents.filter((document) => document.status === "ready");

  function updateDocument(id: string, change: Partial<SessionDocument>) {
    setDocuments((current) =>
      current.map((document) => (document.id === id ? { ...document, ...change } : document)),
    );
  }

  async function readDocument(id: string, file: File) {
    const body = new FormData();
    body.append("file", file);
    try {
      const response = await fetch(`${API_URL}/documents/extract`, { method: "POST", body });
      if (!response.ok) {
        const error =
          response.status === 415
            ? "type"
            : response.status === 413
              ? "size"
              : response.status === 422
                ? "empty"
                : "read";
        updateDocument(id, { status: "error", error });
        return;
      }
      const result = (await response.json()) as { text: string; truncated: boolean };
      updateDocument(id, { status: "ready", text: result.text, truncated: result.truncated });
    } catch {
      updateDocument(id, { status: "error", error: "read" });
    }
  }

  function addFiles(files: File[]) {
    const room = Math.max(0, MAX_DOCUMENTS - documents.length);
    const added = files.slice(0, room).map((file) => {
      const error = checkFile(file);
      return {
        file,
        document: {
          id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
          name: file.name,
          size: file.size,
          kind: guessKind(file.name, scenario),
          status: error ? "error" : "reading",
          text: "",
          truncated: false,
          error,
        } satisfies SessionDocument,
      };
    });
    if (!added.length) return;
    setDocuments((current) => [...current, ...added.map((item) => item.document)]);
    added
      .filter((item) => item.document.status === "reading")
      .forEach((item) => void readDocument(item.document.id, item.file));
  }

  function chooseScenario(id: ScenarioId) {
    setScenario(id);
    setDocuments((current) =>
      current.map((document) =>
        kindsFor[id].includes(document.kind)
          ? document
          : { ...document, kind: guessKind(document.name, id) },
      ),
    );
  }

  const canEnter = allowsSession(consent);

  async function checkMicrophone() {
    if (!navigator.mediaDevices?.getUserMedia || !navigator.mediaDevices.enumerateDevices) {
      setMicStatus("insecure");
      return;
    }

    setChecking(true);
    setMicStatus("checking");
    let stream: MediaStream | undefined;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: microphone ? { deviceId: { exact: microphone } } : true,
      });
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices.filter((device) => device.kind === "audioinput");
      setMicrophones(inputs);
      const usedId = microphone || stream.getAudioTracks()[0]?.getSettings().deviceId;
      setMicrophone(
        inputs.some((device) => device.deviceId === usedId) ? usedId! : inputs[0]?.deviceId || "",
      );
      setMicStatus(inputs.length ? "available" : "none");
    } catch (caught) {
      setMicStatus(
        caught instanceof DOMException && caught.name === "NotAllowedError"
          ? "denied"
          : "unavailable",
      );
    } finally {
      stream?.getTracks().forEach((track) => track.stop());
      setChecking(false);
    }
  }

  async function stopConversation() {
    const session = sessionRef.current;
    peerRef.current?.close();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (audioRef.current) audioRef.current.srcObject = null;
    peerRef.current = null;
    streamRef.current = null;
    sessionRef.current = null;
    setConnected(false);
    setStatus("ready");
    if (session) {
      await request(`/sessions/${session.id}/end`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).catch(() => undefined);
    }
  }

  async function requestFeedback() {
    const session = lastSessionRef.current;
    if (!session) {
      setFeedback({ status: "failed" });
      return;
    }
    setFeedback({ status: "loading" });
    try {
      const result = await request<FeedbackResult>(`/sessions/${session.id}/feedback`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setFeedback({ status: "ready", result });
    } catch (caught) {
      setFeedback({
        status: caught instanceof HttpError && caught.status === 409 ? "unavailable" : "failed",
      });
    }
  }

  async function finishSession(reason: string, failed: boolean, wantsFeedback?: boolean) {
    if (finishingRef.current) return;
    finishingRef.current = true;
    const current = liveRef.current;
    const duration =
      current.readyAt === null ? 0 : Math.max(0, Math.round((Date.now() - current.readyAt) / 1000));
    await stopConversation();
    setSummary({ duration, transcript: current.transcript, end: endKind(reason, failed) });
    setPhase("summary");
    setMuted(false);
    window.scrollTo({ top: 0 });
    if (wantsFeedback === true) void requestFeedback();
    else setFeedback({ status: wantsFeedback === false ? "declined" : "undecided" });
  }

  const finishRef = useRef(finishSession);
  useEffect(() => {
    finishRef.current = finishSession;
  });

  useEffect(() => {
    if (live.ended) void finishRef.current(live.ended.reason, live.ended.failed);
  }, [live.ended]);

  async function endSession(wantsFeedback: boolean) {
    setEnding(true);
    await finishSession("user_ended", false, wantsFeedback);
    setEnding(false);
  }

  function toggleMute() {
    const next = !muted;
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !next;
    });
    setMuted(next);
  }

  async function startConversation() {
    setError("");
    setSummary(null);
    setFeedback({ status: "undecided" });
    setMuted(false);
    dispatch({ type: "reset" });
    finishingRef.current = false;
    setConnecting(true);
    setPhase("session");
    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: microphone ? { deviceId: { exact: microphone } } : true,
      });
      streamRef.current = stream;
      const session = await request<Session>("/sessions", {
        method: "POST",
        body: JSON.stringify({
          scenario_id: scenario,
          language,
          context,
          consent: { version: CONSENT_VERSION, language: locale, ...consent },
          documents: readyDocuments.map(({ name, kind, text }) => ({ name, kind, text })),
        }),
      });
      const peer = new RTCPeerConnection({ iceServers: session.ice_servers });
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      peer.ontrack = (event) => {
        const audio = audioRef.current ?? new Audio();
        audio.autoplay = true;
        audioRef.current = audio;
        audio.srcObject = event.streams[0] || new MediaStream([event.track]);
        void audio.play();
      };
      peer.onconnectionstatechange = () => {
        if (peer.connectionState === "failed") void finishRef.current("transport_failed", true);
      };
      const channel = peer.createDataChannel("rtvi-ai");
      channel.onmessage = (event) => {
        try {
          dispatch({ type: "message", message: JSON.parse(event.data), now: Date.now() });
        } catch {
          return;
        }
      };
      sessionRef.current = session;
      lastSessionRef.current = session;
      peerRef.current = peer;
      setStatus("connecting");

      await peer.setLocalDescription(await peer.createOffer());
      if (peer.iceGatheringState !== "complete") {
        await new Promise<void>((resolve) => {
          const check = () => {
            if (peer.iceGatheringState === "complete") {
              peer.removeEventListener("icegatheringstatechange", check);
              resolve();
            }
          };
          peer.addEventListener("icegatheringstatechange", check);
          setTimeout(resolve, 10000);
        });
      }
      const answer = await request<{ type: RTCSdpType; sdp: string }>(session.signaling_url, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ type: "offer", sdp: peer.localDescription?.sdp }),
      });
      await peer.setRemoteDescription(answer);
      setConnected(true);
      setStatus("connected");
    } catch (caught) {
      finishingRef.current = true;
      await stopConversation();
      setPhase("setup");
      setError(t.setup.startFailed(caught instanceof Error ? caught.message : ""));
      setStatus("failed");
    } finally {
      setConnecting(false);
    }
  }

  if (phase === "summary" && summary) {
    return (
      <SessionSummary
        duration={summary.duration}
        transcript={summary.transcript}
        message={t.summary.ended[summary.end]}
        heading={copy.finished}
        feedback={feedback}
        onRequestFeedback={() => void requestFeedback()}
        onAgain={() => void startConversation()}
        onSetup={() => setPhase("setup")}
      />
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pt-12 pb-24 sm:px-8 sm:pt-16">
      <div className="grid gap-6 lg:grid-cols-12 lg:items-start lg:gap-8">
        <Rise
          as="h1"
          className="text-5xl leading-none font-bold tracking-[-0.04em] sm:text-7xl lg:col-span-7"
        >
          {t.setup.title}
        </Rise>
        <Rise as="p" delay={50} className="max-w-md text-lg text-ink/80 lg:col-span-5">
          {t.setup.intro}
        </Rise>
      </div>

      <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:gap-8">
        <Rise delay={100} className="space-y-14 lg:col-span-8">
          <Section number={1} title={t.setup.scenario}>
            <fieldset
              disabled={locked}
              className="grid border-t border-l border-line sm:grid-cols-3"
            >
              <legend className="sr-only">{t.setup.scenario}</legend>
              {scenarioIds.map((id) => {
                const Icon = scenarioIcons[id];
                return (
                  <label
                    key={id}
                    className="group flex min-h-44 flex-col border-r border-b border-line bg-white p-5 text-ink duration-300 hover:bg-raised has-checked:border-cobalt has-checked:bg-cobalt has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink"
                  >
                    <input
                      type="radio"
                      name="scenario"
                      value={id}
                      checked={scenario === id}
                      onChange={() => chooseScenario(id)}
                      className="sr-only"
                    />
                    <Icon className="size-6 transition-transform duration-300 ease-(--ease-soft) group-hover:-translate-y-0.5" />
                    <span className="pt-10 text-[22px] leading-tight font-bold">
                      {t.scenarios[id].title}
                    </span>
                    <span className="mt-2 text-[15px] text-muted group-has-checked:text-white/85">
                      {t.scenarios[id].description}
                    </span>
                  </label>
                );
              })}
            </fieldset>
          </Section>

          <Section number={2} title={t.setup.context} description={t.setup.contextIntro}>
            <div className="space-y-8">
              <div>
                <div className="flex items-baseline justify-between gap-4">
                  <label htmlFor="context" className="font-semibold">
                    {t.setup.contextLabel}
                  </label>
                  <span className="text-[13px] text-muted tabular-nums">
                    {context.length} / {CONTEXT_LIMIT}
                  </span>
                </div>
                <textarea
                  id="context"
                  value={context}
                  maxLength={CONTEXT_LIMIT}
                  disabled={locked}
                  onChange={(event) => setContext(event.target.value)}
                  onPaste={(event) => {
                    const files = Array.from(event.clipboardData.files);
                    if (!files.length) return;
                    event.preventDefault();
                    addFiles(files);
                  }}
                  placeholder={copy.placeholder}
                  className="mt-2 block min-h-36 w-full resize-y border border-line bg-white p-4 placeholder:text-muted/80 focus-visible:border-ink focus-visible:outline-none disabled:bg-raised disabled:text-muted"
                />
              </div>

              <DocumentsField
                documents={documents}
                kinds={kinds}
                disabled={locked}
                onAdd={addFiles}
                onRemove={(id) =>
                  setDocuments((current) => current.filter((document) => document.id !== id))
                }
                onKindChange={(id, kind: DocumentKind) => updateDocument(id, { kind })}
              />

              <fieldset disabled={locked}>
                <legend className="font-semibold">{t.setup.conversationLanguage}</legend>
                <div className="mt-2 grid w-full grid-cols-2 sm:w-80">
                  {languages.map((option) => (
                    <label
                      key={option.value}
                      className="flex h-12 cursor-pointer items-center justify-center border border-ink text-[15px] font-semibold not-first:border-l-0 has-checked:bg-ink has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-cobalt has-disabled:cursor-not-allowed has-disabled:opacity-60"
                    >
                      <input
                        type="radio"
                        name="language"
                        value={option.value}
                        checked={language === option.value}
                        onChange={() => setLanguage(option.value)}
                        className="sr-only"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div>
                <label htmlFor="microphone" className="font-semibold">
                  {t.setup.microphone}
                </label>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                  <select
                    id="microphone"
                    value={microphone}
                    disabled={checking || locked || microphones.length === 0}
                    onChange={(event) => {
                      setMicrophone(event.target.value);
                      setMicStatus("unchecked");
                    }}
                    className="h-12 min-w-0 border sm:flex-1 border-line bg-white px-3 focus-visible:border-ink focus-visible:outline-none disabled:bg-raised disabled:text-muted"
                  >
                    {microphones.length === 0 && (
                      <option value="">{t.setup.listMicrophones}</option>
                    )}
                    {microphones.map((device, index) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || t.setup.microphoneNumber(index + 1)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={checking || locked}
                    onClick={checkMicrophone}
                    className="inline-flex h-12 items-center justify-center gap-2 border border-ink px-5 font-semibold hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-ink"
                  >
                    <MicrophoneIcon className="size-5" />
                    {checking ? t.setup.checking : t.setup.checkMicrophone}
                  </button>
                </div>
                <output className="mt-3 block text-[15px] text-muted">
                  <StatusLine tone={micTone(micStatus)}>{t.setup.mic[micStatus]}</StatusLine>
                </output>
              </div>
            </div>
          </Section>
        </Rise>

        <Rise as="aside" delay={150} className="lg:sticky lg:top-8 lg:col-span-4 lg:self-start">
          <div className="bg-ink p-6 text-white">
            <h2 className="text-[28px] leading-tight font-bold tracking-tight">
              {t.setup.yourSession}
            </h2>
            <dl className="mt-5 text-[15px]">
              {[
                [t.setup.scenario, copy.title],
                [t.setup.language, languageLabel],
                [
                  t.setup.context,
                  context.trim()
                    ? t.setup.contextSummary(context.trim().length)
                    : t.setup.noContext,
                ],
                [
                  t.setup.documentsRow,
                  readyDocuments.length
                    ? t.documents.summary(readyDocuments.length)
                    : t.setup.noContext,
                ],
                [t.setup.microphone, microphoneSummary],
              ].map(([term, value]) => (
                <div
                  key={term}
                  className="flex justify-between gap-6 border-t border-ink-line py-2.5"
                >
                  <dt className="text-ink-muted">{term}</dt>
                  <dd className="truncate text-right">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 border-t border-ink-line pt-5">
              <p className="font-semibold">{t.setup.aiNoticeTitle}</p>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
                {t.setup.aiNoticeText}
              </p>
            </div>
          </div>

          <div className="border border-t-0 border-line bg-white p-6">
            <ConsentPanel choices={consent} disabled={locked} onChange={changeConsent} />
            <div className="mt-6 border-t border-line pt-6" />
            <button
              type="button"
              disabled={locked || !canEnter || readingDocuments}
              onClick={() => void startConversation()}
              className={`group flex h-14 w-full items-center justify-between bg-cobalt px-5 text-lg font-semibold text-white hover:bg-cobalt/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:bg-raised disabled:text-muted ${connecting ? "disabled:cursor-wait" : "disabled:cursor-not-allowed"}`}
            >
              {connecting ? t.setup.connecting : t.setup.enter}
              {connecting ? (
                <Loader className="text-[22px]" />
              ) : (
                <ArrowRightIcon className={arrowMotion} />
              )}
            </button>
            <output className="mt-3 block text-[14px] text-muted">
              <StatusLine tone={error ? "bad" : canEnter ? "neutral" : "bad"}>
                {canEnter ? t.setup.status[status] : t.setup.tickRequired}
              </StatusLine>
            </output>
            {error && (
              <p role="alert" className="mt-2 text-[14px] text-ink">
                {error}
              </p>
            )}
          </div>
        </Rise>
      </div>

      {phase === "session" && (
        <LiveSession
          state={live}
          connected={connected}
          language={languageLabel}
          scenario={copy.title}
          muted={muted}
          ending={ending}
          onToggleMute={toggleMute}
          onLeave={(withFeedback) => void endSession(withFeedback)}
        />
      )}
    </main>
  );
}
