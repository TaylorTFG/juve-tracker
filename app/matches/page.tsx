import { addDays, subDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { getMatchesCached } from "@/lib/repository";
import { MatchesListClient } from "@/components/MatchesListClient";
import { TZ } from "@/lib/time";

export default async function MatchesPage() {
  const now = new Date();
  const from = formatInTimeZone(subDays(now, 30), TZ, "yyyy-MM-dd");
  const to = formatInTimeZone(addDays(now, 7), TZ, "yyyy-MM-dd");
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