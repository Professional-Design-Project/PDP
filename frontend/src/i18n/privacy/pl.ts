import type { DocContent } from "@/i18n/doc-types";

export const privacyPl: DocContent = {
  title: "Prywatność i AI.",
  intro:
    "Czym jest ensaio, co robi z twoim głosem i twoimi słowami oraz co możesz zmienić w dowolnym momencie.",
  status:
    "Wersja robocza. ensaio to projekt studencki w trakcie rozwoju, a ten tekst czeka jeszcze na ocenę prawną.",
  updated: "Ostatnia zmiana: 17 listopada 2026",
  contents: "Na tej stronie",
  termLabel: "Co",
  detailLabel: "Szczegóły",
  whereLabel: "Gdzie",
  sections: [
    {
      id: "ai",
      title: "Rozmawiasz ze sztuczną inteligencją",
      paragraphs: [
        "Twój rozmówca to sztuczna inteligencja, a nie prawdziwa osoba, a jego głos jest syntetyczny. Mówimy o tym przed każdą sesją, a na ekranie sesji cały czas widać oznaczenie.",
        "Informacja zwrotna po sesji również jest generowana przez AI i może zawierać błędy. Powstaje wyłącznie na podstawie słów z transkrypcji. ensaio nie próbuje odczytywać twoich emocji z głosu. To trening, a nie ocena, i nie służy do oceniania cię w rekrutacji, na studiach ani na egzaminie.",
      ],
    },
    {
      id: "data",
      title: "Co zapisujemy",
      paragraphs: ["Gdy masz konto, ensaio zapisuje na nim:"],
      terms: [
        {
          term: "Konto",
          text: "Twój adres e-mail, hasło (przechowywane wyłącznie jako bezpieczny skrót przez usługę logowania) i język interfejsu. Przy logowaniu przez Google albo GitHuba zamiast hasła zapisujemy identyfikator tego konta, jego nazwę i adres avatara.",
        },
        {
          term: "Zgody",
          text: "Które pola zaznaczono, kiedy, w jakim języku i którą wersję tekstu widziano.",
        },
        {
          term: "Ustawienia sesji",
          text: "Scenariusz, język rozmowy i wpisany kontekst.",
        },
        {
          term: "Transkrypcja",
          text: "To, co powiedzieliście ty i rozmówca, w formie tekstu, razem z godziną rozpoczęcia, zakończenia i czasem trwania sesji.",
        },
        {
          term: "Uwagi",
          text: "Informacja zwrotna napisana po sesji, jeśli o nią poproszono.",
        },
      ],
    },
    {
      id: "not-kept",
      title: "Czego nie zapisujemy",
      paragraphs: [
        "ensaio nie zapisuje nagrań twojego głosu. Dźwięk trafia na żywo do dostawcy AI w trakcie sesji i tam jest zamieniany na tekst.",
        "Dodane dokumenty są czytane jeden raz, żeby wyciągnąć z nich tekst. Rozmówca dostaje ten tekst na czas sesji, a ani pliki, ani ich tekst nie są zapisywane.",
      ],
    },
    {
      id: "providers",
      title: "Kto jeszcze przetwarza dane",
      paragraphs: [
        "Część pracy wykonują zewnętrzne usługi. Ich serwery mogą znajdować się poza Unią Europejską, np. w USA, gdzie zasady ochrony danych mogą różnić się od obowiązujących w UE.",
      ],
      terms: [
        {
          term: "Google (Gemini)",
          text: "Prowadzi rozmowę na żywo (twój głos i ustawienia sesji) i pisze uwagi (na podstawie transkrypcji). Google przetwarza te dane na własnych warunkach dla Gemini API.",
          where: "Google LLC, USA. Przetwarzanie może odbywać się w centrach danych poza UE.",
        },
        {
          term: "Supabase",
          text: "Utrzymuje bazę danych i logowanie dla kont, sesji, transkrypcji, uwag i zgód.",
          where: "Supabase Inc., USA. Baza działa w regionie wybranym dla projektu.",
        },
        {
          term: "Google (logowanie)",
          text: "Tylko jeśli logujesz się przez Google. Potwierdza, kim jesteś, i przekazuje nam e-mail, imię i nazwisko oraz zdjęcie profilowe konta. Logowanie nie daje Google dostępu do twoich sesji, transkrypcji ani uwag. Dostęp ensaio cofniesz na stronie myaccount.google.com, w sekcji Bezpieczeństwo, w połączeniach z aplikacjami innych firm.",
          where: "Google LLC, USA.",
        },
        {
          term: "GitHub",
          text: "Tylko jeśli logujesz się przez GitHuba. Potwierdza, kim jesteś, i przekazuje nam e-mail, nazwę i avatar konta. GitHub nie widzi twoich sesji, transkrypcji ani uwag. Dostęp ensaio do konta GitHub cofniesz w ustawieniach GitHuba, w sekcji Applications.",
          where: "GitHub, Inc. (Microsoft), USA.",
        },
      ],
    },
    {
      id: "consents",
      title: "Twoje zgody",
      paragraphs: [
        "Przed pierwszą sesją widzisz cztery osobne, niezaznaczone pola: nagrywanie głosu i transkrypcja, zapisywanie transkrypcji i logów sesji, dostawcy spoza UE oraz ulepszanie produktu.",
        "Pierwsze trzy są potrzebne, żeby przeprowadzić sesję. Ulepszanie produktu jest opcjonalne i ensaio działa bez niego tak samo.",
        "Zgody możesz wycofać w dowolnym momencie na stronie konta. Wstrzymuje to dalsze przetwarzanie i nie wpływa na sesje, które już się odbyły.",
      ],
      link: { href: "/account", label: "Zarządzaj zgodami" },
    },
    {
      id: "retention",
      title: "Jak długo to trzymamy",
      paragraphs: [
        "Sesje zostają na koncie, dopóki nie usuniesz ich pojedynczo w historii albo nie usuniesz konta. Usunięcie konta kasuje od razu konto, wszystkie sesje, transkrypcje, uwagi i rekordy zgód. Nie da się tego cofnąć.",
      ],
    },
    {
      id: "rights",
      title: "Twoje prawa",
      paragraphs: [
        "Wszystko, co zapisano o twoich sesjach, widzisz w historii. Na stronie konta i w historii samodzielnie pobierzesz kopię swoich danych, wycofasz zgody i usuniesz pojedyncze sesje albo całe konto. Masz też prawo poprosić o poprawienie danych oraz złożyć skargę do organu ochrony danych, w Polsce do Prezesa Urzędu Ochrony Danych Osobowych (UODO).",
      ],
      link: { href: "/account", label: "Przejdź do konta" },
    },
    {
      id: "controller",
      title: "Kto prowadzi ensaio",
      paragraphs: [
        "ensaio tworzy zespół studentów w ramach projektu projektowego. Zanim aplikacja zostanie udostępniona publicznie, w tym miejscu pojawi się administrator danych i adres kontaktowy w sprawach prywatności.",
      ],
    },
  ],
};
