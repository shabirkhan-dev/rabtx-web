import type { MetadataRoute } from "next";
import { siteUrl } from "@/data/profile";
import { getPosts } from "@/data/posts";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPosts();
  return [
    { url: `${siteUrl}/`, changeFrequency: "monthly", priority: 1 },
    ...posts.map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      priority: 0.6,
    })),
  ];
}
