import "server-only";

/**
 * Posts are written once, on rabtx.dev, and this site lists them from its RSS feed. Each entry
 * links to the post there, so search engines see one original instead of two copies.
 * POSTS_FEED_URL points it at another feed, such as a local rabtx-landing server.
 */
export const FEED_URL = process.env.POSTS_FEED_URL ?? "https://rabtx.dev/writing/feed.xml";

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  url: string;
  thumbnail?: string;
};

/** Covers kept in public/writing for posts that have one; the rest get the plain tile. */
const THUMBNAILS: Record<string, string> = {
  "building-multi-tenant-admin-systems": "/writing/grid-board.png",
  "frontend-performance-under-real-traffic": "/writing/starter-site.png",
};

function tag(item: string, name: string) {
  const match = item.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return match ? unescape(match[1].trim()) : "";
}

function unescape(text: string) {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

/** Reads the feed's items. Exported for tests; the feed is our own, so a small parser is enough. */
export function parseFeed(xml: string): Post[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, item]) => {
    const url = tag(item, "link");
    const slug = url.split("/").filter(Boolean).pop() ?? url;
    return {
      slug,
      title: tag(item, "title"),
      excerpt: tag(item, "description"),
      publishedAt: new Date(tag(item, "pubDate")).toISOString(),
      url,
      thumbnail: THUMBNAILS[slug],
    };
  });
}

/** Newest first, refreshed daily. An unreachable feed hides the section rather than failing the build. */
export async function getPosts(): Promise<Post[]> {
  try {
    const res = await fetch(FEED_URL, { next: { revalidate: 86400 } });
    if (!res.ok) throw new Error(`feed returned ${res.status}`);
    return parseFeed(await res.text());
  } catch (error) {
    console.error(`Could not read ${FEED_URL}:`, error);
    return [];
  }
}
