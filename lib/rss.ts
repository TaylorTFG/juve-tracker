import Parser from "rss-parser";
import { juveKeywords, rssFeeds } from "@/config/rssFeeds";

type NewsItem = {
  title: string;
  link: string;
  pubDate?: string;
  source: string;
};

const parser = new Parser();

export async function getJuveNews(limit = 30): Promise<NewsItem[]> {
  const all: NewsItem[] = [];

  await Promise.all(
    rssFeeds.map(async (feedUrl) => {
      try {
        const feed = await parser.parseURL(feedUrl);
        for (const item of feed.items ?? []) {
          const title = item.title ?? "Senza titolo";
          const text = `${title} ${item.contentSnippet ?? ""}`.toLowerCase();
          if (!juveKeywords.some((k) => text.includes(k))) continue;

          if (item.link) {
            all.push({
              title,
              link: item.link,
              pubDate: item.pubDate,
              source: feed.title ?? feedUrl
            });
          }
        }
      } catch {
        // Ignore feed errors to keep partial news available.
      }
    })
  );

  const dedup = new Map<string, NewsItem>();
  for (const item of all) {
    dedup.set(item.link, item);
  }

  return Array.from(dedup.values())
    .sort((a, b) => new Date(b.pubDate ?? 0).getTime() - new Date(a.pubDate ?? 0).getTime())
    .slice(0, limit);
}
