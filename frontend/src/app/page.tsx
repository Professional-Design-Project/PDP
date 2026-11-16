"use client";

import { useRef, useState } from "react";
import { ArrowRightIcon, BriefcaseIcon, MicrophoneIcon } from "@/components/icons";
import { Section } from "@/components/section";
import { SiteHeader } from "@/components/site-header";
import { StatusLine } from "@/components/status-line";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/v1";
const CONTEXT_LIMIT = 2000;

const languages = [
  { value: "pl", label: "Polski" },
  { value: "en", label: "English" },
];

type Session = {
  id: string;
  access_token: string;
  signaling_url: string;
  ice_servers: RTCIceServer[];
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = path.startsWith("/v1") ? new URL(path, API_URL).toString() : `${API_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json() as Promise<T>;
}

function micTone(status: string) {
  if (status === "Microphone available") return "good";
  if (status === "Not checked" || status === "Checking...") return "neutral";
  return "bad";
}

export default function Home() {
  const [active, setActive] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [language, setLanguage] = useState("pl");
  const [context, setContext] = useState("");
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [microphone, setMicrophone] = useState("");
  const [micStatus, setMicStatus] = useState("Not checked");
  const [status, setStatus] = useState("Ready");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<Session | null>(null);

  const locked = active || connecting;
  const selectedMicrophone = microphones.find((device) => device.deviceId === microphone);
  const microphoneSummary = selectedMicrophone
    ? selectedMicrophone.label || "Selected"
    : micStatus === "Microphone available"
      ? "Default"
      : "Not checked";

  async function checkMicrophone() {
    if (!navigator.mediaDevices?.getUserMedia || !navigator.mediaDevices.enumerateDevices) {
      setMicStatus("Microphone access requires HTTPS or localhost.");
      return;
    }

    setChecking(true);
    setMicStatus("Checking...");
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
      setMicStatus(inputs.length ? "Microphone available" : "No microphone found");
    } catch (caught) {
      setMicStatus(
        caught instanceof DOMException && caught.name === "NotAllowedError"
          ? "Microphone permission denied"
          : "Microphone unavailable",
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
    setActive(false);
    setStatus("Ready");
    if (session) {
      await request(`/sessions/${session.id}/end`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).catch(() => undefined);
    }
  }

  async function startConversation() {
    setError("");
    setConnecting(true);
    setStatus("Requesting microphone...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: microphone ? { deviceId: { exact: microphone } } : true,
      });
      streamRef.current = stream;
      const session = await request<Session>("/sessions", {
        method: "POST",
        body: JSON.stringify({ scenario_id: "job-interview", language, context }),
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
      peer.createDataChannel("rtvi-ai");
      sessionRef.current = session;
      peerRef.current = peer;
      setStatus("Connecting...");

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
      const answer = await request<{ type: RTCSdpType; sdp: string }>(
        session.signaling_url,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ type: "offer", sdp: peer.localDescription?.sdp }),
        },
      );
      await peer.setRemoteDescription(answer);
      setActive(true);
      setStatus("Connected");
    } catch (caught) {
      await stopConversation();
      setError(caught instanceof Error ? caught.message : "Could not start the conversation.");
      setStatus("Not connected");
    } finally {
      setConnecting(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 pt-12 pb-24 sm:px-8 sm:pt-16">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-start lg:gap-8">
          <h1 className="text-5xl leading-none font-bold tracking-[-0.04em] sm:text-7xl lg:col-span-7">
            Set the room.
          </h1>
          <p className="max-w-md text-lg text-ink/80 lg:col-span-5">
            Pick a scenario, describe the situation you want to practise and check your microphone.
            The interviewer works only with what you give it.
          </p>
        </div>

        <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-14 lg:col-span-8">
            <Section number={1} title="Scenario">
              <fieldset disabled={locked} className="grid sm:grid-cols-3">
                <legend className="sr-only">Scenario</legend>
                <label className="flex min-h-44 cursor-pointer flex-col border border-cobalt bg-cobalt p-5 text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink">
                  <input type="radio" name="scenario" value="job-interview" defaultChecked className="sr-only" />
                  <BriefcaseIcon className="size-6" />
                  <span className="mt-auto pt-8 text-[22px] leading-tight font-bold">Job interview</span>
                  <span className="mt-2 text-[15px] text-white/85">
                    Questions about your experience and the role. One interviewer.
                  </span>
                </label>
              </fieldset>
            </Section>

            <Section
              number={2}
              title="Context"
              description="Tell the interviewer about the role, the company or the situation. It reads only what is here."
            >
              <div className="space-y-8">
                <div>
                  <div className="flex items-baseline justify-between gap-4">
                    <label htmlFor="context" className="font-semibold">
                      Additional context
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
                    placeholder="For example: junior backend developer at a fintech, second round, they asked about system design last time."
                    className="mt-2 block min-h-36 w-full resize-y border border-line bg-white p-4 placeholder:text-muted/80 focus-visible:border-ink focus-visible:outline-none disabled:bg-raised disabled:text-muted"
                  />
                </div>

                <fieldset disabled={locked}>
                  <legend className="font-semibold">Conversation language</legend>
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
                    Microphone
                  </label>
                  <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                    <select
                      id="microphone"
                      value={microphone}
                      disabled={checking || locked || microphones.length === 0}
                      onChange={(event) => {
                        setMicrophone(event.target.value);
                        setMicStatus("Not checked");
                      }}
                      className="h-12 min-w-0 border sm:flex-1 border-line bg-white px-3 focus-visible:border-ink focus-visible:outline-none disabled:bg-raised disabled:text-muted"
                    >
                      {microphones.length === 0 && <option value="">Check to list microphones</option>}
                      {microphones.map((device, index) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Microphone ${index + 1}`}
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
                      {checking ? "Checking..." : "Check microphone"}
                    </button>
                  </div>
                  <output className="mt-3 block text-[15px] text-muted">
                    <StatusLine tone={micTone(micStatus)}>{micStatus}</StatusLine>
                  </output>
                </div>
              </div>
            </Section>
          </div>

          <aside className="lg:sticky lg:top-8 lg:col-span-4 lg:self-start">
            <div className="bg-ink p-6 text-white">
              <h2 className="text-[28px] leading-tight font-bold tracking-tight">Your session</h2>
              <dl className="mt-5 text-[15px]">
                {[
                  ["Scenario", "Job interview"],
                  ["Language", languages.find((option) => option.value === language)?.label ?? language],
                  ["Context", context.trim() ? `${context.trim().length} characters` : "None yet"],
                  ["Microphone", microphoneSummary],
                ].map(([term, value]) => (
                  <div key={term} className="flex justify-between gap-6 border-t border-ink-line py-2.5">
                    <dt className="text-ink-muted">{term}</dt>
                    <dd className="truncate text-right">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6 border-t border-ink-line pt-5">
                <p className="font-semibold">You are talking to an AI.</p>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
                  Your interviewer is an artificial intelligence, not a real person, and its voice is
                  synthetic. Feedback after the session is also generated by AI and may contain
                  mistakes.
                </p>
              </div>
            </div>

            <div className="border border-t-0 border-line bg-white p-6">
              <button
                type="button"
                disabled={connecting}
                onClick={() => (active ? stopConversation() : startConversation())}
                className={`flex h-14 w-full items-center justify-between px-5 text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-wait disabled:bg-raised disabled:text-muted ${
                  active ? "border border-ink text-ink hover:bg-ink hover:text-white" : "bg-cobalt text-white hover:bg-cobalt/90"
                }`}
              >
                {connecting ? "Connecting..." : active ? "Leave the room" : "Enter the room"}
                {!active && <ArrowRightIcon className="size-5" />}
              </button>
              <output className="mt-3 block text-[14px] text-muted">
                <StatusLine tone={error ? "bad" : active ? "good" : "neutral"}>{status}</StatusLine>
              </output>
              {error && (
                <p role="alert" className="mt-2 text-[14px] text-ink">
                  {error}
                </p>
              )}
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
