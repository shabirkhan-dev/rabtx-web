import type { ReactNode } from "react";

type PillProps = {
	href: string;
	children: ReactNode;
	variant?: "primary" | "secondary";
	size?: "lg" | "sm";
};

/** The rounded pill used for every button on the page. */
export function Pill({ href, children, variant = "primary", size = "lg" }: PillProps) {
	const tone = variant === "primary" ? "bg-ink text-inv" : "bg-surface/85 text-ink backdrop-blur-md";
	const scale = size === "lg" ? "h-[54px] px-6 text-base" : "h-[42px] px-3.5 text-[13px] sm:px-4";
	return (
		<a
			href={href}
			{...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
			className={`inline-flex items-center justify-center whitespace-nowrap rounded-full font-semibold tracking-[-0.01em] transition-opacity hover:opacity-85 ${tone} ${scale}`}
		>
			{children}
		</a>
	);
}

/** Small label pill above a section title. */
export function Chip({ children, mono = false }: { children: ReactNode; mono?: boolean }) {
	return (
		<span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5">
			{!mono && <span className="text-[11px] text-accent-ink">✦</span>}
			<span
				className={
					mono
						? "font-mono text-[11px] font-medium tracking-[0.12em] text-ink/75"
						: "text-xs font-medium text-ink/75"
				}
			>
				{children}
			</span>
		</span>
	);
}

/** Centered chip, title and sub-line that open a section. */
export function SectionHeader({
	chip,
	title,
	sub,
	monoChip = false,
}: {
	chip: string;
	title: string;
	sub?: string;
	monoChip?: boolean;
}) {
	return (
		<div className="flex flex-col items-center px-4 text-center">
			<Chip mono={monoChip}>{chip}</Chip>
			<h2 className="mt-4 text-[32px] font-medium leading-[1.15] tracking-[-0.03em] sm:text-[40px]">
				{title}
			</h2>
			{sub && <p className="mt-3.5 max-w-md text-[15px] leading-[22px] text-muted">{sub}</p>}
		</div>
	);
}
