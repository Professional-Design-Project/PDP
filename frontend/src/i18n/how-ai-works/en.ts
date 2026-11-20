import type { DocContent } from "@/i18n/doc-types";

export const howAiWorksEn: DocContent = {
  title: "How the AI works.",
  intro:
    "What your interviewer knows, which rules it follows, how the feedback is written and where it can go wrong.",
  updated: "Last updated 17 November 2026",
  contents: "On this page",
  termLabel: "What",
  detailLabel: "Details",
  whereLabel: "Where",
  sections: [
    {
      id: "models",
      title: "Two models, two jobs",
      paragraphs: [
        "ensaio uses two AI models from Google. Neither of them sees the other one at work in real time.",
      ],
      terms: [
        {
          term: "The interviewer",
          text: "Gemini Live listens to you and answers out loud, live, in a synthetic voice. It runs the whole conversation.",
        },
        {
          term: "The feedback",
          text: "Gemini Flash reads the written transcript after the session, and only if you ask for feedback. It never hears your voice.",
        },
      ],
    },
    {
      id: "knows",
      title: "What the interviewer knows",
      paragraphs: [
        "The interviewer works only with what you give it before the session. It does not browse the internet, it does not remember your earlier sessions and it does not know who you are.",
      ],
      terms: [
        {
          term: "Scenario",
          text: "A job interview, a thesis defence or an oral exam. Each one sets the role, the goals and the rules of the interviewer.",
        },
        {
          term: "Your context",
          text: "Up to 2,000 characters about the role, the company, the subject or the people you will meet.",
        },
        {
          term: "Documents",
          text: "The text of up to five files, such as a CV, a job post, a thesis or a review. Each file adds at most its first 20,000 characters.",
        },
        {
          term: "Behaviour",
          text: "Four sliders: what the questions focus on, how precise they are, how hard the interviewer presses and how often it follows up. Each setting becomes one concrete rule for the interviewer.",
        },
        {
          term: "Language",
          text: "Polish or English. The interviewer speaks only the language you picked.",
        },
      ],
    },
    {
      id: "rules",
      title: "The rules it follows",
      paragraphs: [
        "Every scenario tells the interviewer to ask one question at a time, follow up on your answers and stay on one topic before moving on.",
        "It does not give you the right answer straight away when you are unsure. It lets you try first. It must not be rude or condescending, even at the highest pressure, and it stays in its role instead of turning into a coach.",
        "Your context and documents are treated as background information, not as instructions. Text inside them cannot change these rules.",
      ],
    },
    {
      id: "feedback",
      title: "How the feedback is written",
      paragraphs: [
        "The feedback is based only on the words in the transcript. It quotes your own words, points to the line where you said them and gives one practical piece of advice for each note.",
        "You get two or three notes, with at least one strength and at least one thing to work on when the transcript allows it, plus a short summary.",
        "There are no scores, grades or rankings. The feedback does not comment on your voice, accent, pace, emotions, confidence or personality, and it does not try to read them.",
      ],
    },
    {
      id: "limits",
      title: "Where it can go wrong",
      paragraphs: [
        "A session lasts at most 15 minutes. The interviewer can mishear you, misunderstand a question or state something that is not true. The feedback can miss the point or quote the transcript wrongly.",
        "Speech recognition works best with a headset and a quiet room. If the transcript is wrong, the feedback will be too.",
        "Treat everything as practice, not as an assessment. ensaio is not used to judge you for a job, a degree or an exam.",
      ],
    },
    {
      id: "data",
      title: "Your data",
      paragraphs: [
        "Your voice goes live to Google during the session. Transcripts, feedback and any recordings you choose to save are kept in your account until you delete them. Recordings are deleted automatically after 30 days.",
      ],
      link: { href: "/privacy", label: "Read about privacy" },
    },
  ],
};
