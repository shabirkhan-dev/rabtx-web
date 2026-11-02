"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ArrowIcon, GithubIcon } from "./icons";
import { type ProductName, ProductLogo } from "./product-logo";
import { ProjectDialog } from "./project-dialog";
import { SectionHeader } from "./ui";

export type Product = {
	name: ProductName;
	label: string;
	status: { label: string; tone: "blue" | "green" };
	desc: string;
	stack: string;
	about: string[];
	facts: [string, string][];
	screens: string[];
	github?: string;
	live?: string;
};

const PRODUCTS: Product[] = [
	{
		name: "Grid",
		label: "Agent workspace",
		status: { label: "Private beta", tone: "blue" },
		desc: "A workspace where AI agents take tasks, work in their own environment and open pull requests.",
		stack: "SolidJS · Hono · Bun · PostgreSQL",
		about: [
			"A self-hosted workspace where people and AI coding agents share one project board, live agent threads, a file editor, terminals and pull request checks, from desktop or phone.",
			"Works with Claude Code, Codex, opencode and any ACP agent.",
		],
		facts: [
			["Stack", "SolidJS, Hono, PostgreSQL, Bun"],
			["Status", "Private beta"],
			["Started", "2025"],
		],
		screens: [
			"/projects/grid-board.webp",
			"/projects/grid-thread.webp",
			"/projects/grid-home.webp",
			"/projects/grid-pr.webp",
			"/projects/grid-ship.webp",
		],
	},
	{
		name: "School OS",
		label: "School platform",
		status: { label: "Open source", tone: "green" },
		desc: "Attendance, homework, guardians and WhatsApp messages for schools. Each school gets its own tenant.",
		stack: "Next.js · NestJS · Expo · PostgreSQL",
		about: [
			"A multi-tenant school platform: a teacher scans a student's QR code at the gate, the parent gets a WhatsApp alert, and the principal's dashboard updates.",
			"Students, guardians, staff, attendance, homework and assessments are built; parent alerts are next.",
		],
		facts: [
			["Stack", "Next.js, Expo, NestJS, PostgreSQL"],
			["Status", "In development"],
			["Started", "2025"],
		],
		screens: ["/projects/school-os.webp", "/projects/school-os-students.webp"],
		github: "https://github.com/shabirkhan-dev/school-os",
	},
	{
		name: "Starter",
		label: "SaaS monorepo",
		status: { label: "Open source", tone: "green" },
		desc: "The monorepo every RabtX product starts from: web, mobile, API and docs with one UI layer and one CI pipeline.",
		stack: "Next.js · Expo · NestJS · Bun",
		about: [
			"A production-ready SaaS monorepo on Bun and Turborepo: Next.js, Expo, NestJS, Fumadocs and FastAPI apps sharing one UI layer, one TypeScript config and one CI pipeline.",
		],
		facts: [
			["Stack", "Next.js, Expo, NestJS, Bun, Turborepo"],
			["License", "MIT / Apache-2.0"],
			["Started", "2025"],
		],
		screens: ["/projects/starter.webp"],
		github: "https://github.com/shabirkhan-dev/starter",
		live: "https://starter-two-henna.vercel.app",
	},
];

const TONE = {
	blue: "bg-blue/10 text-accent-ink",
	green: "bg-live/10 text-live-ink",
};

function ProductCard({ p, onOpen }: { p: Product; onOpen: () => void }) {
	return (
		<article className="group relative flex flex-col overflow-hidden rounded-[20px] border border-line bg-surface transition-colors hover:border-ink/20">
			{/* The whole card opens the details; the GitHub and Live links sit above this button. */}
			<button
				type="button"
				onClick={onOpen}
				aria-label={`Open ${p.name} details`}
				className="absolute inset-0 z-0 cursor-pointer rounded-[20px]"
			/>
			{/* screenshot peeks in from the top-left of its own frame, so text can never run into it */}
			<div className="pointer-events-none relative aspect-[16/10] overflow-hidden border-b border-line bg-surface-2">
				<Image
					src={p.screens[0]}
					alt=""
					width={1440}
					height={900}
					sizes="(min-width: 1024px) 560px, 90vw"
					className="absolute left-6 top-6 w-[150%] max-w-none rounded-tl-xl border-l border-t border-line transition-transform duration-300 ease-out group-hover:-translate-x-1 group-hover:-translate-y-1 motion-reduce:transition-none"
				/>
			</div>
			<div className="pointer-events-none relative flex flex-1 flex-col p-6">
				<div className="flex h-8 items-center justify-between gap-3">
					<h3 className="flex items-center gap-2.5 text-lg font-semibold tracking-[-0.03em]">
						<ProductLogo name={p.name} className="size-[22px]" />
						{p.name}
					</h3>
					<div className="pointer-events-auto relative z-10 flex items-center gap-1.5">
						{p.github && (
							<a
								href={p.github}
								target="_blank"
								rel="noreferrer"
								aria-label={`${p.name} on GitHub`}
								className="grid size-8 place-items-center rounded-full border border-line bg-surface-2 transition-opacity hover:opacity-75"
							>
								<GithubIcon />
							</a>
						)}
						{p.live && (
							<a
								href={p.live}
								target="_blank"
								rel="noreferrer"
								className="flex h-8 items-center gap-1 rounded-full bg-ink pl-3 pr-2.5 text-xs font-semibold text-inv transition-opacity hover:opacity-85"
							>
								Live
								<ArrowIcon />
							</a>
						)}
					</div>
				</div>
				<span
					className={`mt-3 inline-flex w-fit items-center gap-1.5 rounded-full py-1 pl-2 pr-2.5 text-xs font-medium ${TONE[p.status.tone]}`}
				>
					<span className="size-1.5 rounded-full bg-current" />
					{p.status.label}
				</span>
				<p className="mt-4 text-[15px] leading-[23px] text-muted">{p.desc}</p>
				<div className="mt-auto pt-6">
					<div className="flex items-center justify-between gap-4 border-t border-line pt-4">
						<p className="font-mono text-xs text-subtle">
							<span className="sr-only">Built with </span>
							{p.stack}
						</p>
						<span className="shrink-0 text-xs font-semibold text-ink transition-transform group-hover:translate-x-0.5">
							Details →
						</span>
					</div>
				</div>
			</div>
		</article>
	);
}

export function Products() {
	const dialog = useRef<HTMLDialogElement>(null);
	const [open, setOpen] = useState<Product | null>(null);

	return (
		<section id="products" className="scroll-mt-24 px-4 pt-20 sm:px-20">
			<SectionHeader chip="Products" title="What we’ve built." />
			<div className="mx-auto mt-[72px] grid max-w-[640px] gap-6 lg:max-w-[1280px] lg:grid-cols-3">
				{PRODUCTS.map((p) => (
					<ProductCard
						key={p.name}
						p={p}
						onOpen={() => {
							setOpen(p);
							dialog.current?.showModal();
						}}
					/>
				))}
			</div>
			<ProjectDialog ref={dialog} product={open} />
		</section>
	);
}
