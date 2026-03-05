"use client";

import { useMemo, useState } from "react";
import type { MatchRow } from "@/types/domain";
import { MatchCard } from "@/components/MatchCard";

type Filter = "all" | "finished" | "upcoming";

export function MatchesListClient({ matches }: { matches: MatchRow[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    if (filter === "finished") {
      return matches.filter((m) => ["FINISHED", "AWARDED"].includes(m.status));
    }
    if (filter === "upcoming") {
      return matches.filter((m) => ["SCHEDULED", "TIMED", "IN_PLAY", "PAUSED", "LIVE"].includes(m.status));
    }
    return matches;
  }, [filter, matches]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button className={filter === "all" ? "pill pill-active" : "pill"} onClick={() => setFilter("all")}>Tutte</button>
        <button className={filter === "finished" ? "pill pill-active" : "pill"} onClick={() => setFilter("finished")}>Terminate</button>
        <button className={filter === "upcoming" ? "pill pill-active" : "pill"} onClick={() => setFilter("upcoming")}>In programma</button>
      </div>

      {filtered.length ? (
        <div className="grid gap-3">{filtered.map((match) => <MatchCard key={match.provider_id} match={match} />)}</div>
      ) : (
        <p className="card">Nessuna partita per questo filtro.</p>
      )}
    </div>
  );
}