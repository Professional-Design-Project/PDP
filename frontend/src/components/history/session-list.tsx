"use client";

import { LocaleLink as Link } from "@/components/locale-link";
import { ArrowRightIcon } from "@/components/icons";
import { formatClock } from "@/components/session/session-state";
import { useLocale } from "@/i18n/locale";
import { formatDate } from "@/lib/format";
import type { PastSession } from "@/lib/history";
import { languageName } from "@/lib/languages";

export function SessionList({ sessions }: { sessions: PastSession[] }) {
  const { locale, t } = useLocale();
  return (
    <ol className="mt-10 border-t-2 border-ink">
      {sessions.map((session, index) => (
        <li key={session.id} className="animate-fade" style={{ animationDelay: `${index * 30}ms` }}>
          <Link
            href={`/history/${session.id}`}
            className="group grid gap-1 border-b border-line px-1 py-5 hover:bg-white focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cobalt sm:grid-cols-[1fr_12rem_8rem_2rem] sm:items-center sm:gap-6 sm:px-4"
          >
            <span>
              <span className="block text-lg font-bold">
                {t.scenarios[session.scenarioId].title}
              </span>
              <span className="text-[14px] text-muted">
                {formatDate(session.createdAt, locale)} · {languageName(session.language)}
              </span>
            </span>
            <span className="text-[14px] text-muted">
              {t.history.status[session.status as keyof typeof t.history.status] ?? session.status}
            </span>
            <span className="text-[15px] tabular-nums">
              {t.history.duration(formatClock(session.duration))}
            </span>
            <ArrowRightIcon className="size-5 text-muted transition-transform duration-300 ease-(--ease-soft) group-hover:translate-x-1 group-hover:text-cobalt max-sm:hidden" />
          </Link>
        </li>
      ))}
    </ol>
  );
}
