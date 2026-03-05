import Link from "next/link";
import type { MatchRow } from "@/types/domain";
import { formatRomeDisplay } from "@/lib/time";

function statusLabel(status: string): string {
  if (["FINISHED", "AWARDED"].includes(status)) return "Terminata";
  if (["IN_PLAY", "PAUSED", "LIVE"].includes(status)) return "Live";
  return "In programma";
}

export function MatchCard({ match }: { match: MatchRow }) {
  return (
    <Link href={`/matches/${match.provider_id}`} className="match-link">
      <article className="card">
        <div className="flex items-center justify-between text-xs muted">
          <span>{match.competition ?? "Competizione n/d"}</span>
          <span className="rounded-full border border-white/20 bg-white/5 px-2 py-0.5">{statusLabel(match.status)}</span>
        </div>
        <div className="mt-2 text-sm muted">{formatRomeDisplay(match.utc_date)}</div>
        <div className="mt-3 text-base font-semibold">
          {match.home_team} {match.home_score ?? "-"} : {match.away_score ?? "-"} {match.away_team}
        </div>
        <div className="mt-2 text-xs text-[#f6c90e]">Apri dettagli gol/cartellini</div>
      </article>
    </Link>
  );
}