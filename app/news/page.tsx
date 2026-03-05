import Link from "next/link";
import { getJuveNews } from "@/lib/rss";

export default async function NewsPage() {
  const news = await getJuveNews(40);

  return (
    <div className="space-y-4 pt-6">
      <h1 className="text-5xl leading-none">News</h1>
      {news.length ? (
        <div className="grid gap-3">
          {news.map((item) => (
            <article key={item.link} className="card">
              <p className="text-xs muted">{item.source}</p>
              <h2 className="mt-1 text-base font-semibold">
                <Link href={item.link} target="_blank" rel="noreferrer" className="underline">
                  {item.title}
                </Link>
              </h2>
              <p className="mt-1 text-sm muted">{item.pubDate ?? "Data non disponibile"}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="card muted">Nessuna news disponibile dai feed configurati.</p>
      )}
    </div>
  );
}