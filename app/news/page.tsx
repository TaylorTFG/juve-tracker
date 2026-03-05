import Link from "next/link";
import { getJuveNews } from "@/lib/rss";

export default async function NewsPage() {
  const news = await getJuveNews(40);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">News Juventus (RSS)</h1>
      {news.length ? (
        <div className="grid gap-3">
          {news.map((item) => (
            <article key={item.link} className="card">
              <p className="text-xs text-black/60">{item.source}</p>
              <h2 className="mt-1 text-base font-semibold">
                <Link href={item.link} target="_blank" rel="noreferrer" className="underline">
                  {item.title}
                </Link>
              </h2>
              <p className="mt-1 text-sm text-black/70">{item.pubDate ?? "Data non disponibile"}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="card">Nessuna news disponibile dai feed configurati.</p>
      )}
    </div>
  );
}

