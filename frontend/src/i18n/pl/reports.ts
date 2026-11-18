import type { ReportsDictionary } from "../en";

export const reportsPl: ReportsDictionary = {
  report: {
    nav: "Zgłoś problem lub pomysł",
    title: "Powiedz nam, co poprawić.",
    intro:
      "Coś nie działa, czegoś brakuje albo masz pomysł? Napisz tutaj. Zespół czyta każde zgłoszenie.",
    kindLabel: "Czego dotyczy?",
    kinds: { bug: "Coś nie działa", idea: "Pomysł", other: "Coś innego" },
    messageLabel: "Twoja wiadomość",
    messageHint: (left: number) => `Zostało ${left} znaków`,
    privacy:
      "Zapisujemy wiadomość razem z Twoim adresem e-mail, żeby móc się odezwać. Nie wklejaj haseł ani innych prywatnych danych. Swoje zgłoszenia znajdziesz w eksporcie danych, a usunięcie konta usuwa też je.",
    send: "Wyślij zgłoszenie",
    sending: "Wysyłanie…",
    sent: "Dzięki, zgłoszenie zostało wysłane.",
    another: "Wyślij kolejne",
    failed: "Nie udało się wysłać zgłoszenia. Możesz wysłać do 10 zgłoszeń na godzinę.",
  },
  admin: {
    nav: "Panel zgłoszeń",
    title: "Zgłoszenia.",
    intro: "Wszystko, co użytkownicy wysłali przez formularz zgłoszeń, od najnowszych.",
    loading: "Wczytywanie zgłoszeń",
    failed: "Nie udało się wczytać zgłoszeń.",
    denied: "Ta strona jest tylko dla adminów.",
    empty: "Na razie nic tu nie ma.",
    filter: "Pokaż",
    all: "Wszystkie",
    statuses: { new: "Nowe", in_progress: "W toku", done: "Zrobione" },
    statusLabel: "Status",
    from: "Od",
    unknownAuthor: "nieznany",
    delete: "Usuń",
    confirmDelete: "Tak, usuń",
    cancel: "Anuluj",
    actionFailed: "Nie udało się. Odśwież stronę i spróbuj ponownie.",
  },
};
