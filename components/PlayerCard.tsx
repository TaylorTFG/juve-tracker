import Link from "next/link";
import type { PlayerRow } from "@/types/domain";

export function PlayerCard({ player }: { player: PlayerRow }) {
  return (
    <Link
      href={`/players/${player.provider_id}`}
      className="card block transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="text-sm text-black/60">{player.position ?? "Ruolo non disponibile"}</div>
      <h3 className="mt-1 text-lg font-semibold">{player.name}</h3>
      <div className="mt-3 text-sm text-black/70">{player.nationality ?? "Nazionalita n/d"}</div>
      <div className="text-sm text-black/70">Maglia: {player.shirt_number ?? "n/d"}</div>
    </Link>
  );
}
