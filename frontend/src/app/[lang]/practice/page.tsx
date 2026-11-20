"use client";

import { useState } from "react";
import { DocumentsField } from "@/components/documents-field";
import { ContextField } from "@/components/practice/context-field";
import { LanguagePicker } from "@/components/practice/language-picker";
import { InterviewStagePicker } from "@/components/practice/interview-stage-picker";
import { MicrophoneField } from "@/components/practice/microphone-field";
import { PresetNotice } from "@/components/practice/preset-notice";
import { ScenarioPicker } from "@/components/practice/scenario-picker";
import { StyleField } from "@/components/practice/style-field";
import { SessionAside } from "@/components/practice/session-aside";
import { Rise } from "@/components/rise";
import { Section } from "@/components/section";
import { FinishedPanel } from "@/components/session/finished-panel";
import { LiveSession } from "@/components/session/live-session";
import { SessionSummary } from "@/components/session/session-summary";
import { useDocuments } from "@/hooks/use-documents";
import { useEndDecision } from "@/hooks/use-end-decision";
import { useFeedback } from "@/hooks/use-feedback";
import { useMicrophone } from "@/hooks/use-microphone";
import { usePracticeConsent } from "@/hooks/use-practice-consent";
import { usePracticePreset } from "@/hooks/use-practice-preset";
import { useRecording } from "@/hooks/use-recording";
import { useSignedIn } from "@/hooks/use-signed-in";
import { useVoiceSession } from "@/hooks/use-voice-session";
import { useLocale, type Locale } from "@/i18n/locale";
import { CONSENT_VERSION } from "@/lib/consent";
import { languageName } from "@/lib/languages";
import { setupRows } from "@/lib/setup-rows";
import { defaultStyle, type InterviewStyle } from "@/lib/interview-style";
import { scenarioGroup, type ScenarioId } from "@/lib/scenarios";

export default function PracticePage() {
  const { locale, t } = useLocale();
  const [scenario, setScenario] = useState<ScenarioId>("hr-screening");
  const [chosenLanguage, setLanguage] = useState<Locale | null>(null);
  const [context, setContext] = useState("");
  const [style, setStyle] = useState<InterviewStyle>(defaultStyle);
  const language = chosenLanguage ?? locale;
  const copy = t.scenarios[scenario];
  const group = scenarioGroup(scenario);
  const mic = useMicrophone();
  const docs = useDocuments(scenario);
  const consent = usePracticeConsent();
  const feedback = useFeedback();
  const recording = useRecording();
  const canRecord = useSignedIn();
  const ending = useEndDecision(
    { feedback: feedback.choose, recording: recording.choose },
    canRecord,
  );
  const voice = useVoiceSession({
    onFinished: ending.finished,
    onRecorded: recording.receive,
    record: canRecord,
  });
  const presetState = usePracticePreset((preset) => {
    chooseScenario(preset.scenarioId);
    setLanguage(preset.language);
    setContext(preset.context);
    setStyle(preset.style);
  });
  const locked = voice.phase !== "setup" || voice.connecting;

  function chooseScenario(id: ScenarioId) {
    setScenario(id === "job-interview" ? "hr-screening" : id);
    docs.adaptTo(id);
  }

  function enter() {
    ending.reset();
    feedback.reset();
    recording.reset();
    void voice.start(
      {
        scenario_id: scenario,
        language,
        context,
        consent: { version: CONSENT_VERSION, language: locale, ...consent.choices },
        documents: docs.ready.map(({ name, kind, text }) => ({ name, kind, text })),
        style,
      },
      mic.microphone,
    );
  }

  if (voice.phase === "summary" && voice.summary) {
    return (
      <>
        <SessionSummary
          duration={voice.summary.duration}
          transcript={voice.summary.transcript}
          synchronized={voice.summary.synchronized}
          message={t.summary.ended[voice.summary.end]}
          heading={copy.finished}
          feedback={feedback.feedback}
          onRequestFeedback={() => void feedback.request(voice.lastSession())}
          recording={recording.recording}
          onSaveRecording={() => void recording.save()}
          onRecordingDeleted={recording.deleted}
          onAgain={enter}
          onSetup={voice.backToSetup}
        />
        {ending.undecided && (
          <FinishedPanel
            canRecord={canRecord}
            onChoose={(choice) => ending.decide(choice, voice.lastSession())}
          />
        )}
      </>
    );
  }

  const rows = setupRows(t, {
    scenario,
    language,
    context,
    documents: docs.ready.length,
    style,
    microphone: mic.selected ?? null,
    microphoneAvailable: mic.status === "available",
  });

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

      {presetState.preset && (
        <PresetNotice preset={presetState.preset} onDismiss={presetState.dismiss} />
      )}

      <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:gap-8">
        <Rise delay={100} className="space-y-14 lg:col-span-8">
          <Section number={1} title={t.setup.scenario}>
            <ScenarioPicker value={scenario} disabled={locked} onChange={chooseScenario} />
            {group === "job-interview" && (
              <InterviewStagePicker value={scenario} disabled={locked} onChange={chooseScenario} />
            )}
          </Section>

          <Section number={2} title={t.setup.context} description={t.setup.contextIntro}>
            <div className="space-y-8">
              <ContextField
                value={context}
                placeholder={copy.placeholder}
                disabled={locked}
                onChange={setContext}
                onPasteFiles={docs.add}
              />
              <DocumentsField
                documents={docs.documents}
                kinds={docs.kinds}
                disabled={locked}
                onAdd={docs.add}
                onRemove={docs.remove}
                onKindChange={docs.setKind}
              />
              <LanguagePicker value={language} disabled={locked} onChange={setLanguage} />
              <MicrophoneField mic={mic} disabled={locked} />
            </div>
          </Section>

          <Section number={3} title={t.setup.style.title} description={t.setup.style.intro}>
            <StyleField scenario={scenario} value={style} disabled={locked} onChange={setStyle} />
          </Section>
        </Rise>

        <SessionAside
          rows={rows}
          consent={consent}
          locked={locked}
          connecting={voice.connecting}
          blocked={docs.reading}
          status={voice.status}
          failure={voice.failure}
          onEnter={enter}
        />
      </div>

      {voice.phase === "session" && (
        <LiveSession
          state={voice.live}
          connected={voice.connected}
          language={languageName(language)}
          scenario={copy.title}
          muted={voice.muted}
          ending={voice.ending}
          canRecord={canRecord}
          onToggleMute={voice.toggleMute}
          onLeave={(choice) => {
            recording.choose(choice.recording);
            void voice.leave(choice.feedback);
          }}
        />
      )}
    </main>
  );
}
