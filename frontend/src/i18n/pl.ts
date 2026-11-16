import type { Dictionary } from "./en";

export const pl: Dictionary = {
  locale: { label: "Język interfejsu", short: "PL", name: "Polski" },
  header: { home: "Strona główna ensaio", practice: "Ćwicz" },
  footer: {
    tagline: "Przećwicz rozmowę, zanim się wydarzy.",
    aiTitle: "Jak działa AI",
    aiText:
      "Twój rozmówca to sztuczna inteligencja, a nie człowiek, a jego głos jest syntetyczny. Pracuje tylko na scenariuszu i kontekście, które mu podasz. Informacja zwrotna jest generowana przez AI i może zawierać błędy. To trening, a nie ocena.",
    dataTitle: "Twoje dane",
    dataText:
      "Twój głos trafia do zewnętrznego dostawcy AI, który prowadzi rozmowę. Najlepiej sprawdzają się słuchawki i cichy pokój.",
    top: "Na górę",
  },
  loading: { label: "Ładowanie", text: "Przygotowujemy wszystko" },
  common: {
    speaking: "Mówi",
    listening: "Słucha",
    setTheRoom: "Przygotuj pokój",
    whyThisQuestion: "Dlaczego to pytanie:",
    interviewer: "Rozmówca",
    you: "Ty",
    quote: (text: string) => `„${text}”`,
  },
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
  setup: {
    title: "Przygotuj pokój.",
    intro:
      "Wybierz scenariusz, opisz sytuację, którą chcesz przećwiczyć, i sprawdź mikrofon. Rozmówca pracuje tylko na tym, co mu dasz.",
    scenario: "Scenariusz",
    context: "Kontekst",
    contextIntro: "Opisz rozmówcy stanowisko, firmę albo sytuację. Czyta tylko to, co jest tutaj.",
    contextLabel: "Dodatkowy kontekst",
    conversationLanguage: "Język rozmowy",
    microphone: "Mikrofon",
    listMicrophones: "Sprawdź, aby zobaczyć mikrofony",
    microphoneNumber: (number: number) => `Mikrofon ${number}`,
    checkMicrophone: "Sprawdź mikrofon",
    checking: "Sprawdzam...",
    mic: {
      unchecked: "Nie sprawdzono",
      checking: "Sprawdzam...",
      available: "Mikrofon dostępny",
      none: "Nie znaleziono mikrofonu",
      denied: "Brak zgody na mikrofon",
      unavailable: "Mikrofon niedostępny",
      insecure: "Dostęp do mikrofonu wymaga HTTPS albo localhost.",
    },
    yourSession: "Twoja sesja",
    language: "Język",
    contextSummary: (count: number) => `${count} znaków`,
    noContext: "Jeszcze brak",
    selectedMicrophone: "Wybrany",
    defaultMicrophone: "Domyślny",
    aiNoticeTitle: "Rozmawiasz ze sztuczną inteligencją.",
    aiNoticeText:
      "Twój rozmówca to sztuczna inteligencja, a nie prawdziwa osoba, a jego głos jest syntetyczny. Informacja zwrotna po sesji również jest generowana przez AI i może zawierać błędy.",
    enter: "Wejdź do pokoju",
    connecting: "Łączę",
    tickRequired: "Zaznacz trzy wymagane zgody, aby wejść.",
    status: {
      ready: "Gotowe",
      requesting: "Proszę o dostęp do mikrofonu...",
      connecting: "Łączę...",
      connected: "Połączono",
      failed: "Brak połączenia",
    },
    startFailed: (detail: string) => `Nie udało się rozpocząć rozmowy. ${detail}`,
  },
  consent: {
    title: "Zgody",
    intro:
      "Aby prowadzić sesje treningowe, musimy przetwarzać Twoje dane. Wybierz, na co się zgadzasz.",
    required: "(wymagane)",
    optional: "(opcjonalne)",
    outro:
      "Swoje wybory możesz zmienić w dowolnym momencie na tej stronie. Zmiana nie wpływa na sesje, które już się odbyły.",
    labels: {
      voice:
        "Wyrażam zgodę na nagrywanie mojego głosu podczas sesji treningowych i zamianę go na tekst (transkrypcję).",
      transcripts:
        "Wyrażam zgodę na zapisywanie transkrypcji moich sesji i logów sesji (np. daty, czasu trwania i wyników), abym mógł(a) wracać do informacji zwrotnej.",
      improvement:
        "Wyrażam zgodę na wykorzystanie moich danych z sesji (nagrań, transkrypcji i logów) do analizy, rozwoju i ulepszania ensaio, w tym do trenowania i testowania funkcji AI.",
      outside_eu:
        "Rozumiem i zgadzam się, że moje dane mogą być przesyłane do dostawców usług, których serwery znajdują się poza Unią Europejską, np. w USA, gdzie zasady ochrony danych mogą różnić się od obowiązujących w UE.",
    },
  },
  live: {
    elapsed: " z 15 minut",
    live: "Na żywo",
    connecting: "Łączę",
    joining: "Dołącza do pokoju",
    notHuman: "Rozmówca AI, nie człowiek",
    listeningToYou: "Słucham…",
    aboutToStart: "Rozmówca zaraz zacznie.",
    settingRoom: "Przygotowuję pokój",
    hintMuted: "Twój mikrofon jest wyciszony. Włącz go, żeby odpowiedzieć.",
    hintWait: "Weź oddech. Odpowiedz, gdy pytanie się skończy.",
    hintReady: "Mów, kiedy zechcesz. Rozmówca poczeka.",
    lastQuestion: "Ostatnie pytanie",
    controls: "Sterowanie sesją",
    mute: "Wycisz mikrofon",
    unmute: "Włącz mikrofon",
    showTranscript: "Pokaż transkrypcję",
    hideTranscript: "Ukryj transkrypcję",
    end: "Zakończ sesję",
    ending: "Kończę sesję…",
    provider: "W trakcie sesji twój głos trafia do zewnętrznego dostawcy AI.",
    transcript: "Transkrypcja",
    closeTranscript: "Zamknij transkrypcję",
    emptyTranscript: "Wypowiedzi pojawią się tutaj, gdy tylko każda tura się skończy.",
    interrupted: " · przerwane",
    panelNotice: "Twój rozmówca to AI, a nie człowiek. Jego głos jest syntetyczny.",
  },
  leave: {
    title: "Wyjść z pokoju?",
    text: "Rozmówca może przeczytać twoją transkrypcję i zostawić kilka uwag o tym, co poszło dobrze, a nad czym popracować. Pisze je AI wyłącznie na podstawie słów, więc mogą zawierać błędy.",
    withFeedback: "Wyjdź i odbierz uwagi",
    withoutFeedback: "Wyjdź bez uwag",
    stay: "Rozmawiaj dalej",
  },
  summary: {
    practice:
      "To był trening, a nie ocena. Przeczytaj go jeszcze raz i spróbuj ponownie, póki masz go w głowie.",
    minutes: "minut",
    questions: (count: number) => (count === 1 ? "zadane pytanie" : "zadanych pytań"),
    answers: (count: number) => (count === 1 ? "twoja odpowiedź" : "twoich odpowiedzi"),
    again: "Spróbuj jeszcze raz",
    setup: "Zmień ustawienia",
    transcript: "Transkrypcja",
    empty: "W tej sesji nic nie padło, więc nie ma czego czytać.",
    ended: {
      timeout: "Czas minął. Sesja trwa najwyżej 15 minut.",
      user: "Sesja została zakończona.",
      dropped: "Połączenie zostało przerwane, więc sesja skończyła się wcześniej.",
      other: "Sesja się zakończyła.",
    },
  },
  feedback: {
    title: "Uwagi",
    notice:
      "Napisane przez AI wyłącznie na podstawie słów z twojej transkrypcji, a nie twojego głosu. Mogą zawierać błędy i nie są oceną.",
    declined: "Uwagi zostały pominięte. Chcesz je jednak dostać? To zajmie chwilę.",
    offer: "Chcesz kilka uwag o tym, co poszło dobrze, a nad czym popracować?",
    get: "Odbierz uwagi",
    reading: "Czytam twoją transkrypcję",
    unavailable:
      "Było za mało twoich odpowiedzi, żeby napisać uwagi. Spróbuj dłuższej sesji i odpowiedz na kilka pytań.",
    failed: "Tym razem nie udało się napisać uwag.",
    retry: "Spróbuj ponownie",
    keep: "Tak trzymaj",
    work: "Nad tym popracuj",
    at: (time: string) => `W transkrypcji: ${time}`,
  },
};
