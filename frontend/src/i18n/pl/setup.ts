import type { ScenarioId } from "@/lib/scenarios";
import type { SetupDictionary } from "../en";

export const setupPl: SetupDictionary = {
  setup: {
    title: "Przygotuj pokój.",
    preset: {
      title: (date: string) => `Ustawienia z Twojej sesji z ${date}`,
      text: "Scenariusz, język, kontekst i zachowanie są już uzupełnione. Dokumentów nie zapisujemy po sesji, więc dodaj je ponownie, jeśli są potrzebne.",
      dismiss: "Ukryj tę informację",
    },
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
};
