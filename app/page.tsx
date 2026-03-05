import Link from "next/link";
import { getHomeData } from "@/lib/serverData";
import { getSerieAStandings } from "@/lib/standings";
import { MatchCard } from "@/components/MatchCard";
import { StandingsTable } from "@/components/StandingsTable";

export default async function HomePage() {
  const [{ nextMatch, liveMatches, lastResults }, standings] = await Promise.all([getHomeData(), getSerieAStandings()]);

  return (
    <div className="space-y-7 pt-6">
      <section className="card hero-card">
        <h1 className="text-5xl leading-none">Dashboard</h1>
        <p className="mt-2 muted">Prossima partita, live score, classifica e risultati recenti della Juventus.</p>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-4xl leading-none">Classifica Serie A</h2>
          <Link href="/standings" className="pill">Apri completa</Link>
        </div>
        {standings.length ? <StandingsTable rows={standings} compact /> : <p className="card muted">Classifica non disponibile.</p>}
      </section>

      <section>
        <h2 className="mb-3 text-4xl leading-none">Prossima Partita</h2>
        {nextMatch ? <MatchCard match={nextMatch} /> : <p className="card muted">Nessuna partita imminente disponibile.</p>}
      </section>

      <section>
        <h2 className="mb-3 text-4xl leading-none">Live Adesso</h2>
        {liveMatches.length ? (
          <div className="grid gap-3">{liveMatches.map((match) => <MatchCard key={match.provider_id} match={match} />)}</div>
        ) : (
          <p className="card muted">Nessuna partita live in questo momento.</p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-4xl leading-none">Ultimi Risultati</h2>
        {lastResults.length ? (
          <div className="grid gap-3">{lastResults.map((match) => <MatchCard key={match.provider_id} match={match} />)}</div>
        ) : (
          <p className="card muted">Risultati non disponibili.</p>
        )}
      </section>
    </div>
  );
}