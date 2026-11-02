import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/hero";
import { ProductLogo } from "@/components/product-logo";
import { PRODUCTS, STATUS_TONE } from "@/lib/products";
import { breadcrumbs, JsonLd } from "@/lib/schema";
import { SITE_URL } from "@/lib/site";
import { SHARE_IMAGE } from "@/lib/share-image";

const TITLE = "Products — RabtX";
const DESCRIPTION =
	"The AI-native products RabtX builds and runs: Grid, a workspace for people and coding agents; School OS, a school platform; and Starter, the monorepo they start from.";

export const metadata: Metadata = {
	title: TITLE,
	description: DESCRIPTION,
	alternates: { canonical: "/products" },
	openGraph: { title: TITLE, description: DESCRIPTION, url: "/products", siteName: "RabtX", type: "website", images: SHARE_IMAGE },
	twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: SHARE_IMAGE },
};

export default function ProductsPage() {
	const list = {
		"@type": "ItemList",
		itemListElement: PRODUCTS.map((p, i) => ({
			"@type": "ListItem",
			position: i + 1,
			url: `${SITE_URL}/products/${p.slug}`,
			name: p.name,
		})),
	};
	const trail = breadcrumbs([
		["Home", "/"],
		["Products", "/products"],
	]);

	return (
		<>
			<Nav />
			<main className="mx-auto max-w-[880px] px-4 pb-24 pt-[120px] sm:pt-[150px]">
				<JsonLd nodes={[list, trail]} />
				<h1 className="text-[32px] font-bold leading-[1.1] tracking-[-0.035em] sm:text-[44px]">Products</h1>
				<p className="mt-4 max-w-[560px] text-lg leading-7 text-muted">
					We build our own AI-native products and run them, from the interface to the model calls. Each one is open
					source.
				</p>
				<ul className="mt-12 flex flex-col gap-6">
					{PRODUCTS.map((p) => (
						<li key={p.slug}>
							<Link
								href={`/products/${p.slug}`}
								className="group grid overflow-hidden rounded-[20px] border border-line bg-surface transition-colors hover:border-ink/20 sm:grid-cols-[1fr_300px]"
							>
								<div className="flex flex-col gap-3 p-6">
									<h2 className="flex items-center gap-2.5 text-xl font-semibold tracking-[-0.03em]">
										<ProductLogo name={p.name} className="size-6" />
										{p.name}
										<span className="text-sm font-normal text-muted">{p.label}</span>
									</h2>
									<span
										className={`inline-flex w-fit items-center gap-1.5 rounded-full py-1 pl-2 pr-2.5 text-xs font-medium ${STATUS_TONE[p.status.tone]}`}
									>
										<span className="size-1.5 rounded-full bg-current" />
										{p.status.label}
									</span>
									<p className="text-[15px] leading-[23px] text-muted">{p.desc}</p>
									<p className="mt-auto pt-2 font-mono text-xs text-subtle">{p.stack}</p>
								</div>
								<div className="relative hidden overflow-hidden border-l border-line bg-surface-2 sm:block">
									<Image
										src={p.screens[0]}
										alt=""
										width={1440}
										height={900}
										sizes="300px"
										className="absolute left-5 top-5 w-[200%] max-w-none rounded-tl-lg border-l border-t border-line"
									/>
								</div>
							</Link>
						</li>
					))}
				</ul>
			</main>
			<Footer />
		</>
	);
}
