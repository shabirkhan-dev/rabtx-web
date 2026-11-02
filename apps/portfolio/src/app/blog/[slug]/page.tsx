import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Undo2 } from "lucide-react";
import { links, profile, siteUrl } from "@/data/profile";
import { formatPostDate, getPost, getPosts } from "@/data/posts";
import { PageColumn } from "@/components/page-column";
import { PostBody } from "@/components/post-body";
import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getPosts()).map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(props: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.standfirst,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.standfirst,
      type: "article",
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt,
      authors: [profile.name],
    },
  };
}

export default async function PostPage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = await getPost(slug);
  if (!post) notFound();

  const talkHref = `${links.email}?subject=${encodeURIComponent(post.title)}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.standfirst,
    datePublished: post.publishedAt,
    url: `${siteUrl}/blog/${post.slug}`,
    image: `${siteUrl}/blog/${post.slug}/opengraph-image`,
    author: { "@type": "Person", name: profile.name, url: siteUrl },
  };

  return (
    <PageColumn>
      <script
        type="application/ld+json"
        // Escaped so a "<" in a title cannot end the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <nav className="flex items-center gap-2">
        <Link
          href="/#writing"
          className="flex flex-1 items-center gap-2 text-sm leading-5 tracking-[-0.0064em] text-muted transition-colors hover-capable:hover:text-foreground"
        >
          <Undo2 className="size-4" strokeWidth={1.5} />
          All writing
        </Link>
        <ThemeToggle />
      </nav>

      <div className="h-14 md:h-20" />

      <article>
        <header className="flex flex-col gap-3.5 border-b border-line pb-12">
          <p className="text-xs leading-4 tracking-[-0.0064em] text-muted">
            <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time> ·{" "}
            {post.readingTime}
          </p>
          <h1 className="text-[28px] leading-8 font-semibold tracking-[-0.03em] text-foreground md:text-[36px] md:leading-[42px]">
            {post.title}
          </h1>
          <p className="text-[17px] leading-7 tracking-[-0.0064em] text-muted">{post.standfirst}</p>
        </header>

        <div className="h-10" />

        <div className="border-b border-line pb-12">
          <PostBody markdown={post.body} />
        </div>
      </article>

      <div className="h-8" />

      <a
        href={talkHref}
        className="flex items-center gap-2.5 self-start rounded-full bg-foreground py-2.5 pr-3.5 pl-4 text-sm leading-5 font-medium tracking-[-0.0064em] text-background transition-opacity hover-capable:hover:opacity-85"
      >
        Talk about this
        <ArrowUpRight className="size-4" strokeWidth={1.5} />
      </a>

      <div className="h-16 md:h-[104px]" />

      <SiteFooter />
    </PageColumn>
  );
}
