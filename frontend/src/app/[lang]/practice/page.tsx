"use client";

import { useState } from "react";
import { DocumentsField } from "@/components/documents-field";
import { ContextField } from "@/components/practice/context-field";
import { LanguagePicker } from "@/components/practice/language-picker";
import { MicrophoneField } from "@/components/practice/microphone-field";
import { PresetNotice } from "@/components/practice/preset-notice";
import { ScenarioPicker } from "@/components/practice/scenario-picker";
import { StyleField } from "@/components/practice/style-field";
import { SessionAside } from "@/components/practice/session-aside";
import { Rise } from "@/components/rise";
import { Section } from "@/components/section";
import { LiveSession } from "@/components/session/live-session";
import { SessionSummary } from "@/components/session/session-summary";
import { useDocuments } from "@/hooks/use-documents";
import { useFeedback } from "@/hooks/use-feedback";
import { useMicrophone } from "@/hooks/use-microphone";
import { usePracticeConsent } from "@/hooks/use-practice-consent";
import { usePracticePreset } from "@/hooks/use-practice-preset";
import { useVoiceSession } from "@/hooks/use-voice-session";
import { useLocale, type Locale } from "@/i18n/locale";
import { CONSENT_VERSION } from "@/lib/consent";
import { languageName } from "@/lib/languages";
import { defaultStyle, type InterviewStyle } from "@/lib/interview-style";
import type { ScenarioId } from "@/lib/scenarios";

export default function PracticePage() {
  const { locale, t } = useLocale();
  const [scenario, setScenario] = useState<ScenarioId>("job-interview");
  const [chosenLanguage, setLanguage] = useState<Locale | null>(null);
  const [context, setContext] = useState("");
  const [style, setStyle] = useState<InterviewStyle>(defaultStyle);
  const language = chosenLanguage ?? locale;
  const copy = t.scenarios[scenario];
  const mic = useMicrophone();
  const docs = useDocuments(scenario);
  const consent = usePracticeConsent();
  const feedback = useFeedback();
  const voice = useVoiceSession({ onFinished: feedback.choose });
  const presetState = usePracticePreset((preset) => {
    chooseScenario(preset.scenarioId);
    setLanguage(preset.language);
    setContext(preset.context);
    setStyle(preset.style);
  });
  const locked = voice.phase !== "setup" || voice.connecting;

  function chooseScenario(id: ScenarioId) {
    setScenario(id);
    docs.adaptTo(id);
  }

  function enter() {
    feedback.reset();
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
      <SessionSummary
        duration={voice.summary.duration}
        transcript={voice.summary.transcript}
        message={t.summary.ended[voice.summary.end]}
        heading={copy.finished}
        feedback={feedback.feedback}
        onRequestFeedback={() => void feedback.request(voice.lastSession())}
        onAgain={enter}
        onSetup={voice.backToSetup}
      />
    );
  }

  const microphoneSummary = mic.selected
    ? mic.selected.label || t.setup.selectedMicrophone
    : mic.status === "available"
      ? t.setup.defaultMicrophone
      : t.setup.mic.unchecked;

  const rows: [string, string][] = [
    [t.setup.scenario, copy.title],
    [t.setup.language, languageName(language)],
    [
      t.setup.context,
      context.trim() ? t.setup.contextSummary(context.trim().length) : t.setup.noContext,
    ],
    [
      t.setup.documentsRow,
      docs.ready.length ? t.documents.summary(docs.ready.length) : t.setup.noContext,
    ],
    [t.setup.style.pressure.title, t.setup.style.summary(style.pressure)],
    [t.setup.microphone, microphoneSummary],
  ];

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
          onToggleMute={voice.toggleMute}
          onLeave={(withFeedback) => void voice.leave(withFeedback)}
        />
      )}
    </main>
  );
}
