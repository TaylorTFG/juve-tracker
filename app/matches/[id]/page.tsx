import { notFound } from "next/navigation";
import { formatRomeDisplay } from "@/lib/time";
import { getMatchDetail } from "@/lib/matchDetails";

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const matchId = Number(id);

  if (Number.isNaN(matchId)) {
    notFound();
  }

  const detail = await getMatchDetail(matchId);

  return (
    <div className="space-y-5 pt-6">
      <section className="card hero-card">
        <p className="text-sm muted">{detail.competition ?? "Competizione n/d"}</p>
        <h1 className="mt-1 text-5xl leading-none">{detail.home_team} vs {detail.away_team}</h1>
        <p className="mt-2 text-lg">
          {detail.home_score ?? "-"} : {detail.away_score ?? "-"} <span className="muted">({detail.status})</span>
        </p>
        <p className="mt-1 muted">{formatRomeDisplay(detail.utc_date)} Europe/Rome</p>
      </section>

      <section className="card">
        <h2 className="text-4xl leading-none">Gol</h2>
        {detail.goals.length ? (
          <ul className="mt-3 space-y-2">
            {detail.goals.map((goal, idx) => (
              <li key={`${goal.team}-${goal.scorer}-${idx}`} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <strong>{goal.minute ?? "?"}&apos;</strong> {goal.team} - {goal.scorer}
                {goal.type ? ` (${goal.type})` : ""}
                {goal.score ? ` | ${goal.score}` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 muted">Nessun gol evento disponibile per questo match.</p>
        )}
      </section>

      <section className="card">
        <h2 className="text-4xl leading-none">Cartellini</h2>
        {detail.bookings.length ? (
          <ul className="mt-3 space-y-2">
            {detail.bookings.map((booking, idx) => (
              <li key={`${booking.team}-${booking.player}-${idx}`} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <strong>{booking.minute ?? "?"}&apos;</strong> {booking.team} - {booking.player}
                {booking.card ? ` (${booking.card})` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 muted">Nessun cartellino disponibile per questo match.</p>
        )}
      </section>

      {detail.providerMessage ? <p className="card muted">{detail.providerMessage}</p> : null}
    </div>
  );
}