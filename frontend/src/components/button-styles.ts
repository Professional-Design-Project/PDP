const base =
  "group inline-flex h-14 items-center justify-between gap-6 px-6 text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-2";

export const buttonStyles = {
  cobalt: `${base} bg-cobalt text-white hover:bg-cobalt/90 focus-visible:outline-ink`,
  ink: `${base} bg-ink text-white hover:bg-ink/85 focus-visible:outline-cobalt`,
  white: `${base} bg-white text-ink hover:bg-raised focus-visible:outline-white`,
  outline: `${base} border border-ink text-ink hover:bg-ink hover:text-white focus-visible:outline-cobalt`,
};

export const arrowMotion =
  "size-5 shrink-0 group-hover:translate-x-1 transition-transform duration-300 ease-(--ease-soft)";
