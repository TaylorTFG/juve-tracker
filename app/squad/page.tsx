import { getSquadCached } from "@/lib/repository";
import { PlayerCard } from "@/components/PlayerCard";

export default async function SquadPage() {
  const squad = await getSquadCached(false);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Rosa Juventus</h1>
      {squad.length ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {squad.map((player) => (
            <PlayerCard key={player.provider_id} player={player} />
          ))}
        </div>
      ) : (
        <p className="card">Nessun giocatore disponibile.</p>
      )}
    </div>
  );
}
