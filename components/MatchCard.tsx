import type { MatchRow } from "@/types/domain";
import { formatRomeDisplay } from "@/lib/time";

export function MatchCard({ match }: { match: MatchRow }) {
  return (
    <article className="card">
      <div className="flex items-center justify-between text-xs text-black/60">
        <span>{match.competition ?? "Competizione n/d"}</span>
        <span className="rounded-full bg-black/5 px-2 py-0.5">{match.status}</span>
      </div>
      <div className="mt-2 text-sm">{formatRomeDisplay(match.utc_date)}</div>
      <div className="mt-3 text-base font-semibold">
        {match.home_team} {match.home_score ?? "-"} : {match.away_score ?? "-"} {match.away_team}
      </div>
    </article>
  );
}

