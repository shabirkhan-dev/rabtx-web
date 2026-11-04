import type { MetadataRoute } from "next";
import { siteUrl } from "@/data/profile";
import { experiments } from "@/data/lab";

// Posts live on rabtx.dev and are listed in its sitemap, not this one.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${siteUrl}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl}/lab`, changeFrequency: "monthly", priority: 0.8 },
    ...experiments.map((e) => ({
      url: `${siteUrl}/lab/${e.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
