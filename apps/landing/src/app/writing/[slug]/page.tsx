import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/hero";
import { PostBody } from "@/components/post-body";
import { PostList } from "@/components/post-list";
import { ProductLogo } from "@/components/product-logo";
import { formatPostDate, getPost, getPosts } from "@/lib/posts";
import { PRODUCTS } from "@/lib/products";
import { breadcrumbs, FOUNDER_ID, JsonLd, ORGANIZATION_ID } from "@/lib/schema";
import { FOUNDER_LINKS, SITE_URL } from "@/lib/site";

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
		openGraph: {
			title: post.title,
			description: post.standfirst,
			type: "article",
			url: `/writing/${post.slug}`,
			siteName: "RabtX",
			publishedTime: post.publishedAt,
		},
		twitter: { card: "summary_large_image", title: post.title, description: post.standfirst },
	};
}

export default async function PostPage(props: PageProps<"/writing/[slug]">) {
	const { slug } = await props.params;
	const post = await getPost(slug);
	if (!post) notFound();

	const url = `${SITE_URL}/writing/${post.slug}`;
	const article = {
		"@type": "BlogPosting",
		headline: post.title,
		description: post.standfirst,
		datePublished: post.publishedAt,
		url,
		mainEntityOfPage: url,
		image: `${url}/opengraph-image`,
		author: { "@id": FOUNDER_ID },
		publisher: { "@id": ORGANIZATION_ID },
	};
	const trail = breadcrumbs([
		["Home", "/"],
		["Writing", "/writing"],
		[post.title, `/writing/${post.slug}`],
	]);
	const related = PRODUCTS.filter((p) => p.posts.includes(post.slug));
	const more = (await getPosts()).filter((p) => p.slug !== post.slug).slice(0, 2);

	return (
		<>
			<Nav />
			<main className="mx-auto max-w-[680px] px-4 pb-24 pt-[120px] sm:pt-[150px]">
				<Link href="/writing" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink">
					<svg viewBox="0 0 16 16" aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
						<path strokeLinecap="round" strokeLinejoin="round" d="M10 3.5L5.5 8l4.5 4.5" />
					</svg>
					All writing
				</Link>
				<JsonLd nodes={[article, trail]} />
				<article className="mt-10">
					<header>
						<p className="font-mono text-xs text-subtle">
							<time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time> · {post.readingTime} ·{" "}
							<Link href="/#about" rel="author" className="hover:text-ink">
								Shabir Khan
							</Link>
						</p>
						<h1 className="mt-4 text-[32px] font-bold leading-[1.1] tracking-[-0.035em] sm:text-[44px]">{post.title}</h1>
						<p className="mt-4 text-lg leading-7 text-muted">{post.standfirst}</p>
					</header>
					{post.cover && (
						<Image
							src={post.cover}
							alt=""
							width={1440}
							height={900}
							priority
							sizes="(min-width: 712px) 680px, 100vw"
							className="mt-10 aspect-[16/10] w-full rounded-[20px] border border-line object-cover object-left-top"
						/>
					)}
					<div className="pt-10">
						<PostBody markdown={post.body} />
					</div>
				</article>
				<footer className="mt-16 flex flex-col gap-10">
					{/* Who wrote it: a face and a role make a post more credible to readers and to search engines. */}
					<div className="flex items-center gap-4 rounded-[20px] border border-line bg-surface p-5">
						<Image src="/avatar.png" alt="" width={112} height={112} className="size-14 shrink-0 rounded-2xl object-cover" />
						<div className="min-w-0 flex-1">
							<p className="text-[15px] font-semibold">Shabir Khan</p>
							<p className="text-sm text-muted">Founder and lead engineer at RabtX</p>
						</div>
						<a
							href={FOUNDER_LINKS.linkedin}
							target="_blank"
							rel="noreferrer author"
							className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-75"
						>
							LinkedIn
						</a>
					</div>

					{related.map((p) => (
						<Link
							key={p.slug}
							href={`/products/${p.slug}`}
							className="group flex items-start gap-4 rounded-[20px] border border-line p-5 transition-colors hover:border-ink/20"
						>
							<ProductLogo name={p.name} className="mt-0.5 size-7" />
							<span className="flex-1">
								<span className="block text-xs font-medium text-subtle">Built with this</span>
								<span className="mt-1 block text-[17px] font-semibold group-hover:text-accent-ink">{p.name}</span>
								<span className="mt-1 block text-[15px] leading-[23px] text-muted">{p.desc}</span>
							</span>
						</Link>
					))}

					{more.length > 0 && (
						<section>
							<h2 className="text-sm font-semibold text-subtle">Keep reading</h2>
							<PostList posts={more} className="mt-3" />
						</section>
					)}
				</footer>
			</main>
			<Footer />
		</>
	);
}
