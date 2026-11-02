import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const components: Components = {
	h2: ({ children }) => <h2 className="mt-4 text-xl font-semibold tracking-[-0.02em] text-ink">{children}</h2>,
	h3: ({ children }) => <h3 className="text-base font-semibold text-ink">{children}</h3>,
	a: ({ href, children }) => (
		<a href={href} className="text-ink underline underline-offset-2">
			{children}
		</a>
	),
	strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
	ul: ({ children }) => <ul className="flex list-disc flex-col gap-2 pl-5">{children}</ul>,
	ol: ({ children }) => <ol className="flex list-decimal flex-col gap-2 pl-5">{children}</ol>,
	blockquote: ({ children }) => (
		<blockquote className="flex flex-col gap-5 border-l-2 border-line pl-4">{children}</blockquote>
	),
	pre: ({ children }) => (
		<pre className="overflow-x-auto rounded-xl border border-line bg-surface p-4 font-mono text-[13px] leading-6 text-ink [&_code]:border-0 [&_code]:bg-transparent [&_code]:p-0">
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
};

/** Drops the old site's custom markers (`::lead`, `> [!NOTE]`) so posts read as plain prose. */
function clean(markdown: string) {
	return markdown.replace(/^::lead\s+/gm, "").replace(/^>\s*\[![A-Z]+\]\s*\n/gm, "");
}

export function PostBody({ markdown }: { markdown: string }) {
	return (
		<div className="flex flex-col gap-5 text-[17px] leading-[30px] text-muted">
			<ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
				{clean(markdown)}
			</ReactMarkdown>
		</div>
	);
}
