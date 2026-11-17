export type DocTerm = { term: string; text: string; where?: string };

export type DocSection = {
  id: string;
  title: string;
  paragraphs: string[];
  terms?: DocTerm[];
  link?: { href: string; label: string };
};

export type DocContent = {
  title: string;
  intro: string;
  status?: string;
  updated: string;
  contents: string;
  termLabel: string;
  detailLabel: string;
  whereLabel: string;
  sections: DocSection[];
};
