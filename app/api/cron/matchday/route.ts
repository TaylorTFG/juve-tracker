import { NextRequest, NextResponse } from "next/server";
import { format } from "date-fns";
import { addDays, subDays } from "date-fns";
import { assertCronSecret, getPushSubscriptions } from "@/lib/cron";
import { sendPushNotification } from "@/lib/push";
import { getLiveMatchesCached, getMatchesCached, isCacheFresh, touchCache } from "@/lib/repository";
import { TZ } from "@/lib/time";
import { formatInTimeZone } from "date-fns-tz";

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get("x-cron-secret") ?? request.nextUrl.searchParams.get("secret");
    assertCronSecret(secret);

    const now = new Date();
    const todayRome = formatInTimeZone(now, TZ, "yyyy-MM-dd");
    const todayMatches = await getMatchesCached(todayRome, todayRome, false);
    const live = await getLiveMatchesCached();

    const shouldRefresh = todayMatches.length > 0 || live.length > 0;
    if (!shouldRefresh) {
      return NextResponse.json({ ok: true, skipped: true, reason: "no matchday/live" });
    }

    const from = format(subDays(now, 2), "yyyy-MM-dd");
    const to = format(addDays(now, 2), "yyyy-MM-dd");
    const refreshed = await getMatchesCached(from, to, true);

    const finishedToday = refreshed.filter((m) => m.status === "FINISHED" && m.local_date_rome.startsWith(todayRome));
    if (finishedToday.length) {
      const subscriptions = await getPushSubscriptions();
      for (const match of finishedToday) {
        const key = `ft_push_${match.provider_id}`;
        if (await isCacheFresh(key)) continue;

        await Promise.all(
          subscriptions.map((s) =>
            sendPushNotification(
              {
                endpoint: s.endpoint,
                keys: { p256dh: s.p256dh, auth: s.auth }
              },
              {
                title: "Finale Juventus",
                body: `${match.home_team} ${match.home_score ?? "-"} - ${match.away_score ?? "-"} ${match.away_team}`,
                url: "/matches"
              }
            ).catch(() => null)
          )
        );
        await touchCache(key, 7 * 24 * 3600);
      }
    }

    await touchCache("matchday_last_run", 3600);
    return NextResponse.json({ ok: true, skipped: false });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 401 });
  }
}
