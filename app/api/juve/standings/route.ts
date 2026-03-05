import { NextResponse } from "next/server";
import { getSerieAStandings } from "@/lib/standings";

export async function GET() {
  try {
    const data = await getSerieAStandings();
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}