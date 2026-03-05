self.addEventListener("push", (event) => {
  if (!event.data) return;

  const payload = event.data.json();
  event.waitUntil(
    self.registration.showNotification(payload.title ?? "Juve Tracker", {
      body: payload.body ?? "Nuovo aggiornamento Juventus",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: payload.url ?? "/matches"
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data || "/";
  event.waitUntil(clients.openWindow(target));
});

