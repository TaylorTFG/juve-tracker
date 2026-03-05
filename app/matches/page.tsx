import { addDays, subDays, format } from "date-fns";
import { getMatchesCached } from "@/lib/repository";
import { MatchesListClient } from "@/components/MatchesListClient";

export default async function MatchesPage() {
  const now = new Date();
  const from = format(subDays(now, 30), "yyyy-MM-dd");
  const to = format(addDays(now, 7), "yyyy-MM-dd");
  const matches = await getMatchesCached(from, to, false);

  return (
    <div className="space-y-5 pt-6">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-5xl leading-none">Partite</h1>
          <p className="muted">Risultati e calendario Juventus</p>
        </div>
      </section>

      <MatchesListClient matches={matches} />
    </div>
  );
}