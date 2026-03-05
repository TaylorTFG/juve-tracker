import { readFileSync } from "node:fs";
import { join } from "node:path";
import { env } from "@/lib/env";
import { fetchMatchById } from "@/lib/footballDataClient";
import { toRomeIso } from "@/lib/time";
import type { MatchDetail, MatchBookingEvent, MatchGoalEvent } from "@/types/domain";

function readMockDetail(matchId: number): MatchDetail {
  const file = join(process.cwd(), "mocks", "matchDetails.json");
  const raw = JSON.parse(readFileSync(file, "utf-8")) as Record<string, MatchDetail>;
  return (
    raw[String(matchId)] ?? {
      provider_id: matchId,
      utc_date: new Date().toISOString(),
      local_date_rome: toRomeIso(new Date().toISOString()),
      status: "SCHEDULED",
      competition: null,
      home_team: "Juventus",
      away_team: "Avversario",
      home_score: null,
      away_score: null,
      goals: [],
      bookings: [],
      providerMessage: "Dettagli evento non disponibili nei mock"
    }
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function readString(record: Record<string, unknown>, key: string, fallback = ""): string {
  const v = record[key];
  return typeof v === "string" ? v : fallback;
}

function readNumber(record: Record<string, unknown>, key: string): number | null {
  const v = record[key];
  return typeof v === "number" ? v : null;
}

function readMinute(record: Record<string, unknown>): number | null {
  const direct = record.minute;
  if (typeof direct === "number") return direct;
  if (direct && typeof direct === "object") {
    const regular = asRecord(direct).regular;
    return typeof regular === "number" ? regular : null;
  }
  return null;
}

function mapGoal(item: unknown): MatchGoalEvent {
  const record = asRecord(item);
  const team = asRecord(record.team);
  const scorer = asRecord(record.scorer);
  return {
    minute: readMinute(record),
    team: readString(team, "name", "n/d"),
    scorer: readString(scorer, "name", "n/d"),
    type: readString(record, "type", "") || null,
    score: readString(record, "score", "") || null
  };
}

function mapBooking(item: unknown): MatchBookingEvent {
  const record = asRecord(item);
  const team = asRecord(record.team);
  const player = asRecord(record.player);
  return {
    minute: readMinute(record),
    team: readString(team, "name", "n/d"),
    player: readString(player, "name", "n/d"),
    card: readString(record, "card", "") || null
  };
}

export async function getMatchDetail(matchId: number): Promise<MatchDetail> {
  if (env.USE_MOCK_DATA) {
    return readMockDetail(matchId);
  }

  const payloadUnknown = await fetchMatchById(matchId);
  const payload = asRecord(payloadUnknown);
  const match = asRecord(payload.match ?? payload);

  const utcDate = readString(match, "utcDate", new Date().toISOString());
  const goalsRaw = Array.isArray(match.goals) ? match.goals : [];
  const bookingsRaw = Array.isArray(match.bookings) ? match.bookings : [];

  const detail: MatchDetail = {
    provider_id: readNumber(match, "id") ?? matchId,
    utc_date: utcDate,
    local_date_rome: toRomeIso(utcDate),
    status: readString(match, "status", "SCHEDULED"),
    competition: readString(asRecord(match.competition), "name", "") || null,
    home_team: readString(asRecord(match.homeTeam), "name", "Casa"),
    away_team: readString(asRecord(match.awayTeam), "name", "Trasferta"),
    home_score: readNumber(asRecord(asRecord(match.score).fullTime), "home"),
    away_score: readNumber(asRecord(asRecord(match.score).fullTime), "away"),
    goals: goalsRaw.map((item) => mapGoal(item)),
    bookings: bookingsRaw.map((item) => mapBooking(item))
  };

  if (detail.goals.length === 0 && detail.bookings.length === 0) {
    detail.providerMessage = "Il provider non espone eventi dettagliati per questa partita o per il tuo piano API.";
  }

  return detail;
}