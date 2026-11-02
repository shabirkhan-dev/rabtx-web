import Image from "next/image";
import Link from "next/link";
import { formatPostDate, type Post } from "@/lib/posts";

/** Posts as rows: cover, date, title and one line, each opening the full post. */
export function PostList({ posts, className = "" }: { posts: Post[]; className?: string }) {
	return (
		<ul className={`border-t border-line ${className}`}>
			{posts.map((post) => (
				<li key={post.slug} className="border-b border-line">
					<Link href={`/writing/${post.slug}`} className="group flex items-start gap-4 py-6 sm:gap-6 sm:py-7">
						<span className="relative aspect-[16/10] w-[104px] shrink-0 overflow-hidden rounded-xl border border-line bg-surface-2 sm:w-[184px]">
							{post.cover && (
								<Image
									src={post.cover}
									alt=""
									fill
									sizes="(min-width: 640px) 184px, 104px"
									className="object-cover object-left-top transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
								/>
							)}
						</span>
						<span className="min-w-0 flex-1">
							<time dateTime={post.publishedAt} className="font-mono text-xs text-subtle">
								{formatPostDate(post.publishedAt)}
							</time>
							<span className="mt-1.5 block text-[17px] font-semibold leading-snug tracking-[-0.02em] transition-colors group-hover:text-accent-ink sm:text-xl">
								{post.title}
							</span>
							<span className="mt-1.5 line-clamp-2 block text-[15px] leading-[23px] text-muted">{post.excerpt}</span>
						</span>
					</Link>
				</li>
			))}
		</ul>
	);
}
