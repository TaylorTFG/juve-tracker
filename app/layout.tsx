import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "Juve Tracker",
  description: "Segui Juventus: rosa, partite, live, notifiche e news"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <header className="border-b border-black/10 bg-juventus-black text-white">
          <div className="container-main flex items-center justify-between py-4">
            <Link href="/" className="text-xl font-bold">
              Juve Tracker
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/squad">Rosa</Link>
              <Link href="/matches">Partite</Link>
              <Link href="/news">News</Link>
              <Link href="/settings/notifications">Notifiche</Link>
            </nav>
          </div>
        </header>
        <main className="container-main">{children}</main>
      </body>
    </html>
  );
}

