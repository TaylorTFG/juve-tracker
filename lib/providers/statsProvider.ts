import { env } from "@/lib/env";
import { getApiFootballStatsByName } from "@/lib/apiFootballClient";
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
    if (!input.playerName) {
      return {
        appearances: null,
        goals: null,
        assists: null,
        provider: "api-football",
        note: "Nome giocatore mancante"
      };
    }

    try {
      const stats = await getApiFootballStatsByName(input.playerName);
      if (!stats) {
        return {
          appearances: null,
          goals: null,
          assists: null,
          provider: "api-football",
          note: "Nessun dato trovato nel provider esterno"
        };
      }

      return {
        appearances: stats.appearances,
        goals: stats.goals,
        assists: stats.assists,
        provider: "api-football"
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