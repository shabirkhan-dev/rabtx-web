import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/posts";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const posts = await getPosts();
	return [
		{ url: "https://rabtx.dev/", changeFrequency: "monthly", priority: 1 },
		...posts.map((post) => ({
			url: `https://rabtx.dev/writing/${post.slug}`,
			lastModified: post.publishedAt,
			changeFrequency: "yearly" as const,
			priority: 0.6,
		})),
	];
}
