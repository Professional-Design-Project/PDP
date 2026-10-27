"use client";

import { useState } from "react";

export default function Home() {
  const [active, setActive] = useState(false);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [microphone, setMicrophone] = useState("");
  const [micStatus, setMicStatus] = useState("Not checked");
  const [checking, setChecking] = useState(false);

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
    } catch (error) {
      setMicStatus(
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "Microphone permission denied"
          : "Microphone unavailable",
      );
    } finally {
      stream?.getTracks().forEach((track) => track.stop());
      setChecking(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <h1 className="text-2xl font-bold">Voice practice</h1>
      <p>UI preview only. Voice is not connected.</p>

      <div className="space-y-2">
        <label htmlFor="scenario" className="block">
          Scenario
        </label>
        <select id="scenario" disabled={active} className="border px-2 py-1 disabled:opacity-50">
          <option>Salary negotiation</option>
        </select>
        <p>Discuss a raise with your manager.</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="microphone" className="block">
          Microphone
        </label>
        <select
          id="microphone"
          value={microphone}
          disabled={checking || microphones.length === 0}
          onChange={(event) => {
            setMicrophone(event.target.value);
            setMicStatus("Not checked");
          }}
          className="border px-2 py-1 disabled:opacity-50"
        >
          {microphones.length === 0 && <option value="">No microphones listed</option>}
          {microphones.map((device, index) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Microphone ${index + 1}`}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={checking}
          onClick={checkMicrophone}
          className="block border px-3 py-1 disabled:opacity-50 focus-visible:outline-2"
        >
          {checking ? "Checking..." : "Check microphone"}
        </button>
        <output className="block">{micStatus}</output>
      </div>

      <output className="block">Preview: {active ? "started" : "stopped"}</output>
      <button
        type="button"
        className="border px-3 py-1 focus-visible:outline-2"
        onClick={() => setActive(!active)}
      >
        {active ? "Stop preview" : "Start preview"}
      </button>

      <section aria-labelledby="transcript">
        <h2 id="transcript" className="text-xl font-bold">
          Transcript
        </h2>
        <p>Transcript is not available in this preview.</p>
      </section>
    </main>
  );
}
