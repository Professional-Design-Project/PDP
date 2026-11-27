# Voice architecture: audit and incremental plan

This document describes the current implementation and its remaining validation.
Gemini Live and a cascaded ElevenLabs/OpenRouter pipeline are implemented. The
cascaded integration has not yet been tested with actual provider credentials,
a browser microphone, or production network conditions.

## Existing path

```text
Browser microphone and WebRTC data channel
  -> FastAPI session and signaling routes
  -> VoiceRuntime (lifecycle, transcript persistence, playback confirmation)
  -> configured VoiceEngine
  -> shared Pipecat conversation
      -> Gemini Live, or
      -> ElevenLabs streaming STT -> OpenRouter LLM -> ElevenLabs streaming TTS

Sessions -> repository (SQLite or Postgres)
         -> independently configured feedback writer -> persisted feedback
```

* `frontend/src/hooks/use-voice-session.ts` owns the browser peer, audio,
  connection cleanup, closing playback, and transcript recovery. It speaks
  WebRTC and application messages, not the Gemini API.
* `backend/src/voicebot/api/sessions.py` authorizes session-token requests and
  delegates signaling and completion to the runtime. `application/sessions.py`
  owns lifecycle transitions, finalized transcript events and feedback task
  coordination.
* `infrastructure/voice/runtime.py` owns the active peer, watchdog, signaling,
  storage callbacks, confirmed closing playback and cleanup. It calls the
  selected engine's conversation instead of constructing a provider.
* `infrastructure/voice/conversation.py` owns the shared Pipecat lifecycle,
  transcript callbacks and tool handling. `gemini.py` and `cascaded.py`
  compose provider-specific services. `application/interviews.py` supplies timing and
  closing-confirmation rules. Scenarios and their instructions are shared in
  `application/scenarios.py` and `infrastructure/scenarios.py`.
* `application/session_feedback.py` requests feedback separately from voice,
  filters notes against actual user transcript quotations, and saves results.
  Feedback uses Gemini by default, or can be configured independently to use
  OpenRouter. Its output is schema-validated and quotations are checked against
  the transcript regardless of provider.

## Confirmed constraints and remaining work

1. The shared conversation lifecycle is reused by both engines. Gemini handles
   its native audio input; the cascaded engine uses Pipecat Silero VAD, streaming
   ElevenLabs STT and TTS, and OpenRouter for text generation. Real streaming,
   interruption, completed transcripts and final audio ordering still require
   provider-backed browser verification.
2. Only the listed providers are integrated. Changing to a different STT, LLM
   or TTS provider requires implementing and testing its adapter; configuration
   does not yet offer an alternative for each individual stage.
3. The runtime expects a final WAV clip and an explicit client playback
   acknowledgment before completing the session. A new pipeline must preserve
   this contract, including failures and cancellation.
4. Session state and active connections are coordinated in one backend process.
   The repository already documents that this is not distributed coordination.
   This refactoring does not make multiple worker processes safe.
5. Unsupported architecture/provider values fail validation without fallback.
   Missing credentials leave the API available but prevent voice offers.
6. Live provider calls, real microphone behavior and actual provider costs are
   not verified by the local automated tests. Postgres tests require the
   separately configured disposable server.

## Pipecat Flows

Pipecat 1.14.0 includes `pipecat.flows`; the separate `pipecat-ai-flows`
package is deprecated according to its upstream README. The installed
`FlowManager` accepts an `LLMService`, a context aggregator and a pipeline
worker and owns flow state and transitions. That generic signature does not
prove that Gemini Live tool calls and context updates work correctly with this
application's closing protocol. Compatibility with each selected service
requires an integration test. Until then, adding Flows would create a second
source of conversation state without demonstrated benefit.

## Next implementation stages

1. Verify the cascaded engine end-to-end with provider credentials, browser
   microphone, barge-in and recorded frame ordering.
2. Evaluate Flows against both engines with concrete integration tests and
   retain a single authoritative conversation state.
3. Verify the frontend checks, browser audio and provider-backed smoke tests,
   and document precise prerequisites and any remaining limitations.

## Current configuration and checks

The defaults are `VOICEBOT_VOICE_ARCHITECTURE=realtime` and
`VOICEBOT_REALTIME_PROVIDER=gemini`. Set `VOICEBOT_GOOGLE_API_KEY` for voice.
The existing `VOICEBOT_GEMINI_MODEL`, `VOICEBOT_GEMINI_VOICE` and
`VOICEBOT_FEEDBACK_MODEL` settings remain in effect. See the root README for
setup and commands. Do not add actual credentials to version control.

For the cascaded pipeline set `VOICEBOT_VOICE_ARCHITECTURE=cascaded`,
`VOICEBOT_OPENROUTER_API_KEY`, `VOICEBOT_ELEVENLABS_API_KEY` and
`VOICEBOT_ELEVENLABS_VOICE_ID`. Model settings are
`VOICEBOT_OPENROUTER_VOICE_MODEL`, `VOICEBOT_ELEVENLABS_STT_MODEL` and
`VOICEBOT_ELEVENLABS_TTS_MODEL`. Provider selectors currently accept only
`VOICEBOT_STT_PROVIDER=elevenlabs`, `VOICEBOT_LLM_PROVIDER=openrouter` and
`VOICEBOT_TTS_PROVIDER=elevenlabs`. A Google key is not needed for this voice
pipeline, but remains necessary if Gemini feedback is selected.

To use OpenRouter for feedback, set `VOICEBOT_FEEDBACK_PROVIDER=openrouter`,
`VOICEBOT_OPENROUTER_API_KEY`, and optionally
`VOICEBOT_OPENROUTER_FEEDBACK_MODEL`. Choose a model that supports structured
JSON output. This affects feedback only; it does not select an OpenRouter voice
pipeline. OpenRouter and upstream model providers may apply their own data
handling and routing policies; review them before sending real transcripts.
The integration has not yet been tested against a live OpenRouter account.

Baseline on Windows with the locked backend dependencies and Python 3.12:
133 tests passed and 10 were skipped before changes; Ruff check and format
check passed. The skips include tests requiring external database setup.
The baseline emitted a Pipecat `audioop` deprecation warning. Frontend checks
and external voice integration were not run as part of that baseline.
