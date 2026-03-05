import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { fetchSquad } from "@/lib/footballDataClient";

export async function GET() {
  try {
    const team = await fetchSquad(env.JUVE_TEAM_ID);
    const valid = String(team.name ?? "").toLowerCase().includes("juventus");

    return NextResponse.json({
      ok: valid,
      teamId: env.JUVE_TEAM_ID,
      providerName: team.name,
      message: valid
        ? "Team verificato correttamente"
        : "JUVE_TEAM_ID non punta a Juventus. Correggi la variabile JUVE_TEAM_ID nel file .env"
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
