import { env } from "@/lib/env";
import type { PlayerStats } from "@/types/domain";

export interface StatsProvider {
  getPlayerStats(input: { providerPlayerId: number; playerName?: string }): Promise<PlayerStats>;
}

class FootballDataStatsProvider implements StatsProvider {
  async getPlayerStats(): Promise<PlayerStats> {
    return {
      appearances: null,
      goals: null,
      assists: null,
      provider: "football-data.org",
      note: "Non disponibile con questo provider"
    };
  }
}

class ApiFootballStatsProvider implements StatsProvider {
  async getPlayerStats(input: { providerPlayerId: number; playerName?: string }): Promise<PlayerStats> {
    if (!env.API_FOOTBALL_KEY || !env.API_FOOTBALL_HOST || !env.API_FOOTBALL_BASE_URL || !input.playerName) {
      return {
        appearances: null,
        goals: null,
        assists: null,
        provider: "api-football",
        note: "Configura API_FOOTBALL_* e mapping giocatore per ottenere stats avanzate."
      };
    }

    try {
      const searchUrl = new URL(`${env.API_FOOTBALL_BASE_URL}/players`);
      searchUrl.searchParams.set("search", input.playerName);
      if (env.API_FOOTBALL_SEASON) searchUrl.searchParams.set("season", String(env.API_FOOTBALL_SEASON));
      if (env.API_FOOTBALL_LEAGUE_ID) searchUrl.searchParams.set("league", String(env.API_FOOTBALL_LEAGUE_ID));

      const response = await fetch(searchUrl, {
        headers: {
          "x-apisports-key": env.API_FOOTBALL_KEY,
          "x-apisports-host": env.API_FOOTBALL_HOST
        },
        next: { revalidate: 600 }
      });

      if (!response.ok) {
        return {
          appearances: null,
          goals: null,
          assists: null,
          provider: "api-football",
          note: `Provider esterno non disponibile (${response.status}).`
        };
      }

      const jsonUnknown = await response.json();
      const json = jsonUnknown as {
        response?: Array<{
          player?: { name?: string };
          statistics?: Array<{ games?: { appearances?: number; appearences?: number }; goals?: { total?: number; assists?: number } }>;
        }>;
      };
      const first = json.response?.[0];
      const stats = first?.statistics?.[0];

      return {
        appearances: stats?.games?.appearances ?? stats?.games?.appearences ?? null,
        goals: stats?.goals?.total ?? null,
        assists: stats?.goals?.assists ?? null,
        provider: "api-football",
        note: first ? undefined : "Nessun dato trovato nel provider esterno"
      };
    } catch {
      return {
        appearances: null,
        goals: null,
        assists: null,
        provider: "api-football",
        note: "Errore nel recupero stats dal provider esterno"
      };
    }
  }
}

function createStatsProvider(): StatsProvider {
  if (env.STATS_PROVIDER === "api-football") {
    return new ApiFootballStatsProvider();
  }
  return new FootballDataStatsProvider();
}

export const statsProvider: StatsProvider = createStatsProvider();