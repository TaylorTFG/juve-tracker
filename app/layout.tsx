import Link from "next/link";
import { Bebas_Neue, Manrope } from "next/font/google";
import { MainNav } from "@/components/MainNav";
import "./globals.css";

const headingFont = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-heading" });
const bodyFont = Manrope({ subsets: ["latin"], variable: "--font-body" });

export const metadata = {
  title: "Juve Tracker",
  description: "Segui Juventus: rosa, partite, live, notifiche e news"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className={`${headingFont.variable} ${bodyFont.variable}`}>
        <header className="site-header">
          <div className="container-main flex items-center justify-between py-4">
            <Link href="/" className="brand-wrap">
              <span className="brand-badge">J</span>
              <span>
                <strong className="brand-title">Juve Tracker</strong>
                <small className="brand-sub">Fino alla fine</small>
              </span>
            </Link>
            <MainNav />
          </div>
        </header>
        <main className="container-main pb-12">{children}</main>
      </body>
    </html>
  );
}