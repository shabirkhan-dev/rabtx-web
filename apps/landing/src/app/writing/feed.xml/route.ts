import { getPosts } from "@/lib/posts";
import { SITE_URL } from "@/lib/site";

/** Escapes text for XML element content and attributes. */
function xml(text: string) {
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * RSS 2.0 feed of every post, newest first. Shabir's portfolio reads it to list the posts, so
 * they are written once, here, and linked from both sites.
 */
export async function GET() {
	const posts = await getPosts();
	const items = posts
		.map((post) => {
			const url = `${SITE_URL}/writing/${post.slug}`;
			return `
		<item>
			<title>${xml(post.title)}</title>
			<link>${url}</link>
			<guid isPermaLink="true">${url}</guid>
			<pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
			<description>${xml(post.standfirst || post.excerpt)}</description>
			<author>shabir@rabtx.dev (Shabir Khan)</author>${
				post.cover ? `\n\t\t\t<media:content url="${SITE_URL}${post.cover}" medium="image" type="image/jpeg" />` : ""
			}
		</item>`;
		})
		.join("");

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
	<channel>
		<title>RabtX — Writing</title>
		<link>${SITE_URL}/writing</link>
		<atom:link href="${SITE_URL}/writing/feed.xml" rel="self" type="application/rss+xml" />
		<description>Notes from building RabtX products, by Shabir Khan.</description>
		<language>en</language>
		<lastBuildDate>${posts[0] ? new Date(posts[0].publishedAt).toUTCString() : ""}</lastBuildDate>${items}
	</channel>
</rss>
`;

	return new Response(body, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
