import type { ScenarioId } from "@/lib/scenarios";
import type { Dictionary } from "./en";

export const pl: Dictionary = {
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
    documentsRow: "Dokumenty",
    style: {
      title: "Zachowanie",
      intro:
        "Ustaw, jak dokładny ma być rozmówca i na co ma naciskać. Przy każdym suwaku widać, co zmienia.",
      changes: "Co to zmienia:",
      outOf: (max: number) => `z ${max}`,
      summary: (pressure: number) => `${pressure} z 3`,
      focus: {
        title: "Na czym skupiają się pytania",
        ends: {
          "job-interview": ["Ogólne pytania", "Twoje CV i rola"],
          "thesis-defence": ["Dziedzina studiów", "Twoja praca"],
          "oral-exam": ["Cały przedmiot", "Twoje tematy"],
        } as Record<ScenarioId, readonly [string, string]>,
        explain: (focus: number) =>
          focus === 0
            ? "Tylko ogólne pytania, bez szczegółów z twojego kontekstu i dokumentów."
            : focus === 100
              ? "Każde pytanie opiera się na twoim kontekście i dokumentach."
              : `Około ${focus}% pytań opiera się na twoim kontekście i dokumentach, reszta to pytania ogólne.`,
      },
      precision: {
        title: "Precyzja pytań",
        ends: ["Ogólne", "Szczegółowe"] as readonly [string, string],
        levels: [
          "Szerokie, otwarte pytania. Bez dopytywania o liczby, definicje i drobne szczegóły.",
          "Ogólne pytania przeplatane konkretnymi, np. o przykład albo szczegół.",
          "Precyzyjne pytania o szczegóły, liczby, definicje i uzasadnienie każdej odpowiedzi.",
        ],
      },
      pressure: {
        title: "Nacisk",
        ends: ["Cierpliwy", "Wymagający"] as readonly [string, string],
        levels: [
          "Rozmówca pozwala dokończyć długie odpowiedzi i przyjmuje rozsądne odpowiedzi.",
          "Rozmówca jest rzeczowy i mówi wprost, gdy odpowiedź mija się z pytaniem.",
          "Rozmówca grzecznie przerywa długie odpowiedzi, podważa słabe punkty i prosi o ich obronę.",
        ],
      },
      followUps: {
        title: "Dopytania",
        ends: ["Bez dopytań", "Drąży"] as readonly [string, string],
        explain: (count: number) =>
          count === 0
            ? "Po każdej odpowiedzi rozmówca przechodzi do nowego pytania."
            : `Do ${count} ${count === 1 ? "dopytania" : "dopytań"} o tę samą kwestię, gdy odpowiedź jest niejasna albo niepełna.`,
      },
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
  documents: {
    title: "Dokumenty",
    intro:
      "Dodaj pliki, które rozmówca ma przeczytać, na przykład CV, ogłoszenie, pracę dyplomową albo recenzję.",
    drop: "Upuść pliki tutaj",
    or: "albo",
    add: "Dodaj pliki",
    hint: "PDF, DOCX, PPTX, TXT lub MD. Do 5 plików, każdy do 10 MB. Pliki są czytane jednorazowo i nie są zapisywane.",
    dropping: "Puść, aby dodać pliki",
    file: "Plik",
    usedAs: "Rola",
    size: "Rozmiar",
    actions: "Akcje",
    remove: (name: string) => `Usuń ${name}`,
    reading: "Czytam…",
    truncated: "Używane jest tylko pierwsze 20 000 znaków.",
    limit: "Możesz dodać najwyżej 5 plików.",
    errors: {
      type: "Ten typ pliku nie jest obsługiwany.",
      size: "Ten plik jest większy niż 10 MB.",
      empty: "W tym pliku nie znaleziono tekstu.",
      read: "Nie udało się odczytać tego pliku.",
    },
    summary: (count: number) =>
      count === 1 ? "1 plik" : count < 5 ? `${count} pliki` : `${count} plików`,
    kinds: {
      cv: "CV",
      job_post: "Ogłoszenie",
      cover_letter: "List motywacyjny",
      thesis: "Praca dyplomowa",
      review: "Recenzja",
      slides: "Prezentacja",
      notes: "Notatki",
      topics: "Zagadnienia",
      other: "Inny",
    },
  },
  auth: {
    signIn: "Zaloguj się",
    signUp: "Załóż konto",
    signOut: "Wyloguj się",
    account: "Konto",
    email: "E-mail",
    password: "Hasło",
    newPassword: "Nowe hasło",
    passwordHint: "Co najmniej 8 znaków.",
    forgot: "Nie pamiętasz hasła?",
    noAccount: "Nie masz jeszcze konta?",
    haveAccount: "Masz już konto?",
    loginTitle: "Witaj z powrotem.",
    loginIntro: "Zaloguj się, żeby ćwiczyć i mieć sesje oraz uwagi w jednym miejscu.",
    signupTitle: "Przygotuj własny pokój.",
    signupIntro: "Załóż konto, żeby trzymać transkrypcje, uwagi i zgody razem.",
    checkEmailTitle: "Sprawdź skrzynkę.",
    checkEmailText: (email: string) =>
      `Wysłaliśmy link na adres ${email}. Otwórz go, żeby potwierdzić konto, i wróć tutaj.`,
    forgotTitle: "Zresetuj hasło.",
    forgotIntro:
      "Podaj e-mail, którego użyto przy rejestracji, a wyślemy link do ustawienia nowego hasła.",
    sendLink: "Wyślij link",
    linkSent: (email: string) =>
      `Jeśli istnieje konto dla ${email}, link do zmiany hasła jest już w drodze.`,
    resetTitle: "Ustaw nowe hasło.",
    resetIntro: "Wybierz nowe hasło do swojego konta.",
    savePassword: "Zapisz hasło",
    passwordSaved: "Nowe hasło zostało zapisane.",
    backToLogin: "Wróć do logowania",
    errorTitle: "Ten link nie zadziałał.",
    errorText: "Mógł wygasnąć albo został już użyty. Zaloguj się ponownie lub poproś o nowy link.",
    providers: {
      google: {
        continue: "Kontynuuj z Google",
        failed: "Nie udało się połączyć z Google. Spróbuj ponownie za chwilę.",
        linked: "Połączono z kontem Google",
      },
      github: {
        continue: "Kontynuuj z GitHubem",
        failed: "Nie udało się połączyć z GitHubem. Spróbuj ponownie za chwilę.",
        linked: "Połączono z kontem GitHub",
      },
    },
    or: "albo e-mailem",
    providerErrorTitle: "Logowanie przerwane.",
    providerErrorText:
      "Google albo GitHub nie potwierdził logowania, np. dlatego, że je anulowano. Spróbuj ponownie albo zaloguj się e-mailem.",
    disabledTitle: "Logowanie nie jest jeszcze skonfigurowane.",
    disabledText: "Ta wersja ensaio działa bez kont, więc możesz od razu ćwiczyć.",
    goPractise: "Przejdź do ćwiczeń",
    working: "Chwileczkę…",
    errors: {
      invalid_credentials: "E-mail lub hasło są nieprawidłowe.",
      email_not_confirmed: "Najpierw potwierdź e-mail. Link jest w skrzynce.",
      user_already_exists: "Konto z tym adresem już istnieje. Zaloguj się.",
      weak_password: "Wybierz mocniejsze hasło, co najmniej 8 znaków.",
      over_email_send_rate_limit:
        "Wysłano zbyt wiele wiadomości. Odczekaj kilka minut i spróbuj ponownie.",
      invalid_email: "Podaj prawidłowy adres e-mail.",
      short_password: "Hasło musi mieć co najmniej 8 znaków.",
      generic: "Coś poszło nie tak. Spróbuj ponownie za chwilę.",
    },
  },
  history: {
    nav: "Historia",
    title: "Twoje sesje.",
    intro: "Każda zakończona sesja jest tutaj razem z transkrypcją i uwagami. Widzisz je tylko ty.",
    empty: "Nie ma jeszcze żadnych sesji. Pierwsza pojawi się tutaj, gdy się zakończy.",
    start: "Zacznij sesję",
    loading: "Wczytuję twoje sesje",
    failed: "Nie udało się wczytać sesji. Spróbuj ponownie za chwilę.",
    notFound: "Ta sesja nie istnieje albo należy do kogoś innego.",
    back: "Wszystkie sesje",
    status: {
      ended: "Zakończona",
      failed: "Przerwana",
      active: "W trakcie",
      connecting: "W trakcie",
      created: "Nierozpoczęta",
    },
    duration: (time: string) => `${time} min`,
    deleteTitle: "Usuń tę sesję",
    deleteText: "To usuwa z konta sesję, jej transkrypcję i uwagi. Nie da się tego cofnąć.",
    deleteButton: "Usuń sesję",
    deleteConfirm: "Tak, usuń ją",
    deleteCancel: "Zostaw ją",
    deleting: "Usuwam…",
    deleteFailed: "Nie udało się usunąć sesji. Sesji, która wciąż trwa, nie można usunąć.",
    feedbackMissing: "Dla tej sesji nie poproszono o uwagi.",
  },
  account: {
    title: "Twoje konto.",
    intro: "Logowanie, zgody i twoje dane w jednym miejscu.",
    signedInAs: "Zalogowano jako",
    changePassword: "Zmień hasło",
    consentTitle: "Zgody",
    consentIntro: "To wybory, których dokonano przed ostatnią sesją.",
    consentNone: "Nie udzielono jeszcze żadnych zgód. Pytanie pojawi się przed pierwszą sesją.",
    consentGiven: (date: string) => `Udzielone ${date}`,
    consentWithdrawn: (date: string) =>
      `Wycofane ${date}. Przed kolejną sesją pojawi się ponowne pytanie.`,
    yes: "Tak",
    no: "Nie",
    withdraw: "Wycofaj zgody",
    withdrawing: "Wycofuję…",
    exportTitle: "Pobierz swoje dane",
    exportText:
      "Plik JSON z kontem, zgodami, sesjami razem z wpisanym kontekstem, transkrypcjami i uwagami w takiej postaci, w jakiej są teraz zapisane.",
    exportButton: "Pobierz moje dane",
    exporting: "Przygotowuję…",
    exportFailed: "Nie udało się przygotować pliku. Spróbuj ponownie za chwilę.",
    deleteTitle: "Usuń konto",
    deleteText:
      "To usuwa konto, wszystkie sesje, transkrypcje, uwagi i rekordy zgód. Nie da się tego cofnąć.",
    deleteButton: "Usuń moje konto",
    deleteConfirm: "Tak, usuń wszystko",
    deleteCancel: "Zostaw konto",
    deleting: "Usuwam…",
    deleteFailed: "Nie udało się usunąć konta. Spróbuj ponownie później.",
    failed: "Coś poszło nie tak. Spróbuj ponownie za chwilę.",
  },
  consent: {
    title: "Zgody",
    intro:
      "Aby prowadzić sesje treningowe, musimy przetwarzać Twoje dane. Wybierz, na co się zgadzasz.",
    details: "Jak traktujemy twoje dane",
    providers: "Zobacz dostawców",
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
