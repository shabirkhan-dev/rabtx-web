import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { cacheLife } from "next/cache";

const CONTENT_DIR = path.join(process.cwd(), "content", "writing");

export type Post = {
	slug: string;
	title: string;
	excerpt: string;
	standfirst: string;
	publishedAt: string;
	readingTime: string;
	body: string;
};

type Frontmatter = {
	title?: string;
	slug?: string;
	excerpt?: string;
	standfirst?: string;
	order?: number;
	publishedAt?: string | Date;
};

function readingTime(markdown: string) {
	const words = markdown.replace(/```[\s\S]*?```/g, " ").split(/\s+/).filter(Boolean).length;
	return `${Math.max(1, Math.round(words / 200))} min read`;
}

function toPost(filename: string, raw: string) {
	const { data, content } = matter(raw);
	const fm = data as Frontmatter;
	const body = content.trim();
	if (!fm.title || !body) throw new Error(`Post ${filename} needs a title and a body`);
	const post: Post = {
		slug: fm.slug ?? filename.replace(/\.md$/, ""),
		title: fm.title,
		excerpt: fm.excerpt ?? "",
		standfirst: fm.standfirst ?? fm.excerpt ?? "",
		publishedAt: (fm.publishedAt ? new Date(fm.publishedAt) : new Date(0)).toISOString(),
		readingTime: readingTime(body),
		body,
	};
	return { post, order: fm.order ?? Number.MAX_SAFE_INTEGER };
}

/** Posts in their frontmatter `order`, then newest first. They are files in the repo, so cache them for good. */
export async function getPosts(): Promise<Post[]> {
	"use cache";
	cacheLife("max");
	const files = (await fs.readdir(CONTENT_DIR)).filter((f) => f.endsWith(".md"));
	const entries = await Promise.all(
		files.map(async (f) => toPost(f, await fs.readFile(path.join(CONTENT_DIR, f), "utf8"))),
	);
	return entries
		.sort((a, b) => a.order - b.order || b.post.publishedAt.localeCompare(a.post.publishedAt))
		.map((e) => e.post);
}

export async function getPost(slug: string) {
	return (await getPosts()).find((p) => p.slug === slug) ?? null;
}

export function formatPostDate(iso: string) {
	return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
