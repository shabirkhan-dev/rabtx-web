import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/hero";
import { ArrowIcon, GithubIcon } from "@/components/icons";
import { ProductLogo } from "@/components/product-logo";
import { ScreenshotCarousel } from "@/components/screenshot-carousel";
import { PostList } from "@/components/post-list";
import { getPosts } from "@/lib/posts";
import { getProduct, PRODUCTS, STATUS_TONE } from "@/lib/products";
import { breadcrumbs, JsonLd, ORGANIZATION_ID } from "@/lib/schema";
import { SITE_URL } from "@/lib/site";

const h2 = "text-2xl font-semibold tracking-[-0.03em]";

const pill =
	"inline-flex items-center justify-center gap-2 rounded-full py-2.5 pl-4 pr-3.5 text-sm font-semibold transition-opacity hover:opacity-85";

export function generateStaticParams() {
	return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/products/[slug]">): Promise<Metadata> {
	const { slug } = await props.params;
	const product = getProduct(slug);
	if (!product) return {};
	const title = `${product.name} — ${product.label} by RabtX`;
	const url = `/products/${product.slug}`;
	// Built from the product's first screenshot by scripts/og-images.mjs.
	const image = { url: `/og/${product.slug}.png`, width: 1200, height: 630, alt: `${product.name}, ${product.label.toLowerCase()} by RabtX` };
	return {
		title,
		description: product.desc,
		alternates: { canonical: url },
		openGraph: { title, description: product.desc, url, siteName: "RabtX", type: "website", images: image },
		twitter: { card: "summary_large_image", title, description: product.desc, images: image },
	};
}

export default async function ProductPage(props: PageProps<"/products/[slug]">) {
	const { slug } = await props.params;
	const product = getProduct(slug);
	if (!product) notFound();

	const url = `${SITE_URL}/products/${product.slug}`;
	// A product with its own site (grid.rabtx.dev) is that site; this page is the studio's write-up of it.
	const ownSite = product.live?.includes("rabtx.dev") ? product.live : undefined;
	const app = {
		"@type": "SoftwareApplication",
		name: product.name,
		description: product.desc,
		applicationCategory: product.category,
		operatingSystem: "Web",
		url: ownSite ?? url,
		mainEntityOfPage: url,
		image: `${SITE_URL}/og/${product.slug}.png`,
		publisher: { "@id": ORGANIZATION_ID },
		sameAs: [product.live, product.github].filter(Boolean),
	};
	const trail = breadcrumbs([
		["Home", "/"],
		["Products", "/products"],
		[product.name, `/products/${product.slug}`],
	]);
	const posts = (await getPosts()).filter((post) => product.posts.includes(post.slug));
	const others = PRODUCTS.filter((p) => p.slug !== product.slug);

	return (
		<>
			<Nav />
			<main className="mx-auto max-w-[760px] px-4 pb-24 pt-[120px] sm:pt-[150px]">
				<JsonLd nodes={[app, trail]} />
				<Link href="/products" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink">
					<svg viewBox="0 0 16 16" aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
						<path strokeLinecap="round" strokeLinejoin="round" d="M10 3.5L5.5 8l4.5 4.5" />
					</svg>
					All products
				</Link>
				<article className="mt-10">
					<header className="flex flex-col gap-4">
						<div className="flex items-center gap-3">
							<ProductLogo name={product.name} className="size-9" />
							<div>
								<h1 className="text-[32px] font-bold leading-[1.1] tracking-[-0.035em] sm:text-[44px]">{product.name}</h1>
								<p className="text-[15px] text-muted">{product.label}</p>
							</div>
						</div>
						<span
							className={`inline-flex w-fit items-center gap-1.5 rounded-full py-1 pl-2 pr-2.5 text-xs font-medium ${STATUS_TONE[product.status.tone]}`}
						>
							<span className="size-1.5 rounded-full bg-current" />
							{product.status.label}
						</span>
						<p className="text-lg leading-7 text-muted">{product.desc}</p>
						{(product.github || product.live) && (
							<div className="flex flex-wrap gap-2">
								{product.live && (
									<a href={product.live} target="_blank" rel="noreferrer" className={`${pill} bg-ink text-inv`}>
										{ownSite ? `Visit ${new URL(ownSite).host}` : "Live demo"}
										<ArrowIcon />
									</a>
								)}
								{product.github && (
									<a
										href={product.github}
										target="_blank"
										rel="noreferrer"
										className={`${pill} ${product.live ? "border border-line" : "bg-ink text-inv"}`}
									>
										<GithubIcon />
										View on GitHub
										<ArrowIcon />
									</a>
								)}
							</div>
						)}
					</header>

					<div className="mt-10">
						<ScreenshotCarousel images={product.screens} alt={product.name} />
					</div>

					<section className="mt-14">
						<h2 className={h2}>Why we built it</h2>
						<p className="mt-4 text-[17px] leading-7 text-muted">{product.why}</p>
					</section>

					<section className="mt-14">
						<h2 className={h2}>What it does</h2>
						<ul className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2">
							{product.features.map(([title, line]) => (
								<li key={title}>
									<h3 className="text-[15px] font-semibold">{title}</h3>
									<p className="mt-1 text-[15px] leading-[23px] text-muted">{line}</p>
								</li>
							))}
						</ul>
					</section>

					<section className="mt-14">
						<h2 className={h2}>How it&rsquo;s built</h2>
						<div className="mt-4 flex flex-col gap-4 text-[17px] leading-7 text-muted">
							{product.built.map((paragraph) => (
								<p key={paragraph}>{paragraph}</p>
							))}
						</div>
						<dl className="mt-8 flex flex-col text-sm">
							{product.facts.map(([label, value]) => (
								<div key={label} className="flex gap-4 border-t border-line py-3 last:border-b">
									<dt className="w-24 shrink-0 text-subtle">{label}</dt>
									<dd>{value}</dd>
								</div>
							))}
						</dl>
					</section>

					{ownSite && (
						<aside className="mt-14 rounded-[20px] border border-line bg-surface p-6">
							<p className="text-[15px] leading-6 text-muted">
								{product.name} has its own site with the install guide, docs and changelog.
							</p>
							<a href={ownSite} className={`${pill} mt-4 bg-ink text-inv`}>
								Go to {new URL(ownSite).host}
								<ArrowIcon />
							</a>
						</aside>
					)}

					{posts.length > 0 && (
						<section className="mt-14">
							<h2 className={h2}>Related writing</h2>
							<PostList posts={posts} className="mt-4" />
						</section>
					)}

					<nav aria-label="More products" className="mt-14">
						<h2 className={h2}>More from RabtX</h2>
						<ul className="mt-4 flex flex-col">
							{others.map((p) => (
								<li key={p.slug} className="border-t border-line last:border-b">
									<Link href={`/products/${p.slug}`} className="flex items-center gap-3 py-4 hover:text-accent-ink">
										<ProductLogo name={p.name} className="size-5" />
										<span className="font-semibold">{p.name}</span>
										<span className="text-sm text-muted">{p.label}</span>
									</Link>
								</li>
							))}
						</ul>
					</nav>
				</article>
			</main>
			<Footer />
		</>
	);
}
