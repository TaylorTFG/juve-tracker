import { readFileSync } from "node:fs";
import { join } from "node:path";
import { env } from "@/lib/env";
import { fetchMatches, fetchSquad } from "@/lib/footballDataClient";
import { getSupabaseAdmin } from "@/lib/supabase";
import { toRomeIso } from "@/lib/time";
import type { MatchRow, PlayerRow } from "@/types/domain";

function loadMock<T>(filename: string): T {
  const file = join(process.cwd(), "mocks", filename);
  return JSON.parse(readFileSync(file, "utf-8")) as T;
}

function mapPlayer(input: any): Omit<PlayerRow, "id" | "updated_at"> {
  return {
    provider_id: input.id,
    name: input.name,
    position: input.position ?? null,
    nationality: input.nationality ?? null,
    date_of_birth: input.dateOfBirth ?? null,
    shirt_number: input.shirtNumber ?? null,
    contract_until: input.contract?.until ?? null,
    market_value: input.marketValue ?? null
  };
}

function mapMatch(input: any): Omit<MatchRow, "id" | "updated_at"> {
  return {
    provider_id: input.id,
    utc_date: input.utcDate,
    local_date_rome: toRomeIso(input.utcDate),
    competition: input.competition?.name ?? null,
    home_team: input.homeTeam?.name ?? "",
    away_team: input.awayTeam?.name ?? "",
    home_score: input.score?.fullTime?.home ?? null,
    away_score: input.score?.fullTime?.away ?? null,
    status: input.status ?? "SCHEDULED"
  };
}

export async function isCacheFresh(key: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const { data } = await supabase.from("cache_meta").select("updated_at, ttl_seconds").eq("key", key).maybeSingle();
  if (!data) return false;

  const expires = new Date(data.updated_at).getTime() + data.ttl_seconds * 1000;
  return Date.now() < expires;
}

export async function touchCache(key: string, ttlSeconds: number): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  await supabase.from("cache_meta").upsert({ key, ttl_seconds: ttlSeconds, updated_at: new Date().toISOString() });
}

export async function getSquadCached(forceRefresh = false): Promise<PlayerRow[]> {
  if (env.USE_MOCK_DATA) {
    return loadMock<PlayerRow[]>("players.json");
  }

  const supabase = getSupabaseAdmin();
  const cacheKey = "juve_squad";

  if (!forceRefresh && supabase && (await isCacheFresh(cacheKey))) {
    const { data } = await supabase.from("players").select("*").order("name", { ascending: true });
    if (data?.length) return data as PlayerRow[];
  }

  const team = await fetchSquad(env.JUVE_TEAM_ID);
  const rows = (team.squad ?? []).map(mapPlayer);

  if (supabase && rows.length) {
    await supabase.from("players").upsert(rows, { onConflict: "provider_id" });
    await touchCache(cacheKey, 24 * 3600);
  }

  return supabase
    ? ((await supabase.from("players").select("*").order("name", { ascending: true })).data as PlayerRow[])
    : rows.map((r, i) => ({ ...r, id: i + 1, updated_at: new Date().toISOString() }));
}

export async function getMatchesCached(from: string, to: string, forceRefresh = false): Promise<MatchRow[]> {
  if (env.USE_MOCK_DATA) {
    return loadMock<MatchRow[]>("matches.json");
  }

  const supabase = getSupabaseAdmin();
  const cacheKey = `juve_matches_${from}_${to}`;

  if (!forceRefresh && supabase && (await isCacheFresh(cacheKey))) {
    const { data } = await supabase
      .from("matches")
      .select("*")
      .gte("utc_date", `${from}T00:00:00Z`)
      .lte("utc_date", `${to}T23:59:59Z`)
      .order("utc_date", { ascending: true });
    if (data?.length) return data as MatchRow[];
  }

  const payload = await fetchMatches(env.JUVE_TEAM_ID, from, to);
  const rows = (payload.matches ?? []).map(mapMatch);

  if (supabase && rows.length) {
    await supabase.from("matches").upsert(rows, { onConflict: "provider_id" });
    await touchCache(cacheKey, 24 * 3600);
  }

  if (supabase) {
    const { data } = await supabase
      .from("matches")
      .select("*")
      .gte("utc_date", `${from}T00:00:00Z`)
      .lte("utc_date", `${to}T23:59:59Z`)
      .order("utc_date", { ascending: true });
    return (data ?? []) as MatchRow[];
  }

  return rows.map((r, i) => ({ ...r, id: i + 1, updated_at: new Date().toISOString() }));
}

export async function getLiveMatchesCached(): Promise<MatchRow[]> {
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - 1);
  const to = new Date(now);
  to.setDate(to.getDate() + 1);
  const fromStr = from.toISOString().slice(0, 10);
  const toStr = to.toISOString().slice(0, 10);

  const matches = await getMatchesCached(fromStr, toStr, false);
  return matches.filter((m) => ["IN_PLAY", "PAUSED", "LIVE"].includes(m.status));
}