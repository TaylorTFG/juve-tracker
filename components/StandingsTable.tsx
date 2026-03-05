import type { StandingRow } from "@/lib/standings";

export function StandingsTable({ rows, compact = false }: { rows: StandingRow[]; compact?: boolean }) {
  const visible = compact ? rows.slice(0, 8) : rows;

  return (
    <div className="card overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="muted">
          <tr className="border-b border-white/10 text-left">
            <th className="px-2 py-2">#</th>
            <th className="px-2 py-2">Squadra</th>
            <th className="px-2 py-2">Pt</th>
            <th className="px-2 py-2">G</th>
            <th className="px-2 py-2">V</th>
            <th className="px-2 py-2">N</th>
            <th className="px-2 py-2">P</th>
            <th className="px-2 py-2">GF</th>
            <th className="px-2 py-2">GS</th>
            <th className="px-2 py-2">DR</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((row) => (
            <tr key={row.position + row.team} className="border-b border-white/5">
              <td className="px-2 py-2">{row.position}</td>
              <td className="px-2 py-2 font-semibold">{row.team}</td>
              <td className="px-2 py-2 font-bold">{row.points}</td>
              <td className="px-2 py-2">{row.played}</td>
              <td className="px-2 py-2">{row.won}</td>
              <td className="px-2 py-2">{row.draw}</td>
              <td className="px-2 py-2">{row.lost}</td>
              <td className="px-2 py-2">{row.goalsFor}</td>
              <td className="px-2 py-2">{row.goalsAgainst}</td>
              <td className="px-2 py-2">{row.goalDifference}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}