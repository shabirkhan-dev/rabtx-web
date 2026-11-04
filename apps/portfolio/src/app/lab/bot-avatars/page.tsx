import type { Metadata } from "next";
import Link from "next/link";
import { Undo2 } from "lucide-react";
import { getExperiment } from "@/data/lab";
import { BotAvatars } from "@/components/lab/bot-avatars/bot-avatars";
import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";

const experiment = getExperiment("bot-avatars")!;

export const metadata: Metadata = {
  title: `${experiment.name} — Lab`,
  description: experiment.summary,
  alternates: { canonical: `/lab/${experiment.slug}` },
};

const text = "text-sm leading-5 tracking-[-0.0064em]";

export default function BotAvatarsPage() {
  const { credit } = experiment;
  return (
    <div className="overflow-x-clip">
      <main className="mx-auto flex w-full max-w-[976px] flex-col gap-12 px-5 pt-10 pb-24 md:pt-[88px]">
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
            <p className="font-mono text-[11px] leading-4 text-faint">Lab · {experiment.date}</p>
            <h1 className="text-[28px] leading-8 font-semibold tracking-[-0.03em] text-foreground">
              {experiment.name}
            </h1>
          </div>
          <p className={`${text} text-muted`}>{experiment.description}</p>
          <p className="flex flex-wrap gap-1.5">
            {experiment.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-line px-2 text-[11px] leading-[18px] text-muted"
              >
                {tag}
              </span>
            ))}
          </p>
          {credit ? (
            <p className={`${text} text-faint`}>
              Based on the component by{" "}
              <a
                href={credit.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground underline decoration-from-font underline-offset-2"
              >
                {credit.name}
              </a>{" "}
              ({credit.license} License). Poke one, or move the pointer around them.
            </p>
          ) : null}
        </header>

        <BotAvatars />

        <div className="mx-auto w-full max-w-[550px]">
          <SiteFooter />
        </div>
      </main>
    </div>
  );
}
