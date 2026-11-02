import type { ProductName } from "@/components/product-logo";

export type Product = {
	name: ProductName;
	/** The product page lives at /products/{slug}. */
	slug: string;
	/** When the product page last changed, for the sitemap. */
	updatedAt: string;
	label: string;
	status: { label: string; tone: "blue" | "green" };
	desc: string;
	stack: string;
	/** schema.org applicationCategory for the product page. */
	category: string;
	about: string[];
	/** Why we built it: the product page's opening section. */
	why: string;
	/** What it does, as [heading, line] pairs. */
	features: [string, string][];
	/** How it's built, from the studio's side. */
	built: string[];
	/** Slugs of posts that relate to this product. */
	posts: string[];
	facts: [string, string][];
	screens: string[];
	github?: string;
	live?: string;
};

export const PRODUCTS: Product[] = [
	{
		name: "Grid",
		slug: "grid",
		updatedAt: "2026-10-12",
		label: "Agent workspace",
		status: { label: "Open-source beta", tone: "blue" },
		desc: "A workspace where AI agents take tasks, work in their own environment and open pull requests.",
		stack: "SolidJS · Hono · Bun · PostgreSQL",
		category: "DeveloperApplication",
		about: [
			"A self-hosted workspace where people and AI coding agents share one project board, live agent threads, a file editor, terminals and pull request checks, from desktop or phone.",
			"Works with Claude Code, Codex, opencode and any ACP agent.",
		],
		why: "Coding agents got good enough to do real work, but the work lived in four places: the task in a tracker, the code on a laptop, the agent in a terminal tab and the pull request on GitHub. We built Grid to put all of it around the project folder, and we now build every RabtX product in it.",
		features: [
			["One board for people and agents", "Tasks move from backlog to done, owned by a person or handed to an agent with the context it needs."],
			["Live agent threads", "Every command, edit, diff and test streams into the thread, and the agent asks before doing anything you haven't allowed."],
			["Any agent, any model", "Claude Code, Codex, opencode, Antigravity or any ACP agent, with the model and effort picked per thread."],
			["Files, terminals and pull requests", "Edit files in the browser, use persistent terminals on the machine with the code, and hand a failing pull request to an agent."],
			["From any device", "An installable app with one inbox for approvals, so work started on a laptop can be checked from a phone."],
			["Self-hosted", "One command installs it on a laptop, a VPS or a Codespace. The code stays on your machine."],
		],
		built: [
			"The console is a Solid 2 single-page app built for speed. The API is Hono on Bun with PostgreSQL, and a small runner on each machine that holds a project streams agent and terminal work back to the console.",
			"Grid is open source under MIT or Apache-2.0. Its own site has the install guide and the docs.",
		],
		posts: ["building-grid-with-the-agents-it-runs", "make-shipping-boring-on-purpose", "ui-ux-design-in-the-ai-era", "architecture-for-the-agent-era"],
		facts: [
			["Stack", "SolidJS, Hono, PostgreSQL, Bun"],
			["Status", "Open-source beta"],
			["Started", "2025"],
		],
		screens: [
			"/projects/grid-board.webp",
			"/projects/grid-thread.webp",
			"/projects/grid-home.webp",
			"/projects/grid-pr.webp",
			"/projects/grid-ship.webp",
		],
		github: "https://github.com/rabtx/grid",
		live: "https://grid.rabtx.dev",
	},
	{
		name: "School OS",
		slug: "school-os",
		updatedAt: "2026-10-12",
		label: "School platform",
		status: { label: "Open source", tone: "green" },
		desc: "Attendance, homework, guardians and WhatsApp messages for schools. Each school gets its own tenant.",
		stack: "Next.js · NestJS · Expo · PostgreSQL",
		category: "EducationalApplication",
		about: [
			"A multi-tenant school platform: a teacher scans a student's QR code at the gate, the parent gets a WhatsApp alert, and the principal's dashboard updates.",
			"Students, guardians, staff, attendance, homework and assessments are built; parent alerts are next.",
		],
		why: "Parents want to know their child reached school safely, and schools want to prove it. Most school software is a generic ERP built for the office. School OS starts from that trust loop instead, for affordable private schools of roughly 200 to 2,000 students.",
		features: [
			["Attendance at the gate", "A teacher scans a student's QR code and the principal's dashboard updates straight away."],
			["Parent alerts on WhatsApp", "Parents hear that their child arrived on the app they already use. This is next on the roadmap."],
			["Students, guardians and staff", "Records, class rosters and printable ID cards for every student."],
			["Homework and assessments", "Teachers set homework and plan tests, and parents see what is due."],
			["One tenant per school", "Each school's data is kept apart, with roles and permissions for every member."],
		],
		built: [
			"A Next.js admin app, an Expo mobile app and a NestJS API over PostgreSQL. Each school is its own tenant, so data never mixes between schools.",
			"School OS is open source and in active development.",
		],
		posts: ["building-multi-tenant-admin-systems", "ui-ux-design-in-the-ai-era"],
		facts: [
			["Stack", "Next.js, Expo, NestJS, PostgreSQL"],
			["Status", "In development"],
			["Started", "2025"],
		],
		screens: ["/projects/school-os.webp", "/projects/school-os-students.webp"],
		github: "https://github.com/rabtx/school-os",
	},
	{
		name: "Starter",
		slug: "starter",
		updatedAt: "2026-10-12",
		label: "SaaS monorepo",
		status: { label: "Open source", tone: "green" },
		desc: "The monorepo every RabtX product starts from: web, mobile, API and docs with one UI layer and one CI pipeline.",
		stack: "Next.js · Expo · NestJS · Bun",
		category: "DeveloperApplication",
		about: [
			"A production-ready SaaS monorepo on Bun and Turborepo: Next.js, Expo, NestJS, Fumadocs and FastAPI apps sharing one UI layer, one TypeScript config and one CI pipeline.",
		],
		why: "Every new product used to start with a week of setup: auth, a design system, CI, Docker and docs. Starter is that week done once, and every RabtX product begins from it.",
		features: [
			["Web, mobile and API in one repo", "Next.js, Expo and NestJS apps share types, one UI layer, one logger and one TypeScript config."],
			["Docs from day one", "A Fumadocs site lives next to the code, so documentation ships with the change."],
			["An optional AI service", "A FastAPI app for model calls sits behind the NestJS API and is never exposed directly."],
			["Checks on every commit", "Lint, format, typecheck, tests and Conventional Commits run in pre-commit hooks and in CI."],
			["Docker and a dev container", "Docker Compose brings up Postgres, the API and the web app, and the dev container has every toolchain ready."],
		],
		built: [
			"Bun workspaces and Turborepo run the task graph, with oxlint and oxfmt for style and import-boundary checks that keep packages apart.",
			"Starter is open source under MIT or Apache-2.0, with a live demo of the web app.",
		],
		posts: ["make-shipping-boring-on-purpose", "frontend-performance-under-real-traffic", "architecture-for-the-agent-era"],
		facts: [
			["Stack", "Next.js, Expo, NestJS, Bun, Turborepo"],
			["License", "MIT / Apache-2.0"],
			["Started", "2025"],
		],
		screens: ["/projects/starter.webp"],
		github: "https://github.com/rabtx/starter",
		live: "https://starter-two-henna.vercel.app",
	},
];

export const STATUS_TONE = {
	blue: "bg-blue/10 text-accent-ink",
	green: "bg-live/10 text-live-ink",
};

export function getProduct(slug: string) {
	return PRODUCTS.find((p) => p.slug === slug) ?? null;
}
