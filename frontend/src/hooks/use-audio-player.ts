"use client";

import { useRef, useState, type SyntheticEvent } from "react";

type AudioEvent = SyntheticEvent<HTMLAudioElement>;

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const probingRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  function settle(audio: HTMLAudioElement) {
    if (!Number.isFinite(audio.duration)) return false;
    setDuration(audio.duration);
    if (probingRef.current) {
      probingRef.current = false;
      audio.currentTime = 0;
      setPosition(0);
      return true;
    }
    return false;
  }

  const events = {
    onLoadedMetadata(event: AudioEvent) {
      const audio = event.currentTarget;
      if (settle(audio) || Number.isFinite(audio.duration)) return;
      probingRef.current = true;
      audio.currentTime = Number.MAX_SAFE_INTEGER;
    },
    onDurationChange(event: AudioEvent) {
      settle(event.currentTarget);
    },
    onTimeUpdate(event: AudioEvent) {
      const audio = event.currentTarget;
      if (settle(audio) || probingRef.current) return;
      setPosition(audio.currentTime);
    },
    onPlay: () => setPlaying(true),
    onPause: () => setPlaying(false),
    onEnded: () => setPlaying(false),
  };

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play().catch(() => setPlaying(false));
    else audio.pause();
  }

  function seek(seconds: number) {
    const audio = audioRef.current;
    if (!audio || probingRef.current) return;
    audio.currentTime = seconds;
    setPosition(seconds);
  }

  return { audioRef, events, playing, position, duration, toggle, seek };
}
