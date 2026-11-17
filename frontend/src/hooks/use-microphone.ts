"use client";

import { useState } from "react";

export type MicStatus =
  | "unchecked"
  | "checking"
  | "available"
  | "none"
  | "denied"
  | "unavailable"
  | "insecure";

export function micTone(status: MicStatus) {
  if (status === "available") return "good";
  if (status === "unchecked" || status === "checking") return "neutral";
  return "bad";
}

export function audioConstraints(microphone: string): MediaStreamConstraints {
  return { audio: microphone ? { deviceId: { exact: microphone } } : true };
}

export function useMicrophone() {
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [microphone, setMicrophone] = useState("");
  const [status, setStatus] = useState<MicStatus>("unchecked");
  const checking = status === "checking";

  async function check() {
    if (!navigator.mediaDevices?.getUserMedia || !navigator.mediaDevices.enumerateDevices) {
      setStatus("insecure");
      return;
    }
    setStatus("checking");
    let stream: MediaStream | undefined;
    try {
      stream = await navigator.mediaDevices.getUserMedia(audioConstraints(microphone));
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices.filter((device) => device.kind === "audioinput");
      setMicrophones(inputs);
      const usedId = microphone || stream.getAudioTracks()[0]?.getSettings().deviceId;
      setMicrophone(
        inputs.some((device) => device.deviceId === usedId) ? usedId! : inputs[0]?.deviceId || "",
      );
      setStatus(inputs.length ? "available" : "none");
    } catch (caught) {
      setStatus(
        caught instanceof DOMException && caught.name === "NotAllowedError"
          ? "denied"
          : "unavailable",
      );
    } finally {
      stream?.getTracks().forEach((track) => track.stop());
    }
  }

  function choose(deviceId: string) {
    setMicrophone(deviceId);
    setStatus("unchecked");
  }

  const selected = microphones.find((device) => device.deviceId === microphone);

  return { microphones, microphone, selected, status, checking, check, choose };
}
