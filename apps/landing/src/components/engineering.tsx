import { Cell, LineGrid } from "./line-grid";
import { LogoTile } from "./logo";
import { SectionHeader } from "./ui";

const TASKS = [
	{ title: "Design the onboarding flow", agent: "claude-code", dot: "bg-blue" },
	{ title: "Add tenant isolation tests", agent: "codex", dot: "bg-claude" },
	{ title: "Ship attendance export", agent: "opencode", dot: "bg-live" },
];

const LAYERS: [string, number, number][] = [
	["UI", 0, -72],
	["API", 63, -36],
	["DB", 63, 36],
	["AI", 0, 72],
	["CI", -63, 36],
	["OPS", -63, -36],
];

const STAGES = ["dev", "staging", "prod"];

// How far each product has reached. Only Starter is public in production today.
const PIPELINE = [
	{ name: "grid", reached: 2 },
	{ name: "school os", reached: 2 },
	{ name: "starter", reached: 3 },
];

export function Engineering() {
	return (
		<section id="ship" className="scroll-mt-24 pt-28">
			<SectionHeader
				monoChip
				chip="HOW WE SHIP"
				title="How we ship."
				sub="Agents write the code. We decide what to build and review every change."
			/>
			<div className="mt-20">
				<LineGrid cols={3} rows={1}>
					<Cell title="PLAN WITH AGENTS" desc="Tasks go on the board with context, so any agent can pick them up.">
						<div className="absolute left-1/2 top-3 flex w-[310px] max-w-full -translate-x-1/2 flex-col gap-2.5 rounded-xl border border-line bg-surface p-3 text-left">
							{TASKS.map((t) => (
								<div key={t.title} className="flex items-center gap-3 rounded-lg bg-surface-2 px-3 py-2">
									<span className={`size-2 shrink-0 rounded-full ${t.dot}`} />
									<span className="flex flex-col">
										<span className="text-[13px] font-medium tracking-[-0.01em]">{t.title}</span>
										<span className="font-mono text-[11px] text-subtle">{t.agent}</span>
									</span>
								</div>
							))}
						</div>
					</Cell>
					<Cell title="BUILD EVERY LAYER" desc="Interface, API and data change together in one pull request.">
						<div className="absolute left-1/2 top-[110px]">
							<svg viewBox="-80 -90 160 180" className="absolute -left-20 -top-[90px] h-[180px] w-40" aria-hidden>
								<path
									d="M0 -72L63 -36L63 36L0 72L-63 36L-63 -36Z"
									fill="none"
									stroke="var(--line)"
									strokeWidth="1.5"
									strokeDasharray="3 4"
								/>
							</svg>
							{LAYERS.map(([l, x, y]) => (
								<span
									key={l}
									className="absolute grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[11px] border border-line bg-surface font-mono text-[11px] font-medium text-ink/75"
									style={{ left: x, top: y }}
								>
									{l}
								</span>
							))}
							<span className="absolute -translate-x-1/2 -translate-y-1/2">
								<LogoTile className="size-[52px] rounded-[15px]" />
							</span>
						</div>
					</Cell>
					<Cell title="RUN WHAT WE SHIP" desc="Every product moves from dev to staging to production, and we keep it running.">
						<Pipeline />
					</Cell>
				</LineGrid>
			</div>
		</section>
	);
}

/** Each product and how far it has gone: dev → staging → prod. */
function Pipeline() {
	return (
		<div className="absolute left-1/2 top-6 w-[310px] max-w-full -translate-x-1/2 rounded-xl border border-line bg-surface p-4 text-left">
			<div className="grid grid-cols-[96px_1fr_1fr_1fr] gap-x-2 font-mono text-[11px] text-subtle">
				<span />
				{STAGES.map((s) => (
					<span key={s} className="text-center">
						{s}
					</span>
				))}
			</div>
			<div className="mt-3 flex flex-col gap-4">
				{PIPELINE.map((p) => {
					const live = p.reached === STAGES.length;
					return (
						<div key={p.name} className="grid grid-cols-[96px_1fr_1fr_1fr] items-center gap-x-2">
							<span className="font-mono text-[13px] text-ink/85">{p.name}</span>
							{STAGES.map((s, i) => (
								<span
									key={s}
									className={`h-2 rounded-full ${
										i < p.reached ? (live ? "bg-live" : "bg-blue") : "border border-dashed border-ink/20"
									}`}
								/>
							))}
						</div>
					);
				})}
			</div>
			<div className="mt-5 flex items-center gap-4 border-t border-line pt-3 font-mono text-[11px] text-subtle">
				<span className="flex items-center gap-1.5">
					<span className="size-2 rounded-full bg-live" />
					in production
				</span>
				<span className="flex items-center gap-1.5">
					<span className="size-2 rounded-full bg-blue" />
					in beta
				</span>
			</div>
		</div>
	);
}
