import { NotificationSettings } from "@/components/NotificationSettings";

export default function NotificationsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Impostazioni Notifiche</h1>
      <p className="text-sm text-black/70">
        Ricevi avvisi al mattino quando gioca la Juve e aggiornamenti matchday (se abilitati nel backend).
      </p>
      <NotificationSettings />
    </div>
  );
}
