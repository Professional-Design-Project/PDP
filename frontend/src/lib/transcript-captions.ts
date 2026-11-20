import type { TranscriptLine } from "@/components/session/session-state";

type Speakers = { user: string; assistant: string };

function timestamp(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${[hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":")}.000`;
}

function escape(text: string) {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function transcriptCaptions(transcript: TranscriptLine[], speakers: Speakers) {
  const cues = transcript.map((line, index) => {
    const start = index === 0 ? 0 : transcript[index - 1].at;
    const end = Math.max(line.at, start + 1);
    const text = escape(line.text.replaceAll(/\s*\n+\s*/g, " "));
    return `${timestamp(start)} --> ${timestamp(end)}\n${speakers[line.role]}: ${text}`;
  });
  return ["WEBVTT", ...cues].join("\n\n") + "\n";
}

export function captionsDataUrl(transcript: TranscriptLine[], speakers: Speakers) {
  return `data:text/vtt;charset=utf-8,${encodeURIComponent(transcriptCaptions(transcript, speakers))}`;
}
