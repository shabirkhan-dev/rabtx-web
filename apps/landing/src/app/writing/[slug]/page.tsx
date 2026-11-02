import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer, EMAIL } from "@/components/footer";
import { Nav } from "@/components/hero";
import { PostBody } from "@/components/post-body";
import { formatPostDate, getPost, getPosts } from "@/lib/posts";

export async function generateStaticParams() {
	return (await getPosts()).map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(props: PageProps<"/writing/[slug]">): Promise<Metadata> {
	const { slug } = await props.params;
	const post = await getPost(slug);
	if (!post) return {};
	return {
		title: `${post.title} — RabtX`,
		description: post.standfirst,
		alternates: { canonical: `/writing/${post.slug}` },
		openGraph: { title: post.title, description: post.standfirst, type: "article", url: `/writing/${post.slug}` },
	};
}

export default async function PostPage(props: PageProps<"/writing/[slug]">) {
	const { slug } = await props.params;
	const post = await getPost(slug);
	if (!post) notFound();

	return (
		<>
			<Nav />
			<main className="mx-auto max-w-[680px] px-4 pb-24 pt-[120px] sm:pt-[150px]">
				<Link href="/#writing" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink">
					<svg viewBox="0 0 16 16" aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
						<path strokeLinecap="round" strokeLinejoin="round" d="M10 3.5L5.5 8l4.5 4.5" />
					</svg>
					All writing
				</Link>
				<article className="mt-10">
					<header className="border-b border-line pb-10">
						<p className="font-mono text-xs text-subtle">
							<time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time> · {post.readingTime}
						</p>
						<h1 className="mt-4 text-[32px] font-bold leading-[1.1] tracking-[-0.035em] sm:text-[44px]">{post.title}</h1>
						<p className="mt-4 text-lg leading-7 text-muted">{post.standfirst}</p>
					</header>
					<div className="pt-10">
						<PostBody markdown={post.body} />
					</div>
				</article>
				<a
					href={`${EMAIL}?subject=${encodeURIComponent(post.title)}`}
					className="mt-12 inline-flex h-[42px] items-center rounded-full bg-ink px-5 text-sm font-semibold text-inv transition-opacity hover:opacity-85"
				>
					Talk to us about this
				</a>
			</main>
			<Footer />
		</>
	);
}
