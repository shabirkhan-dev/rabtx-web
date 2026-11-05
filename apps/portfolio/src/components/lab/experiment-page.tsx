import type { Metadata } from "next";
import Link from "next/link";
import { Undo2 } from "lucide-react";
import { getExperiment, type Experiment } from "@/data/lab";
import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";

const text = "text-sm leading-5 tracking-[-0.0064em]";

/** Metadata for an experiment's page, from its entry in `src/data/lab.ts`. */
export function experimentMetadata(slug: string): Metadata {
  const e = getExperiment(slug)!;
  return {
    title: `${e.name} — Lab`,
    description: e.summary,
    alternates: { canonical: `/lab/${e.slug}` },
  };
}

function Header({ experiment: e }: { experiment: Experiment }) {
  return (
    <header className="mx-auto flex w-full max-w-[550px] flex-col gap-5">
      <div className="flex items-center justify-between">
        <Link
          href="/lab"
          className={`flex items-center gap-2 ${text} text-muted transition-colors hover-capable:hover:text-foreground`}
        >
          <Undo2 className="size-4" strokeWidth={1.5} />
          Lab
        </Link>
        <ThemeToggle />
      </div>
      <div className="flex flex-col gap-2">
        <p className="font-mono text-[11px] leading-4 text-faint">Lab · {e.date}</p>
        <h1 className="text-[28px] leading-8 font-semibold tracking-[-0.03em] text-foreground">
          {e.name}
        </h1>
      </div>
      <p className={`${text} text-muted`}>{e.description}</p>
      <p className="flex flex-wrap gap-1.5">
        {e.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-line px-2 text-[11px] leading-[18px] text-muted"
          >
            {tag}
          </span>
        ))}
      </p>
      {e.credit ? (
        <p className={`${text} text-faint`}>
          Based on the component by{" "}
          <a
            href={e.credit.href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline decoration-from-font underline-offset-2"
          >
            {e.credit.name}
          </a>{" "}
          ({e.credit.license} License).{e.hint ? ` ${e.hint}` : ""}
        </p>
      ) : e.hint ? (
        <p className={`${text} text-faint`}>{e.hint}</p>
      ) : null}
    </header>
  );
}

/** The page every experiment sits on: its header, the live demo at full width, the footer. */
export function ExperimentPage({ slug, children }: { slug: string; children: React.ReactNode }) {
  const experiment = getExperiment(slug)!;
  return (
    <div className="overflow-x-clip">
      <main className="mx-auto flex w-full max-w-[976px] flex-col gap-12 px-5 pt-10 pb-24 md:pt-[88px]">
        <Header experiment={experiment} />
        {children}
        <div className="mx-auto w-full max-w-[550px]">
          <SiteFooter />
        </div>
      </main>
    </div>
  );
}
