import { NextRequest, NextResponse } from "next/server";
import { getMatchesCached } from "@/lib/repository";

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ ok: false, error: "Missing from/to" }, { status: 400 });
  }

  try {
    const matches = await getMatchesCached(from, to, false);
    return NextResponse.json({ ok: true, data: matches });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}

