import { NextResponse } from "next/server";
import { getLiveMatchesCached } from "@/lib/repository";

export async function GET() {
  try {
    const matches = await getLiveMatchesCached();
    return NextResponse.json({ ok: true, data: matches });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}

