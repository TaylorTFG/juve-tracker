import { NextResponse } from "next/server";
import { getSquadCached } from "@/lib/repository";

export async function GET() {
  try {
    const squad = await getSquadCached(false);
    return NextResponse.json({ ok: true, data: squad });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
