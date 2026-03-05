import webpush from "web-push";
import { env } from "@/lib/env";

let configured = false;

export function ensureWebPushConfigured() {
  if (configured) return;
  if (!env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT) {
    throw new Error("VAPID env vars missing");
  }

  webpush.setVapidDetails(env.VAPID_SUBJECT, env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
  configured = true;
}

export async function sendPushNotification(subscription: webpush.PushSubscription, payload: Record<string, unknown>) {
  ensureWebPushConfigured();
  await webpush.sendNotification(subscription, JSON.stringify(payload));
}
