import { getHomeData } from "@/lib/serverData";
import { MatchCard } from "@/components/MatchCard";

export default async function HomePage() {
  const { nextMatch, liveMatches, lastResults } = await getHomeData();

  return (
    <div className="space-y-7 pt-6">
      <section className="card hero-card">
        <h1 className="text-5xl leading-none">Dashboard</h1>
        <p className="mt-2 muted">Prossima partita, live score e risultati recenti della Juventus.</p>
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