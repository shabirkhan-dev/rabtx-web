import Link from "next/link";
import { formatPostDate, getPosts } from "@/lib/posts";
import { SectionHeader } from "./ui";

/** The latest posts as plain rows: date, title and one line, each opening the full post. */
export async function Writing() {
	const posts = (await getPosts()).slice(0, 3);
	return (
		<section id="writing" className="scroll-mt-24 px-4 pt-28 sm:px-20">
			<SectionHeader chip="Writing" title="Notes from building." />
			<ul className="mx-auto mt-16 max-w-[880px] border-t border-line">
				{posts.map((post) => (
					<li key={post.slug} className="border-b border-line">
						<Link
							href={`/writing/${post.slug}`}
							className="group grid gap-2 py-7 sm:grid-cols-[140px_1fr_24px] sm:items-baseline sm:gap-8"
						>
							<time dateTime={post.publishedAt} className="font-mono text-xs text-subtle">
								{formatPostDate(post.publishedAt)}
							</time>
							<span>
								<span className="block text-xl font-semibold tracking-[-0.03em] transition-colors group-hover:text-accent-ink">
									{post.title}
								</span>
								<span className="mt-1.5 block text-[15px] leading-[23px] text-muted">{post.excerpt}</span>
							</span>
							<svg
								viewBox="0 0 16 16"
								aria-hidden
								className="hidden size-4 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 sm:block"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.5"
							>
								<path strokeLinecap="round" strokeLinejoin="round" d="M5 11L11 5M6 5h5v5" />
							</svg>
						</Link>
					</li>
				))}
			</ul>
		</section>
	);
}
