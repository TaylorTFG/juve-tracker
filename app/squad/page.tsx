import { getSquadCached } from "@/lib/repository";
import { PlayerCard } from "@/components/PlayerCard";

export default async function SquadPage() {
  const squad = await getSquadCached(false);

  return (
    <div className="space-y-4 pt-6">
      <h1 className="text-5xl leading-none">Rosa</h1>
      {squad.length ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {squad.map((player) => (
            <PlayerCard key={player.provider_id} player={player} />
          ))}
        </div>
      ) : (
        <p className="card muted">Nessun giocatore disponibile.</p>
      )}
    </div>
  );
}