import type { DocContent } from "@/i18n/doc-types";

export const howAiWorksPl: DocContent = {
  title: "Jak działa AI.",
  intro: "Co wie rozmówca, jakich zasad się trzyma, jak powstają uwagi i gdzie może się pomylić.",
  updated: "Ostatnia zmiana: 17 listopada 2026",
  contents: "Na tej stronie",
  termLabel: "Co",
  detailLabel: "Szczegóły",
  whereLabel: "Gdzie",
  sections: [
    {
      id: "models",
      title: "Dwa modele, dwa zadania",
      paragraphs: [
        "ensaio korzysta z dwóch modeli AI od Google. Żaden z nich nie widzi na bieżąco pracy drugiego.",
      ],
      terms: [
        {
          term: "Rozmówca",
          text: "Gemini Live słucha cię i odpowiada na głos, na żywo, syntetycznym głosem. Prowadzi całą rozmowę.",
        },
        {
          term: "Uwagi",
          text: "Gemini Flash czyta pisemną transkrypcję po sesji i tylko wtedy, gdy poprosisz o uwagi. Nigdy nie słyszy twojego głosu.",
        },
      ],
    },
    {
      id: "knows",
      title: "Co wie rozmówca",
      paragraphs: [
        "Rozmówca pracuje tylko na tym, co dasz mu przed sesją. Nie przegląda internetu, nie pamięta twoich wcześniejszych sesji i nie wie, kim jesteś.",
      ],
      terms: [
        {
          term: "Scenariusz",
          text: "Rozmowa rekrutacyjna, obrona pracy albo egzamin ustny. Każdy ustala rolę, cele i zasady rozmówcy.",
        },
        {
          term: "Twój kontekst",
          text: "Do 2000 znaków o stanowisku, firmie, przedmiocie albo osobach, z którymi się spotkasz.",
        },
        {
          term: "Dokumenty",
          text: "Tekst z najwyżej pięciu plików, np. CV, ogłoszenia, pracy dyplomowej albo recenzji. Z każdego pliku trafia najwyżej pierwsze 20 000 znaków.",
        },
        {
          term: "Zachowanie",
          text: "Cztery suwaki: na czym skupiają się pytania, jak są precyzyjne, jak mocno rozmówca naciska i ile razy dopytuje. Każde ustawienie zamienia się w jedną konkretną zasadę dla rozmówcy.",
        },
        {
          term: "Język",
          text: "Polski albo angielski. Rozmówca mówi tylko w wybranym języku.",
        },
      ],
    },
    {
      id: "rules",
      title: "Zasady, których się trzyma",
      paragraphs: [
        "Każdy scenariusz każe rozmówcy zadawać jedno pytanie naraz, dopytywać o twoje odpowiedzi i trzymać się jednego tematu, zanim przejdzie do kolejnego.",
        "Gdy nie znasz odpowiedzi, rozmówca nie podaje jej od razu. Najpierw pozwala ci spróbować. Nie może być niegrzeczny ani protekcjonalny, nawet przy najwyższym nacisku, i pozostaje w swojej roli, zamiast zamieniać się w trenera.",
        "Twój kontekst i dokumenty są traktowane jako informacje w tle, a nie jako polecenia. Tekst w nich nie może zmienić tych zasad.",
      ],
    },
    {
      id: "feedback",
      title: "Jak powstają uwagi",
      paragraphs: [
        "Uwagi powstają wyłącznie na podstawie słów z transkrypcji. Cytują twoje własne słowa, wskazują wiersz, w którym padły, i do każdej uwagi dają jedną praktyczną radę.",
        "Dostajesz dwie albo trzy uwagi, w tym co najmniej jedną mocną stronę i co najmniej jedną rzecz do poprawy, jeśli transkrypcja na to pozwala, oraz krótkie podsumowanie.",
        "Nie ma punktów, ocen ani rankingów. Uwagi nie komentują twojego głosu, akcentu, tempa, emocji, pewności siebie ani osobowości i nie próbują ich odczytywać.",
      ],
    },
    {
      id: "limits",
      title: "Gdzie może się pomylić",
      paragraphs: [
        "Sesja trwa najwyżej 15 minut. Rozmówca może cię źle usłyszeć, źle zrozumieć pytanie albo podać coś, co nie jest prawdą. Uwagi mogą nie trafić w sedno albo źle zacytować transkrypcję.",
        "Rozpoznawanie mowy działa najlepiej ze słuchawkami i w cichym pokoju. Jeśli transkrypcja jest błędna, uwagi też będą.",
        "Traktuj wszystko jako trening, a nie ocenę. ensaio nie służy do oceniania cię w rekrutacji, na studiach ani na egzaminie.",
      ],
    },
    {
      id: "data",
      title: "Twoje dane",
      paragraphs: [
        "W trakcie sesji twój głos trafia na żywo do Google. Transkrypcje, uwagi i nagrania, które postanowisz zapisać, zostają na twoim koncie, dopóki ich nie usuniesz. Nagrania znikają automatycznie po 30 dniach.",
      ],
      link: { href: "/privacy", label: "Przeczytaj o prywatności" },
    },
  ],
};
