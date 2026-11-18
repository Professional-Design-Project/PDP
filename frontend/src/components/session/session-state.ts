export type Speaker = "user" | "assistant";

export type TranscriptLine = {
  id: string;
  role: Speaker;
  text: string;
  at: number;
  interrupted: boolean;
};

export type LiveState = {
  readyAt: number | null;
  botSpeaking: boolean;
  userSpeaking: boolean;
  botCaption: string;
  userCaption: string;
  transcript: TranscriptLine[];
  ended: { reason: string; failed: boolean } | null;
};

export const initialLiveState: LiveState = {
  readyAt: null,
  botSpeaking: false,
  userSpeaking: false,
  botCaption: "",
  userCaption: "",
  transcript: [],
  ended: null,
};

type ChannelMessage = {
  type?: string;
  data?: Record<string, unknown>;
};

export type LiveAction =
  | { type: "message"; message: ChannelMessage; now: number }
  | { type: "reset" };

function text(data: Record<string, unknown> | undefined) {
  return typeof data?.text === "string" ? data.text : "";
}

function secondsSince(readyAt: number | null, now: number) {
  return readyAt === null ? 0 : Math.max(0, Math.round((now - readyAt) / 1000));
}

export function liveReducer(state: LiveState, action: LiveAction): LiveState {
  if (action.type === "reset") return initialLiveState;
  const { message, now } = action;
  const data = message.data;

  switch (message.type) {
    case "server-message": {
      const kind = data?.kind;
      if (kind === "session.ready") return { ...state, readyAt: state.readyAt ?? now };
      if (kind === "session.ended" || kind === "session.failed") {
        return {
          ...state,
          botSpeaking: false,
          userSpeaking: false,
          ended: {
            reason: typeof data?.reason === "string" ? data.reason : "ended",
            failed: kind === "session.failed",
          },
        };
      }
      if (kind === "transcript.final") {
        const role = data?.role === "user" ? "user" : "assistant";
        const line: TranscriptLine = {
          id: String(data?.sequence ?? `${now}-${state.transcript.length}`),
          role,
          text: text(data).trim(),
          at: secondsSince(state.readyAt, now),
          interrupted: data?.interrupted === true,
        };
        if (!line.text || state.transcript.some((item) => item.id === line.id)) return state;
        return {
          ...state,
          transcript: [...state.transcript, line],
          userCaption: role === "user" ? "" : state.userCaption,
        };
      }
      return state;
    }
    case "bot-started-speaking":
      return { ...state, botSpeaking: true, botCaption: "", userCaption: "" };
    case "bot-stopped-speaking":
      return { ...state, botSpeaking: false };
    case "bot-output":
      if (data?.spoken === false || !text(data)) return state;
      return { ...state, botCaption: `${state.botCaption}${text(data)}` };
    case "user-started-speaking":
      return { ...state, userSpeaking: true };
    case "user-stopped-speaking":
      return { ...state, userSpeaking: false };
    case "user-transcription":
    case "stt-raw-text":
      return text(data) ? { ...state, userCaption: text(data) } : state;
    default:
      return state;
  }
}

export function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export type EndKind = "completed" | "timeout" | "user" | "dropped" | "other";

export function endKind(reason: string, failed: boolean): EndKind {
  if (failed) return "dropped";
  if (reason === "scenario_completed") return "completed";
  if (reason === "session_timeout") return "timeout";
  if (reason === "user_ended") return "user";
  return "other";
}

export type FeedbackNote = {
  kind: "strength" | "work_on";
  title: string;
  quote: string;
  advice: string;
  sequence: number | null;
};

export type FeedbackResult = {
  summary: string;
  notes: FeedbackNote[];
};

export type FeedbackState =
  | { status: "undecided" }
  | { status: "declined" }
  | { status: "loading" }
  | { status: "ready"; result: FeedbackResult }
  | { status: "unavailable" }
  | {
      status: "failed";
      reason?:
        | "rate_limited"
        | "provider_unavailable"
        | "not_configured"
        | "invalid_response"
        | "request_rejected"
        | "session_conflict";
    };
