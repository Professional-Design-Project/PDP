"use client";

import { useState } from "react";
import { ProgressSection } from "@/components/history/progress-section";
import { ScenarioFilter } from "@/components/history/scenario-filter";
import { SessionList } from "@/components/history/session-list";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import type { PastSession } from "@/lib/history";
import { loadProgress, practisedScenarios, type ScenarioFilter as Filter } from "@/lib/progress";

export function HistoryOverview({ sessions }: { sessions: PastSession[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const { state } = useSupabaseQuery(loadProgress, "progress");
  const scenarios = [...new Set(sessions.map((session) => session.scenarioId))];
  const shown = filter === "all" ? sessions : sessions.filter((s) => s.scenarioId === filter);
  const progress = state.status === "ready" ? state.data : null;
  return (
    <>
      {scenarios.length > 1 && (
        <div className="mt-10">
          <ScenarioFilter scenarios={scenarios} value={filter} onChange={setFilter} />
        </div>
      )}
      {progress && practisedScenarios(progress).length > 0 && (
        <ProgressSection data={progress} filter={filter} />
      )}
      <SessionList sessions={shown} />
    </>
  );
}
