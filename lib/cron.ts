import { env } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { MatchRow } from "@/types/domain";

export function assertCronSecret(input: string | null) {
  if (!env.CRON_SECRET) {
    throw new Error("CRON_SECRET missing");
  }
  if (input !== env.CRON_SECRET) {
    throw new Error("Unauthorized");
  }
}

export async function getPushSubscriptions() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  const { data } = await supabase.from("push_subscriptions").select("*");
  return data ?? [];
}

export function isTodayInRome(match: MatchRow, todayRome: string): boolean {
  return match.local_date_rome.startsWith(todayRome);
}
