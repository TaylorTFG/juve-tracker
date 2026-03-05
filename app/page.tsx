import { getHomeData } from "@/lib/serverData";
import { MatchCard } from "@/components/MatchCard";

export default async function HomePage() {
  const { nextMatch, liveMatches, lastResults } = await getHomeData();

  return (
    <div className="space-y-6">
      <section className="card bg-juventus-black text-white">
        <h1 className="text-2xl font-bold">Juve Tracker</h1>
        <p className="mt-2 text-white/80">Prossima partita, live score e ultimi risultati in un solo posto.</p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Prossima partita</h2>
        {nextMatch ? <MatchCard match={nextMatch} /> : <p className="card">Nessuna partita imminente disponibile.</p>}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Live adesso</h2>
        {liveMatches.length ? (
          <div className="grid gap-3">{liveMatches.map((match) => <MatchCard key={match.provider_id} match={match} />)}</div>
        ) : (
          <p className="card">Nessuna partita live in questo momento.</p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Ultimi risultati</h2>
        {lastResults.length ? (
          <div className="grid gap-3">{lastResults.map((match) => <MatchCard key={match.provider_id} match={match} />)}</div>
        ) : (
          <p className="card">Risultati non disponibili.</p>
        )}
      </section>
    </div>
  );
}

