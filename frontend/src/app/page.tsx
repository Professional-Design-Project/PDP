"use client";

import { useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/v1";

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

export default function Home() {
  const [active, setActive] = useState(false);
  const [language, setLanguage] = useState("pl");
  const [context, setContext] = useState("");
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [microphone, setMicrophone] = useState("");
  const [micStatus, setMicStatus] = useState("Not checked");
  const [status, setStatus] = useState("Ready");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<Session | null>(null);

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
    setStatus("Requesting microphone...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const session = await request<Session>("/sessions", {
        method: "POST",
        body: JSON.stringify({ scenario_id: "job-interview", language, context }),
      });
      const peer = new RTCPeerConnection({ iceServers: session.ice_servers });
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      peer.ontrack = (event) => {
        if (!audioRef.current) return;
        audioRef.current.srcObject = event.streams[0] || new MediaStream([event.track]);
        void audioRef.current.play();
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
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <h1 className="text-2xl font-bold">Voice practice</h1>
      <p>{status}</p>
      {error && <p role="alert">{error}</p>}

      <div className="space-y-2">
        <label htmlFor="language" className="block">Conversation language</label>
        <select id="language" value={language} disabled={active} onChange={(event) => setLanguage(event.target.value)} className="border px-2 py-1 disabled:opacity-50">
          <option value="pl">Polski</option>
          <option value="en">English</option>
        </select>
        <label htmlFor="scenario" className="block">Scenario</label>
        <select id="scenario" disabled={active} className="border px-2 py-1 disabled:opacity-50">
          <option>Job interview</option>
        </select>
        <p>Practice an interview tailored to the role described in your context.</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="context" className="block">Additional context</label>
        <textarea id="context" value={context} maxLength={2000} disabled={active} onChange={(event) => setContext(event.target.value)} placeholder="For example: the role, company, or situation you want to practice." className="min-h-28 w-full border p-2 disabled:opacity-50" />
        <p className="text-sm text-gray-600">{context.length}/2000 characters</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="microphone" className="block">Microphone</label>
        <select id="microphone" value={microphone} disabled={checking || microphones.length === 0} onChange={(event) => { setMicrophone(event.target.value); setMicStatus("Not checked"); }} className="border px-2 py-1 disabled:opacity-50">
          {microphones.length === 0 && <option value="">No microphones listed</option>}
          {microphones.map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Microphone ${index + 1}`}</option>)}
        </select>
        <button type="button" disabled={checking} onClick={checkMicrophone} className="block border px-3 py-1 disabled:opacity-50 focus-visible:outline-2">
          {checking ? "Checking..." : "Check microphone"}
        </button>
        <output className="block">{micStatus}</output>
      </div>

      {/* Live voice audio has no prerecorded caption track. */}
      {/* oxlint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} autoPlay controls className="w-full" />
      <button type="button" className="border px-3 py-1 focus-visible:outline-2" onClick={() => (active ? stopConversation() : startConversation())}>
        {active ? "Stop conversation" : "Start conversation"}
      </button>
    </main>
  );
}
