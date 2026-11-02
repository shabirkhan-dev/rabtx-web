import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const components: Components = {
	h2: ({ children }) => <h2 className="mt-6 text-[22px] font-semibold leading-tight tracking-[-0.025em] text-ink">{children}</h2>,
	h3: ({ children }) => <h3 className="mt-2 text-lg font-semibold text-ink">{children}</h3>,
	a: ({ href, children }) => (
		<a href={href} className="font-medium text-ink underline decoration-ink/30 underline-offset-[3px] hover:decoration-ink">
			{children}
		</a>
	),
	strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
	ul: ({ children }) => <ul className="flex list-disc flex-col gap-2.5 pl-5 marker:text-subtle">{children}</ul>,
	ol: ({ children }) => <ol className="flex list-decimal flex-col gap-2.5 pl-5 marker:text-subtle">{children}</ol>,
	blockquote: ({ children }) => (
		<blockquote className="flex flex-col gap-5 border-l-2 border-accent-ink/50 pl-5 text-ink/75">{children}</blockquote>
	),
	pre: ({ children }) => (
		<pre className="my-1 overflow-x-auto rounded-xl border border-line bg-surface p-4 font-mono text-[13px] leading-6 sm:p-5 text-ink [&_code]:border-0 [&_code]:bg-transparent [&_code]:p-0">
			{children}
		</pre>
	),
	code: ({ children }) => (
		<code className="rounded-[5px] border border-line bg-surface px-1 py-0.5 font-mono text-[13px] text-ink">
			{children}
		</code>
	),
	table: ({ children }) => (
		<div className="overflow-x-auto">
			<table className="w-full text-left text-sm">{children}</table>
		</div>
	),
	th: ({ children }) => <th className="border-b border-line py-2 pr-4 font-semibold text-ink">{children}</th>,
	td: ({ children }) => <td className="border-b border-line py-2 pr-4">{children}</td>,
	hr: () => <hr className="border-line" />,
	// Markdown wraps an image in a paragraph, so the frame and caption are spans laid out as blocks.
	// `![alt](src "caption")`: the title becomes the caption under the screenshot.
	img: ({ src, alt, title }) => (
		<span className="my-2 block">
			{/* eslint-disable-next-line @next/next/no-img-element -- Markdown images have no known size for next/image */}
			<img
				src={typeof src === "string" ? src : undefined}
				alt={alt ?? ""}
				loading="lazy"
				decoding="async"
				className="block h-auto w-full rounded-[20px] border border-line"
			/>
			{title && <span className="mt-3 block text-sm leading-6 text-subtle">{title}</span>}
		</span>
	),
};

/** Drops the old site's custom markers (`::lead`, `> [!NOTE]`) so posts read as plain prose. */
function clean(markdown: string) {
	return markdown.replace(/^::lead\s+/gm, "").replace(/^>\s*\[![A-Z]+\]\s*\n/gm, "");
}

export function PostBody({ markdown }: { markdown: string }) {
	return (
		<div className="flex flex-col gap-6 text-[17px] leading-[30px] text-ink/80">
			<ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
				{clean(markdown)}
			</ReactMarkdown>
		</div>
	);
}
