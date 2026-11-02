import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/hero";
import { PostList } from "@/components/post-list";
import { getPosts } from "@/lib/posts";
import { breadcrumbs, JsonLd } from "@/lib/schema";
import { SHARE_IMAGE } from "@/lib/share-image";

const TITLE = "Writing — RabtX";
const DESCRIPTION =
	"Notes from building RabtX products: multi-tenant systems, frontend performance under real traffic, and shipping that stays boring.";

export const metadata: Metadata = {
	title: TITLE,
	description: DESCRIPTION,
	alternates: { canonical: "/writing" },
	openGraph: { title: TITLE, description: DESCRIPTION, url: "/writing", siteName: "RabtX", type: "website", images: SHARE_IMAGE },
	twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: SHARE_IMAGE },
};

export default async function WritingPage() {
	const posts = await getPosts();
	const trail = breadcrumbs([
		["Home", "/"],
		["Writing", "/writing"],
	]);

	return (
		<>
			<Nav />
			<main className="mx-auto max-w-[880px] px-4 pb-24 pt-[120px] sm:pt-[150px]">
				<JsonLd nodes={[trail]} />
				<h1 className="text-[32px] font-bold leading-[1.1] tracking-[-0.035em] sm:text-[44px]">Writing</h1>
				<p className="mt-4 max-w-[560px] text-lg leading-7 text-muted">
					Notes from building our products: what worked, what broke and what we&rsquo;d do again.
				</p>
				<PostList posts={posts} className="mt-12" />
			</main>
			<Footer />
		</>
	);
}
