import Image from "next/image";

export type ProductName = "Grid" | "School OS" | "Starter";

/** Real marks for Grid and School OS (the Grid mark is drawn from /logos/grid-ink.svg and grid-blue.svg); Starter has no logo yet, so it uses a simple layers glyph. */
export function ProductLogo({ name, className = "size-5" }: { name: ProductName; className?: string }) {
	if (name === "Grid") {
		// Two masked layers so the grey part follows the page theme, not the OS setting.
		return (
			<span aria-hidden className={`relative inline-block shrink-0 text-ink ${className}`}>
				<span className="grid-ink" />
				<span className="grid-blue" />
			</span>
		);
	}
	if (name === "School OS") {
		return (
			<Image src="/logos/school-os-mark.png" alt="" width={64} height={64} className={`rounded-[22%] ${className}`} />
		);
	}
	return (
		<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className={className}>
			<path d="M10 1.5L18.5 6L10 10.5L1.5 6Z" />
			<path d="M1.5 9.5L10 14L18.5 9.5V12.5L10 17L1.5 12.5Z" />
		</svg>
	);
}
