import { dateRangeForHome } from "@/lib/time";
import { getMatchesCached, getSquadCached } from "@/lib/repository";

export async function getHomeData() {
  const { from, to } = dateRangeForHome();
  const [squad, matches] = await Promise.all([getSquadCached(false), getMatchesCached(from, to, false)]);

  const now = Date.now();
  const nextMatch = matches.find((m) => new Date(m.utc_date).getTime() >= now && ["SCHEDULED", "TIMED"].includes(m.status));
  const liveMatches = matches.filter((m) => ["IN_PLAY", "PAUSED", "LIVE"].includes(m.status));
  const lastResults = matches.filter((m) => ["FINISHED", "AWARDED"].includes(m.status)).slice(-5).reverse();

  return { squad, matches, nextMatch, liveMatches, lastResults };
}

