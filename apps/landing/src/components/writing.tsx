import Link from "next/link";
import { getPosts } from "@/lib/posts";
import { PostList } from "./post-list";
import { SectionHeader } from "./ui";

/** The latest posts on the home page, with a link to the full list. */
export async function Writing() {
	const posts = await getPosts();
	return (
		<section id="writing" className="scroll-mt-24 px-4 pb-24 pt-28 sm:px-20 sm:pb-28">
			<SectionHeader chip="Writing" title="Notes from building." />
			<div className="mx-auto mt-16 max-w-[880px]">
				<PostList posts={posts.slice(0, 3)} />
				<div className="mt-10 flex justify-center">
					<Link
						href="/writing"
						className="inline-flex h-[42px] items-center gap-2 rounded-full bg-surface px-5 text-sm font-semibold transition-opacity hover:opacity-80"
					>
						See all writing
						<svg viewBox="0 0 16 16" aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
							<path strokeLinecap="round" strokeLinejoin="round" d="M3.5 8h9M9 4.5L12.5 8 9 11.5" />
						</svg>
					</Link>
				</div>
			</div>
		</section>
	);
}
