import { notFound } from "next/navigation";
import { getSquadCached } from "@/lib/repository";
import { statsProvider } from "@/lib/providers/statsProvider";

export default async function PlayerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const squad = await getSquadCached(false);
  const player = squad.find((p) => String(p.provider_id) === id);

  if (!player) {
    notFound();
  }

  const stats = await statsProvider.getPlayerStats(player.provider_id);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{player.name}</h1>

      <section className="card grid gap-2 text-sm sm:grid-cols-2">
        <p>Ruolo: {player.position ?? "n/d"}</p>
        <p>Nazionalita: {player.nationality ?? "n/d"}</p>
        <p>Data nascita: {player.date_of_birth ?? "n/d"}</p>
        <p>Numero maglia: {player.shirt_number ?? "n/d"}</p>
        <p>Contratto: {player.contract_until ?? "n/d"}</p>
        <p>Market value: {player.market_value ?? "n/d"}</p>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold">Statistiche</h2>
        <p className="mt-2">Presenze: {stats.appearances ?? "non disponibile con questo provider"}</p>
        <p>Gol: {stats.goals ?? "non disponibile con questo provider"}</p>
        <p>Assist: {stats.assists ?? "non disponibile con questo provider"}</p>
        {stats.note ? <p className="mt-2 text-sm text-black/70">{stats.note}</p> : null}
      </section>
    </div>
  );
}
