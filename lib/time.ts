import { env } from "@/lib/env";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";

export const TZ = env.TIMEZONE;

export function nowInRome(): Date {
  const now = new Date();
  const iso = formatInTimeZone(now, TZ, "yyyy-MM-dd'T'HH:mm:ss");
  return fromZonedTime(iso, TZ);
}

export function toRomeIso(utcIso: string): string {
  return formatInTimeZone(new Date(utcIso), TZ, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

export function romeDateOnly(input: string | Date): string {
  return formatInTimeZone(new Date(input), TZ, "yyyy-MM-dd");
}

export function formatRomeDisplay(input: string | Date): string {
  return formatInTimeZone(new Date(input), TZ, "dd/MM/yyyy HH:mm");
}

export function dateRangeForHome() {
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - 30);
  const to = new Date(now);
  to.setDate(to.getDate() + 7);

  return {
    from: formatInTimeZone(from, TZ, "yyyy-MM-dd"),
    to: formatInTimeZone(to, TZ, "yyyy-MM-dd")
  };
}
