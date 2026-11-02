import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/posts";
import { PRODUCTS } from "@/lib/products";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const posts = await getPosts();
	const products = PRODUCTS.map((p) => ({
		url: `https://rabtx.dev/products/${p.slug}`,
		lastModified: p.updatedAt,
		changeFrequency: "monthly" as const,
		priority: 0.8,
	}));
	const articles = posts.map((post) => ({
		url: `https://rabtx.dev/writing/${post.slug}`,
		lastModified: post.publishedAt,
		changeFrequency: "yearly" as const,
		priority: 0.6,
	}));
	// The home page shows every product and post, so it changed when the newest of them did.
	const homeModified = [...products, ...articles].map((e) => new Date(e.lastModified)).reduce((a, b) => (a > b ? a : b));
	const newestPost = articles.map((e) => e.lastModified).reduce((a, b) => (a > b ? a : b));
	const newestProduct = products.map((e) => e.lastModified).reduce((a, b) => (a > b ? a : b));
	return [
		{ url: "https://rabtx.dev/", lastModified: homeModified, changeFrequency: "monthly", priority: 1 },
		{ url: "https://rabtx.dev/products", lastModified: newestProduct, changeFrequency: "monthly", priority: 0.9 },
		...products,
		{ url: "https://rabtx.dev/writing", lastModified: newestPost, changeFrequency: "monthly", priority: 0.7 },
		{ url: "https://rabtx.dev/contact", changeFrequency: "yearly", priority: 0.5 },
		...articles,
	];
}
