import { formatPostDate, getPost, getPosts } from "@/data/posts";
import { ogCard, ogSize } from "@/lib/og-card";

export const alt = "Blog post by Shabir Khan";
export const size = ogSize;
export const contentType = "image/png";

export async function generateStaticParams() {
  return (await getPosts()).map((post) => ({ slug: post.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  return ogCard({
    title: post?.title ?? "Writing",
    subtitle: post ? `${formatPostDate(post.publishedAt)} · ${post.readingTime}` : "",
  });
}
