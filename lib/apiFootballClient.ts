import { env } from "@/lib/env";

type ApiFootballEvent = {
  minute: number | null;
  team: string;
  player: string;
  detail: string;
  type: string;
};

type ApiFootballPlayerStats = {
  appearances: number | null;
  goals: number | null;
  assists: number | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

async function afGet(path: string, params?: Record<string, string>) {
  if (!env.API_FOOTBALL_BASE_URL || !env.API_FOOTBALL_KEY || !env.API_FOOTBALL_HOST) {
    throw new Error("API_FOOTBALL_* env mancanti");
  }

  const url = new URL(`${env.API_FOOTBALL_BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const response = await fetch(url, {
    headers: {
      "x-apisports-key": env.API_FOOTBALL_KEY,
      "x-apisports-host": env.API_FOOTBALL_HOST
    },
    next: { revalidate: 300 }
  });

  if (!response.ok) {
    throw new Error(`api-football error ${response.status}`);
  }

  return response.json();
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function findFixtureIdByMatch(match: { utcDate: string; homeTeam: string; awayTeam: string }): Promise<number | null> {
  if (!env.API_FOOTBALL_TEAM_ID) return null;

  const date = match.utcDate.slice(0, 10);
  const payload = (await afGet("/fixtures", {
    date,
    team: String(env.API_FOOTBALL_TEAM_ID)
  })) as { response?: Array<Record<string, unknown>> };

  const fixture = (payload.response ?? []).find((item: Record<string, unknown>) => {
    const teams = asRecord(item.teams);
    const home = asRecord(teams.home);
    const away = asRecord(teams.away);
    const homeName = String(home.name ?? "");
    const awayName = String(away.name ?? "");

    const h1 = normalizeName(homeName);
    const a1 = normalizeName(awayName);
    const h2 = normalizeName(match.homeTeam);
    const a2 = normalizeName(match.awayTeam);

    return (h1.includes(h2) || h2.includes(h1)) && (a1.includes(a2) || a2.includes(a1));
  });

  if (!fixture) return null;
  const fixtureObj = asRecord(fixture.fixture);
  const id = fixtureObj.id;
  return typeof id === "number" ? id : null;
}

export async function getFixtureEvents(fixtureId: number): Promise<ApiFootballEvent[]> {
  const payload = (await afGet("/fixtures/events", { fixture: String(fixtureId) })) as {
    response?: Array<Record<string, unknown>>;
  };

  return (payload.response ?? []).map((item: Record<string, unknown>) => {
    const team = asRecord(item.team);
    const player = asRecord(item.player);
    const time = asRecord(item.time);
    const elapsed = time.elapsed;

    return {
      minute: typeof elapsed === "number" ? elapsed : null,
      team: String(team.name ?? "n/d"),
      player: String(player.name ?? "n/d"),
      detail: String(item.detail ?? ""),
      type: String(item.type ?? "")
    };
  });
}

export async function getApiFootballStatsByName(playerName: string): Promise<ApiFootballPlayerStats | null> {
  const params: Record<string, string> = { search: playerName };
  if (env.API_FOOTBALL_LEAGUE_ID) params.league = String(env.API_FOOTBALL_LEAGUE_ID);
  if (env.API_FOOTBALL_SEASON) params.season = String(env.API_FOOTBALL_SEASON);

  const payload = (await afGet("/players", params)) as {
    response?: Array<Record<string, unknown>>;
  };

  const first = (payload.response ?? [])[0];
  if (!first) return null;

  const statistics = asRecord((asRecord(first).statistics as unknown[] | undefined)?.[0]);
  const games = asRecord(statistics.games);
  const goals = asRecord(statistics.goals);

  const appearances = games.appearances ?? games.appearences;
  return {
    appearances: typeof appearances === "number" ? appearances : null,
    goals: typeof goals.total === "number" ? goals.total : null,
    assists: typeof goals.assists === "number" ? goals.assists : null
  };
}