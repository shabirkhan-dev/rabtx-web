import { AgentLogo } from "./agent-logos";
import { Cell, LineGrid } from "./line-grid";
import { LogoTile } from "./logo";
import { SectionHeader } from "./ui";

export function EveryLayer() {
	return (
		<section id="how" className="scroll-mt-24 pt-[70px]">
			<SectionHeader monoChip chip="HOW WE WORK" title="One team, from interface to infrastructure." />
			<div className="mt-20">
				<LineGrid cols={2} rows={2}>
					<Cell
						title="AI-NATIVE BY DEFAULT"
						desc="Model calls, agents and retrieval are part of the product from day one."
					>
						<AiLayers />
					</Cell>
					<Cell title="DESIGN AND CODE TOGETHER" desc="Figma and the code share one set of design tokens.">
						<Tokens />
					</Cell>
					<Cell
						title="BUILT WITH AI AGENTS"
						desc="We build with Claude Code, Codex, opencode and Antigravity, and don’t tie any product to one provider."
					>
						<AgentArc />
					</Cell>
					<Cell
						title="ONE CODEBASE, EVERY PLATFORM"
						desc="Web, mobile and API live in one monorepo and share types, UI and CI."
					>
						<Monorepo />
					</Cell>
				</LineGrid>
			</div>
		</section>
	);
}

const AI_LAYERS = [
	["interface", "next.js · expo"],
	["model", "claude · gpt"],
	["data", "postgres · vectors"],
];

/** Interface, model and data layers threaded by one AI line, with the model layer lit. */
function AiLayers() {
	return (
		<div className="absolute left-1/2 top-6 w-[300px] max-w-full -translate-x-1/2">
			<span className="absolute left-[23px] top-6 h-[136px] w-0.5 bg-blue" />
			<div className="flex flex-col gap-5">
				{AI_LAYERS.map(([name, meta]) => {
					const on = name === "model";
					return (
						<div
							key={name}
							className={`relative flex h-12 items-center justify-between rounded-xl px-4 font-mono ${
								on ? "border-[1.5px] border-blue bg-blue/10" : "border border-line bg-surface"
							}`}
						>
							<span className="flex items-center gap-3 text-[13px] font-medium">
								<span className={`size-2.5 rounded-full border-2 border-blue ${on ? "bg-blue" : "bg-surface"}`} />
								<span className={on ? "text-ink" : "text-ink/80"}>{name}</span>
							</span>
							<span className={`text-[11px] ${on ? "text-accent-ink" : "text-subtle"}`}>{meta}</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}

const TOKENS = ["export const tokens = {", "  radius: { control: 10 },", "  color: { accent: '#2D7CF6' },", "  space: [4, 8, 12, 16, 24],", "}"];

function Tokens() {
	return (
		<div className="absolute left-1/2 top-8 w-[320px] max-w-full -translate-x-1/2">
			<pre className="font-mono text-[13px] leading-[26px] text-code">
				{TOKENS.map((l, i) => (
					<div key={l} className="flex gap-3">
						<span className="w-3 text-subtle">{i + 1}</span>
						<span>
							{i === 2 ? (
								<>
									{"  color: { accent: "}
									<span className="text-accent-ink">&apos;#2D7CF6&apos;</span>
									{" },"}
								</>
							) : (
								l
							)}
						</span>
					</div>
				))}
			</pre>
			<CursorTag name="Shabir" className="right-0 top-[18px] bg-tag-blue" />
			<CursorTag name="Claude" className="right-2 top-[96px] bg-tag-claude" />
		</div>
	);
}

function CursorTag({ name, className }: { name: string; className: string }) {
	return (
		<span className={`absolute ${className} rounded-full px-2 py-0.5 text-[11px] font-semibold text-white`}>
			{name}
			<span className={`absolute -left-[3px] top-[20px] h-[18px] w-[1.5px] ${className.split(" ").at(-1)}`} />
		</span>
	);
}

function AgentArc() {
	return (
		<div className="absolute left-1/2 top-0 h-[220px] w-[340px] -translate-x-1/2">
			<svg viewBox="0 0 340 220" className="absolute inset-0 size-full" aria-hidden>
				<defs>
					<radialGradient id="arc-glow" cx="0.5" cy="1" r="0.6">
						<stop offset="0" stopColor="#2D7CF6" stopOpacity="0.28" />
						<stop offset="1" stopColor="#2D7CF6" stopOpacity="0" />
					</radialGradient>
				</defs>
				<path d="M0 220A170 170 0 0 1 340 220Z" fill="url(#arc-glow)" />
				<path d="M0 220A170 170 0 0 1 340 220" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeDasharray="3 4" />
			</svg>
			{(
				[
					["claude", 26, 160],
					["codex", 90, 90],
					["opencode", 250, 90],
					["antigravity", 314, 160],
				] as const
			).map(([id, x, y]) => (
				<span
					key={id}
					className="absolute grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-line bg-surface"
					style={{ left: x, top: y }}
				>
					<AgentLogo id={id} className="size-[22px]" />
				</span>
			))}
			<span className="absolute left-[170px] top-[58px] -translate-x-1/2 -translate-y-1/2">
				<LogoTile className="size-[52px] rounded-[16px]" />
			</span>
		</div>
	);
}

const TREE = [
	["apps/web", "next.js"],
	["apps/mobile", "expo"],
	["apps/api", "nestjs"],
	["packages/ui", "shared"],
];

/** One monorepo feeding web, mobile and API from a shared UI package. */
function Monorepo() {
	return (
		<div className="absolute left-1/2 top-4 w-[300px] max-w-full -translate-x-1/2 rounded-xl border border-line bg-surface p-4 text-left font-mono">
			<p className="flex items-center gap-2 text-[13px] font-medium">
				<span className="size-2.5 rounded-[3px] bg-blue" />
				product/
			</p>
			<ul className="mt-2 flex flex-col">
				{TREE.map(([path, tag], i) => (
					<li key={path} className="flex h-9 items-center justify-between text-[13px]">
						<span className="flex items-center gap-2 text-ink/80">
							<span className="text-subtle">{i === TREE.length - 1 ? "└" : "├"}</span>
							{path}
						</span>
						<span
							className={`rounded-md px-2 py-0.5 text-[11px] ${
								tag === "shared" ? "bg-blue/10 text-accent-ink" : "bg-surface-2 text-subtle"
							}`}
						>
							{tag}
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}
