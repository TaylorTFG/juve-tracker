"use client";

import { useEffect, useState } from "react";

async function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function NotificationSettings() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  async function subscribe() {
    try {
      setBusy(true);
      const status = await Notification.requestPermission();
      setPermission(status);
      if (status !== "granted") return;

      const registration = await navigator.serviceWorker.register("/sw.js");
      const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapid) throw new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY missing");

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: await urlBase64ToUint8Array(vapid)
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub)
      });
    } finally {
      setBusy(false);
    }
  }

  async function unsubscribe() {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const sub = await registration?.pushManager.getSubscription();
      if (!sub) return;

      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint })
      });
      await sub.unsubscribe();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card space-y-3">
      <p>Permesso notifiche: <strong>{permission}</strong></p>
      <div className="flex gap-2">
        <button
          className="rounded-xl bg-juventus-black px-4 py-2 text-white disabled:opacity-50"
          onClick={subscribe}
          disabled={busy}
        >
          Attiva notifiche
        </button>
        <button
          className="rounded-xl border border-black/20 px-4 py-2 disabled:opacity-50"
          onClick={unsubscribe}
          disabled={busy}
        >
          Disattiva
        </button>
      </div>
    </div>
  );
}
