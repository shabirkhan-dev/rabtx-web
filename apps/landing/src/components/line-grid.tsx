import type { ReactNode } from "react";

/**
 * The open grid from the reference: hairlines that run past the edges with small square
 * markers where they cross. Columns appear from `md` (2 columns) or `lg` (3 columns);
 * below that, cells stack and are separated by a bottom rule.
 */
const LAYOUT = {
	2: { grid: "md:grid-cols-2", show: "md:block", flat: "md:border-b-0" },
	3: { grid: "lg:grid-cols-3", show: "lg:block", flat: "lg:border-b-0" },
} as const;

export function LineGrid({ cols, rows, children }: { cols: 2 | 3; rows: number; children: ReactNode }) {
	const l = LAYOUT[cols];
	const xs = Array.from({ length: cols + 1 }, (_, i) => (i / cols) * 100);
	const ys = Array.from({ length: rows + 1 }, (_, i) => (i / rows) * 100);
	return (
		<div className="relative mx-4 max-w-[1280px] border-t border-line sm:mx-20 xl:mx-auto">
			{xs.map((x) => (
				<span key={`v${x}`} className={`absolute -inset-y-10 hidden w-px bg-line ${l.show}`} style={{ left: `${x}%` }} />
			))}
			{ys.map((y) => (
				<span key={`h${y}`} className={`absolute -inset-x-10 hidden h-px bg-line ${l.show}`} style={{ top: `${y}%` }} />
			))}
			{xs.flatMap((x) =>
				ys.map((y) => (
					<span
						key={`m${x}-${y}`}
						className={`absolute hidden size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-[2px] border border-line bg-bg ${l.show}`}
						style={{ left: `${x}%`, top: `${y}%` }}
					/>
				)),
			)}
			<div className={`grid ${l.grid}`}>
				{Array.isArray(children)
					? children.map((c, i) => (
							<div key={i} className={`border-b border-line ${l.flat}`}>
								{c}
							</div>
						))
					: children}
			</div>
		</div>
	);
}

/** One grid cell: a drawing on top, then a small caps title and a sentence. */
export function Cell({ title, desc, children }: { title: string; desc: string; children: ReactNode }) {
	return (
		<div className="flex h-full flex-col items-center px-6 pb-11 pt-10 text-center">
			<div className="relative h-[220px] w-full max-w-[360px]">{children}</div>
			<h3 className="mt-6 text-[13px] font-semibold tracking-[0.05em]">{title}</h3>
			<p className="mt-2.5 max-w-[440px] text-[15px] leading-[23px] text-muted">{desc}</p>
		</div>
	);
}
