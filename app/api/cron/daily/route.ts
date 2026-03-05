import { NextRequest, NextResponse } from "next/server";
import { addDays, subDays, format } from "date-fns";
import { assertCronSecret, getPushSubscriptions, isTodayInRome } from "@/lib/cron";
import { sendPushNotification } from "@/lib/push";
import { getMatchesCached, getSquadCached, touchCache } from "@/lib/repository";
import { getSupabaseAdmin } from "@/lib/supabase";
import { TZ } from "@/lib/time";
import { formatInTimeZone } from "date-fns-tz";

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get("x-cron-secret") ?? request.nextUrl.searchParams.get("secret");
    assertCronSecret(secret);

    const now = new Date();
    const from = format(subDays(now, 30), "yyyy-MM-dd");
    const to = format(addDays(now, 7), "yyyy-MM-dd");

    await Promise.all([getSquadCached(true), getMatchesCached(from, to, true)]);

    const todayRome = formatInTimeZone(now, TZ, "yyyy-MM-dd");
    const matches = await getMatchesCached(todayRome, todayRome, false);
    const todayMatch = matches.find((m) => isTodayInRome(m, todayRome));

    if (todayMatch) {
      const subscriptions = await getPushSubscriptions();
      await Promise.all(
        subscriptions.map((s) =>
          sendPushNotification(
            {
              endpoint: s.endpoint,
              keys: { p256dh: s.p256dh, auth: s.auth }
            },
            {
              title: "Juve Tracker",
              body: `Oggi gioca la Juve: ${todayMatch.home_team} vs ${todayMatch.away_team} alle ${formatInTimeZone(todayMatch.utc_date, TZ, "HH:mm")}`,
              url: "/matches"
            }
          ).catch(() => null)
        )
      );
      await touchCache(`daily_push_${todayRome}`, 36 * 3600);
    }

    const supabase = getSupabaseAdmin();
    if (supabase) {
      await supabase.from("cache_meta").upsert({ key: "daily_last_run", ttl_seconds: 86400, updated_at: new Date().toISOString() });
    }

    return NextResponse.json({ ok: true, todayMatch: !!todayMatch });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 401 });
  }
}

