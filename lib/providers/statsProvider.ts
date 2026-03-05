import type { PlayerStats } from "@/types/domain";

export interface StatsProvider {
  getPlayerStats(providerPlayerId: number): Promise<PlayerStats>;
}

class FootballDataStatsProvider implements StatsProvider {
  async getPlayerStats(_providerPlayerId: number): Promise<PlayerStats> {
    return {
      appearances: null,
      goals: null,
      assists: null,
      provider: "football-data.org",
      note: "Non disponibile con questo provider"
    };
  }
}

export const statsProvider: StatsProvider = new FootballDataStatsProvider();
