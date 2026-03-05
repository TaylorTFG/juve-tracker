import { StandingsTable } from "@/components/StandingsTable";
import { getSerieAStandings } from "@/lib/standings";

export default async function StandingsPage() {
  const standings = await getSerieAStandings();

  return (
    <div className="space-y-4 pt-6">
      <h1 className="text-5xl leading-none">Classifica Serie A</h1>
      {standings.length ? <StandingsTable rows={standings} /> : <p className="card muted">Classifica non disponibile.</p>}
    </div>
  );
}