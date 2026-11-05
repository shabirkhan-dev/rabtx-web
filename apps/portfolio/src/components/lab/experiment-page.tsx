import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { Undo2 } from "lucide-react";
import { getExperiment, type Experiment } from "@/data/lab";
import { SourceViewer, Snippet, type SourceFile } from "@/components/lab/source-viewer";
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

/** The experiment's files, read at build time from its folder, so the page shows what runs. */
function readSources(e: Experiment): SourceFile[] {
  const folder = path.join(process.cwd(), "src/components/lab", e.slug);
  return e.files.map((name) => ({ name, code: readFileSync(path.join(folder, name), "utf8") }));
}

function Tags({ tags }: { tags: string[] }) {
  return (
    <p className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span key={tag} className="rounded-full border border-line px-2 text-[11px] leading-[18px] text-muted">
          {tag}
        </span>
      ))}
    </p>
  );
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
        <h1 className="text-[28px] leading-8 font-semibold tracking-[-0.03em] text-foreground">{e.name}</h1>
      </div>
      <p className={`${text} text-muted`}>{e.description}</p>
      <Tags tags={e.tags} />
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

/** A section under the demo: its title, a line on it, then what it holds at full width. */
function Section({
  id,
  title,
  note,
  children,
}: {
  id: string;
  title: string;
  note?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-5">
      <div className="mx-auto flex w-full max-w-[550px] flex-col gap-2">
        <h2 id={id} className="font-hand text-[32px] leading-9 font-normal text-foreground">
          {title}
        </h2>
        {note ? <div className={`${text} text-muted`}>{note}</div> : null}
      </div>
      {children}
    </section>
  );
}

/**
 * The page every experiment sits on: its header, the live demo at full width, my own take on it,
 * and its code to copy.
 */
export function ExperimentPage({
  slug,
  remix,
  children,
}: {
  slug: string;
  /** My own piece built on the experiment, described by its entry's `remix`. */
  remix?: React.ReactNode;
  children: React.ReactNode;
}) {
  const e = getExperiment(slug)!;
  const files = readSources(e);
  return (
    <div className="overflow-x-clip">
      <main className="mx-auto flex w-full max-w-[976px] flex-col gap-12 px-5 pt-10 pb-24 md:gap-16 md:pt-[88px]">
        <Header experiment={e} />
        {children}

        {remix && e.remix ? (
          <Section
            id={`${slug}-remix`}
            title="My take"
            note={
              <p>
                <span className="font-medium text-foreground">{e.remix.title}.</span> {e.remix.note}
              </p>
            }
          >
            {remix}
          </Section>
        ) : null}

        <Section
          id={`${slug}-code`}
          title="Code"
          note={
            <>
              <p>
                Install the original with the shadcn CLI, or copy the files below into one folder.
                They are this site&rsquo;s copy, so they include my changes.
              </p>
              {e.changes?.length ? (
                <ul className="mt-3 flex list-disc flex-col gap-1 pl-5 text-faint">
                  {e.changes.map((change) => (
                    <li key={change}>{change}</li>
                  ))}
                </ul>
              ) : null}
            </>
          }
        >
          <div className="grid items-start gap-3 md:grid-cols-2">
            {e.install ? <Snippet title="Install" code={e.install} /> : null}
            <Snippet title="Use" code={e.usage} />
          </div>
          <SourceViewer files={files} />
        </Section>

        <div className="mx-auto w-full max-w-[550px]">
          <SiteFooter />
        </div>
      </main>
    </div>
  );
}
