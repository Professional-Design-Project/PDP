import { arrowMotion, buttonStyles } from "@/components/button-styles";
import { ArrowRightIcon } from "@/components/icons";
import { Rise } from "@/components/rise";
import { FeedbackSection } from "@/components/session/feedback-section";
import {
  formatClock,
  type FeedbackState,
  type TranscriptLine,
} from "@/components/session/session-state";

type SessionSummaryProps = {
  duration: number;
  transcript: TranscriptLine[];
  message: string;
  heading: string;
  feedback: FeedbackState;
  onRequestFeedback: () => void;
  onAgain: () => void;
  onSetup: () => void;
};

export function SessionSummary({
  duration,
  transcript,
  message,
  heading,
  feedback,
  onRequestFeedback,
  onAgain,
  onSetup,
}: SessionSummaryProps) {
  const questions = transcript.filter((line) => line.role === "assistant").length;
  const answers = transcript.filter((line) => line.role === "user").length;
  const numbers = [
    { value: formatClock(duration), label: "minutes" },
    { value: String(questions), label: questions === 1 ? "question asked" : "questions asked" },
    { value: String(answers), label: answers === 1 ? "answer given" : "answers given" },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 pt-12 pb-24 sm:px-8 sm:pt-16">
      <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-8">
        <Rise
          as="h1"
          className="text-[56px] leading-[0.92] font-bold tracking-[-0.04em] sm:text-[96px] lg:col-span-7"
        >
          {heading}
        </Rise>
        <Rise
          as="p"
          delay={100}
          className="max-w-md text-lg leading-relaxed text-ink/80 lg:col-span-5"
        >
          {message} It was practice, not a grade. Read it back, then go again while it is fresh.
        </Rise>
      </div>

      <Rise delay={180} className="mt-12 grid border-t-2 border-ink sm:grid-cols-3">
        {numbers.map((item) => (
          <div key={item.label} className="border-b border-line py-6 sm:pr-8">
            <p className="text-[56px] leading-none font-bold tracking-[-0.05em] tabular-nums sm:text-[72px]">
              {item.value}
            </p>
            <p className="mt-2 text-muted">{item.label}</p>
          </div>
        ))}
      </Rise>

      <Rise delay={260} className="mt-10 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={onAgain} className={`${buttonStyles.ink} sm:w-72`}>
          Go again
          <ArrowRightIcon className={arrowMotion} />
        </button>
        <button type="button" onClick={onSetup} className={buttonStyles.outline}>
          Change the setup
        </button>
      </Rise>

      <FeedbackSection state={feedback} transcript={transcript} onRequest={onRequestFeedback} />

      <section aria-labelledby="transcript-title" className="mt-16 border-t-2 border-ink pt-5">
        <h2 id="transcript-title" className="text-[32px] leading-tight font-bold tracking-tight">
          Transcript
        </h2>
        {transcript.length === 0 ? (
          <p className="mt-4 text-muted">
            Nothing was said in this session, so there is nothing to read back.
          </p>
        ) : (
          <ol className="mt-6 border-t border-line">
            {transcript.map((line) => (
              <li
                key={line.id}
                id={`line-${line.id}`}
                className={`grid scroll-mt-24 grid-cols-[4rem_1fr] gap-4 border-b border-line px-4 py-5 target:outline-2 target:-outline-offset-2 target:outline-cobalt sm:grid-cols-[5rem_9rem_1fr] ${
                  line.role === "user" ? "bg-raised" : "bg-white"
                }`}
              >
                <span className="text-[14px] text-muted tabular-nums">{formatClock(line.at)}</span>
                <span className="text-[15px] font-semibold max-sm:col-start-2">
                  {line.role === "user" ? "You" : "Interviewer"}
                </span>
                <p className="leading-relaxed max-sm:col-start-2">{line.text}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
