import { addDays, subDays, format } from "date-fns";
import { getMatchesCached } from "@/lib/repository";
import { MatchCard } from "@/components/MatchCard";

export default async function MatchesPage() {
  const now = new Date();
  const from = format(subDays(now, 30), "yyyy-MM-dd");
  const to = format(addDays(now, 7), "yyyy-MM-dd");
  const matches = await getMatchesCached(from, to, false);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Partite Juventus</h1>
      <p className="mb-4 text-sm text-black/70">Ultimo mese + prossime 7 giornate.</p>
      {matches.length ? (
        <div className="grid gap-3">{matches.map((match) => <MatchCard key={match.provider_id} match={match} />)}</div>
      ) : (
        <p className="card">Partite non disponibili.</p>
      )}
    </div>
  );
}
