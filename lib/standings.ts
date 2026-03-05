import { readFileSync } from "node:fs";
import { join } from "node:path";
import { env } from "@/lib/env";
import { fdGet } from "@/lib/footballDataClient";

export type StandingRow = {
  position: number;
  team: string;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

function loadMock(): StandingRow[] {
  const file = join(process.cwd(), "mocks", "standings.json");
  return JSON.parse(readFileSync(file, "utf-8")) as StandingRow[];
}

export async function getSerieAStandings(): Promise<StandingRow[]> {
  if (env.USE_MOCK_DATA) return loadMock();

  const payload = (await fdGet("/competitions/SA/standings")) as {
    standings?: Array<{ type?: string; table?: Array<Record<string, unknown>> }>;
  };

  const standings = payload.standings ?? [];
  const total = standings.find((s) => s.type === "TOTAL") ?? standings[0];
  const table = total?.table ?? [];

  return table.map((row) => {
    const teamObj = (row.team ?? {}) as Record<string, unknown>;
    return {
      position: Number(row.position ?? 0),
      team: String(teamObj.name ?? "n/d"),
      played: Number(row.playedGames ?? 0),
      won: Number(row.won ?? 0),
      draw: Number(row.draw ?? 0),
      lost: Number(row.lost ?? 0),
      goalsFor: Number(row.goalsFor ?? 0),
      goalsAgainst: Number(row.goalsAgainst ?? 0),
      goalDifference: Number(row.goalDifference ?? 0),
      points: Number(row.points ?? 0)
    };
  });
}