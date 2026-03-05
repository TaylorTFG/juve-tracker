import { NotificationSettings } from "@/components/NotificationSettings";

export default function NotificationsPage() {
  return (
    <div className="space-y-4 pt-6">
      <h1 className="text-5xl leading-none">Notifiche</h1>
      <p className="text-sm muted">Ricevi avvisi al mattino quando gioca la Juve e aggiornamenti matchday.</p>
      <NotificationSettings />
    </div>
  );
}