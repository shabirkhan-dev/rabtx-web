export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://shabirkhan.rabtx.dev";

export const links = {
  github: "https://github.com/shabirkhan-dev",
  linkedin: "https://linkedin.com/in/shabirkhan23",
  email: "mailto:shabirkhan.dev@gmail.com",
  cv: "/shabir-khan-cv.pdf",
};

/** The "Now" line under the name. Update the text and month when the focus changes. */
export const now = {
  text: "Shipping Grid's public beta and leading the Auspira frontend",
  updated: "November 2026",
};

export const profile = {
  name: "Shabir Khan",
  role: "Senior Full-Stack Engineer",
  location: "Islamabad, Pakistan",
  availability: "Open to remote, hybrid and relocation, full-time or contract",
  description:
    "Senior full-stack engineer in Islamabad with 8+ years building TypeScript web and mobile products end to end: React, Next.js, Node.js, NestJS and React Native.",
};

export type Highlight = {
  id: "grid" | "synone" | "starter" | "school-os";
  name: string;
  label: string;
  year: string;
  isNew?: boolean;
  /** Product screenshot in public/projects, shown on the card and first in the dialog. */
  image: string;
  /** Further screens, shown below the first one in the dialog. */
  screens?: string[];
  about: string[];
  facts: [label: string, value: string][];
  github?: string;
  /** The running product; the dialog's one button opens it, otherwise GitHub. */
  live?: string;
};

export const highlights: Highlight[] = [
  {
    id: "grid",
    name: "Grid",
    label: "Agent workspace",
    year: "2026",
    isNew: true,
    image: "/projects/grid-board.webp",
    screens: [
      "/projects/grid-thread.webp",
      "/projects/grid-home.webp",
      "/projects/grid-pr.webp",
      "/projects/grid-ship.webp",
    ],
    about: [
      "A self-hosted workspace where people and AI coding agents share one project board, live agent threads, a file editor, terminals and pull request checks, from desktop or phone",
      "Works with Claude Code, Codex, opencode and any ACP agent",
    ],
    facts: [
      ["Role", "Founder and lead engineer"],
      ["Stack", "SolidJS, Hono, PostgreSQL, Bun"],
      ["Status", "Public beta"],
      ["License", "MIT / Apache-2.0"],
    ],
    github: "https://github.com/Rabtx/grid",
    live: "https://grid.rabtx.dev",
  },
  {
    id: "synone",
    name: "Synone",
    label: "Life app",
    year: "2026",
    isNew: true,
    image: "/projects/synone-today.webp",
    screens: ["/projects/synone-training.webp", "/projects/synone-insights.webp"],
    about: [
      "A mobile-first life app: plan the day, train, track money and meals, keep care routines and prayer times, and see all of it on one calendar",
      "Offline first: everything is written on the phone and synced to your account in the background",
    ],
    facts: [
      ["Role", "Author"],
      ["Stack", "Expo, Hono, Cloudflare Workers, PostgreSQL"],
      ["Status", "In development"],
      ["License", "MIT / Apache-2.0"],
    ],
    github: "https://github.com/shabirkhan-dev/personal-os",
  },
  {
    id: "starter",
    name: "Starter",
    label: "SaaS monorepo",
    year: "2025",
    image: "/projects/starter.webp",
    about: [
      "A production-ready SaaS monorepo on Bun and Turborepo: Next.js, Expo, NestJS and Fumadocs apps sharing one UI layer, one TypeScript config and one CI pipeline",
    ],
    facts: [
      ["Role", "Author"],
      ["Stack", "Next.js, Expo, NestJS, Bun, Turborepo"],
      ["License", "MIT / Apache-2.0"],
    ],
    github: "https://github.com/Rabtx/starter",
    live: "https://starter-two-henna.vercel.app",
  },
  {
    id: "school-os",
    name: "School OS",
    label: "School platform",
    year: "2025",
    image: "/projects/school-os.webp",
    screens: ["/projects/school-os-students.webp"],
    about: [
      "A multi-tenant school platform: a teacher scans a student's QR code at the gate, the parent gets a WhatsApp alert, and the principal's dashboard updates",
      "Students, guardians, staff, attendance, homework and assessments are built; parent alerts are next",
    ],
    facts: [
      ["Role", "Author"],
      ["Stack", "Next.js, Expo, NestJS, PostgreSQL"],
      ["Status", "In development"],
    ],
    github: "https://github.com/Rabtx/school-os",
  },
];

export type Job = {
  company: string;
  role: string;
  /** Shown next to the role when it is not a full-time job. */
  type?: "Contract" | "Part-time";
  summary: string;
  from: string;
  /** "Now" for a current role. */
  to: string;
};

/** Newest first, by start year. */
export const work: Job[] = [
  {
    company: "Nexora AI",
    role: "Senior Frontend Lead",
    type: "Contract",
    summary: "Leading the frontend of Auspira, a contract-management platform for a UK client",
    from: "2026",
    to: "Now",
  },
  {
    company: "RabtX",
    role: "Founder",
    summary: "Building Grid, Synone, School OS and Starter, each designed and shipped end to end",
    from: "2025",
    to: "Now",
  },
  {
    company: "Kansai Group",
    role: "Frontend Engineer, Web and Mobile",
    type: "Part-time",
    summary: "Built the Expo app, the vehicle listing site and the admin panel for a used-car exporter in Osaka",
    from: "2024",
    to: "2026",
  },
  {
    company: "Excelorithm",
    role: "Lead Frontend Engineer",
    summary: "Led the rebuild of BullseyeEngagement, an HR platform used by PepsiCo, Intel and Emory, with 35% faster page loads",
    from: "2023",
    to: "2025",
  },
  {
    company: "Revoxai",
    role: "Senior Full-Stack Developer",
    summary: "Built an AI e-learning platform: the Next.js frontend and the Node.js APIs behind it",
    from: "2021",
    to: "2023",
  },
  {
    company: "Freelance",
    role: "Software Developer",
    summary: "Web and mobile apps for clients, on Fiverr and direct",
    from: "2018",
    to: "2021",
  },
];

export type Skill = {
  name: string;
  /** Simple Icons slug, served from public/skills/{icon}.svg (CC0). */
  icon?: string;
  /** Brand colour shown on hover. Very dark brands fall back to the text colour. */
  hex?: string;
};

export const skills: { area: string; items: Skill[] }[] = [
  {
    area: "Frontend",
    items: [
      { name: "React 19", icon: "react", hex: "61DAFB" },
      { name: "Next.js", icon: "nextdotjs" },
      { name: "SolidJS", icon: "solid", hex: "4F88C6" },
      { name: "React Native & Expo", icon: "expo" },
      { name: "TanStack Query", icon: "reactquery", hex: "FF4154" },
      { name: "Zustand" },
      { name: "Tailwind CSS", icon: "tailwindcss", hex: "06B6D4" },
      { name: "Design systems", icon: "figma", hex: "F24E1E" },
    ],
  },
  {
    area: "Backend & data",
    items: [
      { name: "Node.js", icon: "nodedotjs", hex: "5FA04E" },
      { name: "NestJS", icon: "nestjs", hex: "E0234E" },
      { name: "Hono", icon: "hono", hex: "E36002" },
      { name: "Bun", icon: "bun", hex: "FBF0DF" },
      { name: "Rust", icon: "rust" },
      { name: "Go", icon: "go", hex: "00ADD8" },
      { name: "Express", icon: "express" },
      { name: "PostgreSQL", icon: "postgresql", hex: "4169E1" },
      { name: "Redis", icon: "redis", hex: "FF4438" },
      { name: "SQLite", icon: "sqlite", hex: "0F80CC" },
      { name: "Drizzle", icon: "drizzle", hex: "C5F74F" },
      { name: "Prisma", icon: "prisma" },
    ],
  },
  {
    area: "Delivery",
    items: [
      { name: "Docker", icon: "docker", hex: "2496ED" },
      { name: "GitHub Actions", icon: "githubactions", hex: "2088FF" },
      { name: "Azure Pipelines" },
      { name: "AWS" },
      { name: "Vitest", icon: "vitest", hex: "6E9F18" },
      { name: "Biome", icon: "biome", hex: "60A5FA" },
      { name: "Lefthook", icon: "lefthook", hex: "FF1E1E" },
    ],
  },
  {
    area: "AI",
    items: [
      { name: "LLM APIs", icon: "anthropic" },
      { name: "Claude Code", icon: "claude", hex: "D97757" },
      { name: "Codex" },
      { name: "ACP agents" },
      { name: "RAG" },
      { name: "Local models", icon: "ollama" },
    ],
  },
];
