import type { MetadataRoute } from "next";
import { siteUrl } from "@/data/profile";

// Posts live on rabtx.dev and are listed in its sitemap, not this one.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${siteUrl}/`, changeFrequency: "monthly", priority: 1 }];
}
