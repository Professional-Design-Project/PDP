import { consentKeys, requiredConsents, type ConsentChoices, type ConsentKey } from "@/lib/consent";

const labels: Record<ConsentKey, string> = {
  voice:
    "I agree to my voice being recorded during practice sessions and converted to text (transcribed).",
  transcripts:
    "I agree to the storage of transcripts of my sessions and session logs (for example date, length and scores), so I can come back to my feedback.",
  improvement:
    "I agree to my session data (recordings, transcripts and logs) being used to analyse, develop and improve ensaio, including training and testing AI features.",
  outside_eu:
    "I understand and agree that my data may be sent to service providers whose servers are outside the European Union, for example in the USA, where data protection rules may differ from those in the EU.",
};

type ConsentPanelProps = {
  choices: ConsentChoices;
  disabled: boolean;
  onChange: (key: ConsentKey, value: boolean) => void;
};

export function ConsentPanel({ choices, disabled, onChange }: ConsentPanelProps) {
  return (
    <fieldset disabled={disabled}>
      <legend className="font-semibold">Consent</legend>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">
        To run practice sessions we need to process your data. Please choose what you agree to.
      </p>
      <ul className="mt-4 space-y-3">
        {consentKeys.map((key) => {
          const required = requiredConsents.includes(key);
          return (
            <li key={key}>
              <label className="group flex gap-3 text-[14px] leading-snug">
                <span className="relative mt-0.5 grid size-5 shrink-0 place-items-center">
                  <input
                    type="checkbox"
                    checked={choices[key]}
                    onChange={(event) => onChange(key, event.target.checked)}
                    className="peer size-5 appearance-none border border-ink bg-white transition-colors duration-200 checked:border-cobalt checked:bg-cobalt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt disabled:opacity-60"
                  />
                  <svg
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                    className="pointer-events-none absolute size-3.5 scale-50 text-white opacity-0 transition duration-200 ease-(--ease-soft) peer-checked:scale-100 peer-checked:opacity-100"
                  >
                    <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.2" />
                  </svg>
                </span>
                <span>
                  {labels[key]}{" "}
                  <span className="text-muted">{required ? "(required)" : "(optional)"}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-[13px] leading-relaxed text-muted">
        You can change these choices at any time on this page. Changing them does not affect
        sessions you have already had.
      </p>
    </fieldset>
  );
}
