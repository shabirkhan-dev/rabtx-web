import Image from "next/image";
import { FOUNDER_LINKS } from "@/lib/site";
import { SectionHeader } from "./ui";

const LINKS = [
	["LinkedIn", FOUNDER_LINKS.linkedin],
	["GitHub", FOUNDER_LINKS.github],
];

const FACTS = [
	["Experience", "8+ years, TypeScript first"],
	["Before RabtX", "Led the rebuild of BullseyeEngagement, an HR platform used by PepsiCo, Intel and Emory"],
	["Based in", "Islamabad, working with teams remotely"],
];

/** Who runs the studio. Every fact here comes from Shabir's CV. */
export function Founder() {
	return (
		<section id="about" className="scroll-mt-24 px-4 pt-28 sm:px-20">
			<SectionHeader chip="Who’s behind RabtX" title="Who you’ll work with." />
			<div className="mx-auto mt-16 grid max-w-[880px] gap-10 rounded-[20px] border border-line bg-surface p-6 sm:p-10 md:grid-cols-[200px_1fr] md:gap-12">
				<div className="flex flex-col items-start gap-4">
					<Image
						src="/avatar.png"
						alt="Shabir Khan"
						width={224}
						height={224}
						className="size-24 rounded-2xl object-cover md:size-[120px]"
					/>
					<div>
						<p className="text-lg font-semibold tracking-[-0.02em]">Shabir Khan</p>
						<p className="text-sm text-muted">Founder and lead engineer</p>
					</div>
					<div className="flex gap-2">
						{LINKS.map(([label, href]) => (
							<a
								key={label}
								href={href}
								target="_blank"
								rel="noreferrer"
								className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-75"
							>
								{label}
							</a>
						))}
					</div>
				</div>
				<div>
					<p className="text-[17px] leading-[28px] text-muted">
						RabtX is run by Shabir Khan, a senior full-stack engineer. He designs and builds every RabtX product
						himself, works with AI agents for the repetitive parts, and reviews every change before it ships.
					</p>
					<dl className="mt-8 border-t border-line">
						{FACTS.map(([label, value]) => (
							<div key={label} className="grid gap-1 border-b border-line py-3.5 sm:grid-cols-[140px_1fr] sm:gap-6">
								<dt className="text-sm text-subtle">{label}</dt>
								<dd className="text-[15px]">{value}</dd>
							</div>
						))}
					</dl>
				</div>
			</div>
		</section>
	);
}
