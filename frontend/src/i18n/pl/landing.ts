import type { LandingDictionary } from "../en";

export const landingPl: LandingDictionary = {
  landing: {
    title: "Przećwicz rozmowę, zanim się wydarzy.",
    intro:
      "Rozmawiaj na głos z rozmówcą AI, który układa każde pytanie pod rolę, którą opiszesz. Po polsku lub po angielsku, tyle razy, ile potrzebujesz.",
    howItWorks: "Jak to działa",
    contextTitle: "Twój kontekst ustala pytania.",
    contextIntro:
      "Rozmówca czyta tylko to, co napiszesz. Zmień kilka zdań, a dostaniesz inną rozmowę. Oto przykłady, dokąd może pójść.",
    step: (number: number) => `Krok ${number}`,
    steps: [
      {
        title: "Przygotuj pokój",
        text: "Opisz stanowisko, firmę i osobę, z którą się spotkasz, a potem sprawdź mikrofon.",
      },
      {
        title: "Przegadaj to",
        text: "Rozmówca pyta, słucha i dopytuje na głos, na żywo.",
      },
      {
        title: "Spróbuj jeszcze raz",
        text: "Zmień kontekst i zacznij nową sesję, aż odpowiedzi przyjdą same.",
      },
    ],
    readyTitle: "Zaczynamy, kiedy zechcesz.",
    readyText:
      "Twój rozmówca to sztuczna inteligencja, a nie prawdziwa osoba, a jego głos jest syntetyczny. Informacja zwrotna również jest generowana przez AI i może zawierać błędy.",
  },
  room: {
    hear: (role: string) => `Posłuchaj: ${role.toLowerCase()}`,
    turns: [
      {
        role: "Rekruter",
        quote: "Opowiedz o swoim CV w dwie minuty.",
        why: "Tak zaczyna się większość pierwszych rozmów.",
      },
      {
        role: "Kierownik zespołu",
        quote: "Opowiedz o sytuacji, w której trudny termin był zagrożony.",
        why: "Ogłoszenie wymaga odpowiedzialności za dowożenie.",
      },
      {
        role: "Tech lead",
        quote: "Dlaczego ta baza danych, a nie oczywista alternatywa?",
        why: "Twój kontekst wspomina etap z projektowaniem systemu.",
      },
    ],
  },
  demo: {
    tryExample: "Wybierz przykład",
    yourContext: "Twój kontekst",
    questions: "Pytania, do których prowadzi",
    fromContext: "Z twojego kontekstu:",
    examples: [
      {
        label: "Backend developer",
        context:
          "Junior backend developer w fintechu. Drugi etap z tech leadem. Ostatnio pytali o bazy danych i to był mój słaby punkt.",
        questions: [
          {
            text: "Jak zapisać płatności, żeby nic nigdy nie zostało policzone dwa razy?",
            why: "Fintech",
          },
          {
            text: "Opowiedz o zapytaniu, które udało się przyspieszyć.",
            why: "Ostatnio padło pytanie o bazy",
          },
          {
            text: "Co sprawdzić najpierw, gdy API nagle zwolni?",
            why: "Etap z tech leadem",
          },
        ],
      },
      {
        label: "Product designer",
        context:
          "Product designer na poziomie mid w aplikacji podróżniczej. Przegląd portfolio z szefową designu. Zależy im na badaniach.",
        questions: [
          {
            text: "Którą decyzję w tym projekcie zmieniły badania?",
            why: "Zależy im na badaniach",
          },
          { text: "Skąd było wiadomo, że redesign zadziałał?", why: "Przegląd portfolio" },
          {
            text: "Opowiedz o sporze z product managerem i o tym, jak się skończył.",
            why: "Poziom mid",
          },
        ],
      },
      {
        label: "Sprzedawca",
        context:
          "Pierwsza praca, sprzedawca w sklepie z elektroniką. Rozmowa grupowa, a potem krótka rozmowa z kierownikiem sklepu.",
        questions: [
          {
            text: "Klient chce tańszego laptopa niż ten, którego potrzebuje. Co powiesz?",
            why: "Sklep z elektroniką",
          },
          { text: "Dlaczego chcesz pracować w sprzedaży?", why: "Pierwsza praca" },
          {
            text: "Jak ogarnąć kolejkę i telefon w tym samym czasie?",
            why: "Kierownik sklepu",
          },
        ],
      },
    ],
  },
  scenarios: {
    "job-interview": {
      title: "Rozmowa rekrutacyjna",
      description: "Pytania o twoje doświadczenie i stanowisko. Jeden rozmówca.",
      placeholder:
        "Na przykład: junior backend developer w fintechu, drugi etap, ostatnio pytali o projektowanie systemów.",
      finished: "Rozmowa zakończona.",
    },
    "thesis-defence": {
      title: "Obrona pracy",
      description: "Pytania i zastrzeżenia przewodniczącego komisji. Na podstawie twojej pracy.",
      placeholder:
        "Na przykład: praca magisterska o estymacji stanu baterii filtrem Kalmana. Recenzja mówi, że wybór metody jest niewystarczająco uzasadniony.",
      finished: "Obrona zakończona.",
    },
    "oral-exam": {
      title: "Egzamin ustny",
      description: "Pytania z zagadnień twojego przedmiotu. Jeden egzaminator.",
      placeholder:
        "Na przykład: egzamin z systemów operacyjnych na drugim roku. Zagadnienia: procesy i wątki, planowanie, zarządzanie pamięcią, systemy plików.",
      finished: "Egzamin zakończony.",
    },
  },
};
