# Voice architecture: audit and incremental plan

This document describes the current implementation, not a completed migration.
Only Gemini Live is supported today; configuring a cascaded pipeline is not yet
possible. The voice-engine protocol is an internal composition boundary, not a
claim that other engines already work.

## Existing path

```text
Browser microphone and WebRTC data channel
  -> FastAPI session and signaling routes
  -> VoiceRuntime (lifecycle, transcript persistence, playback confirmation)
  -> configured VoiceEngine
  -> GeminiConversation / Pipecat / Gemini Live

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
* `infrastructure/voice/gemini.py` builds the Pipecat realtime pipeline and
  interprets function calls. `application/interviews.py` supplies timing and
  closing-confirmation rules. Scenarios and their instructions are shared in
  `application/scenarios.py` and `infrastructure/scenarios.py`.
* `application/session_feedback.py` requests feedback separately from voice,
  filters notes against actual user transcript quotations, and saves results.
  Feedback uses Gemini by default, or can be configured independently to use
  OpenRouter. Its output is schema-validated and quotations are checked against
  the transcript regardless of provider.

## Confirmed constraints and remaining work

1. `GeminiConversation` mixes Pipecat setup, Gemini-specific input pausing,
   application closing policies, transcript callbacks and worker lifecycle.
   Another voice engine cannot safely reuse this behavior simply by swapping an
   LLM. Extract shared orchestration only after preserving the tested closing
   and interruption behavior.
2. Native realtime supplies its own turn detection. A cascaded pipeline needs
   an explicit, compatible STT/turn detection/LLM/TTS setup. In particular,
   streaming, interruption, completed transcripts and final audio ordering
   must be verified against the installed Pipecat API rather than assumed.
3. The runtime expects a final WAV clip and an explicit client playback
   acknowledgment before completing the session. A new pipeline must preserve
   this contract, including failures and cancellation.
4. Session state and active connections are coordinated in one backend process.
   The repository already documents that this is not distributed coordination.
   This refactoring does not make multiple worker processes safe.
5. Configuration currently supports only `realtime` and `gemini`. Unsupported
   values fail validation; no fallback is performed. Missing Google credentials
   leave the API available but prevent voice offers, as before.
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

1. Extract the existing completion policy and shared Pipecat lifecycle without
   changing closing, transcript or cancellation semantics; characterize those
   semantics with provider-independent tests.
2. Compose a real streaming cascaded pipeline using APIs from the pinned
   Pipecat version. Validate active provider credentials and capabilities,
   keep inactive providers uninitialized, and test its actual frame ordering.
3. Verify the same lifecycle, transcript and closing contract for each engine.
   Only then expose cascaded configuration as supported.
4. Evaluate Flows against both engines with concrete integration tests and
   retain a single authoritative conversation state.
5. Verify the frontend checks, browser audio and provider-backed smoke tests,
   and document precise prerequisites and any remaining limitations.

## Current configuration and checks

The defaults are `VOICEBOT_VOICE_ARCHITECTURE=realtime` and
`VOICEBOT_REALTIME_PROVIDER=gemini`. Set `VOICEBOT_GOOGLE_API_KEY` for voice.
The existing `VOICEBOT_GEMINI_MODEL`, `VOICEBOT_GEMINI_VOICE` and
`VOICEBOT_FEEDBACK_MODEL` settings remain in effect. See the root README for
setup and commands. Do not add actual credentials to version control.

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
