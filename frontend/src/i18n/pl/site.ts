import type { SiteDictionary } from "../en";

export const sitePl: SiteDictionary = {
  locale: { label: "Język interfejsu", short: "PL", name: "Polski" },
  header: { home: "Strona główna ensaio", practice: "Ćwicz", menu: "Menu" },
  footer: {
    tagline: "Przećwicz rozmowę, zanim się wydarzy.",
    aiTitle: "Jak działa AI",
    aiText:
      "Twój rozmówca to sztuczna inteligencja, a nie człowiek, a jego głos jest syntetyczny. Pracuje tylko na scenariuszu i kontekście, które mu podasz. Informacja zwrotna jest generowana przez AI i może zawierać błędy. To trening, a nie ocena.",
    dataTitle: "Twoje dane",
    dataText:
      "Twój głos trafia do zewnętrznego dostawcy AI, który prowadzi rozmowę. Najlepiej sprawdzają się słuchawki i cichy pokój.",
    top: "Na górę",
    privacy: "Prywatność i AI",
    dataMore: "Jak traktujemy twoje dane",
    aiMore: "Więcej o AI",
    sitemap: "Mapa strony",
  },
  meta: {
    description:
      "Ćwicz na głos rozmowy rekrutacyjne, obrony prac i egzaminy ustne z rozmówcą AI, po polsku lub po angielsku.",
    imageAlt: "ensaio: przećwicz rozmowę, zanim się wydarzy.",
    practice: "Przygotuj pokój",
    history: "Twoje sesje",
    account: "Twoje konto",
    report: "Zgłoś problem",
    admin: "Zgłoszenia",
    login: "Zaloguj się",
    signup: "Załóż konto",
    forgot: "Zresetuj hasło",
    authError: "Link nie zadziałał",
  },
  loading: { label: "Ładowanie", text: "Przygotowujemy wszystko" },
  status: {
    notFoundLabel: "Nie ma takiej strony",
    notFoundTitle: "Ten pokój jest pusty.",
    notFoundText:
      "Strona, której szukasz, nie istnieje albo została przeniesiona. Zacznij od strony głównej albo przygotuj nową sesję.",
    home: "Strona główna",
    errorLabel: "Coś się zepsuło",
    errorTitle: "Coś poszło nie tak.",
    errorText:
      "To błąd po naszej stronie, nie po twojej. Spróbuj ponownie za chwilę. Jeśli to się powtarza, zacznij od strony głównej.",
    retry: "Spróbuj ponownie",
  },
  common: {
    speaking: "Mówi",
    listening: "Słucha",
    setTheRoom: "Przygotuj pokój",
    whyThisQuestion: "Dlaczego to pytanie:",
    interviewer: "Rozmówca",
    you: "Ty",
    quote: (text: string) => `„${text}”`,
  },
};
