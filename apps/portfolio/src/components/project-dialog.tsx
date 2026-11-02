"use client";

import type { Ref } from "react";
import { ArrowUpRight, Github, Globe, X } from "lucide-react";
import type { Highlight } from "@/data/profile";
import { ScreenshotCarousel } from "@/components/screenshot-carousel";

type Props = {
  ref: Ref<HTMLDialogElement>;
  project: Highlight | null;
};

const pill =
  "flex items-center justify-center gap-2 rounded-full py-2.5 pr-3.5 pl-4 text-sm leading-5 font-medium tracking-[-0.0064em] transition-opacity hover-capable:hover:opacity-85 max-md:flex-1";

/**
 * The project details from the Figma "Project" frames: a centred dialog on desktop and a
 * bottom sheet on phones. Built on <dialog>, so Escape, focus and the backdrop come free.
 */
export function ProjectDialog({ ref, project }: Props) {
  return (
    <dialog
      ref={ref}
      aria-labelledby="project-title"
      onClick={(event) => {
        // A click on the backdrop lands on the dialog element itself.
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-y-auto overscroll-contain rounded-t-[20px] border border-b-0 border-line bg-surface p-2 pb-4 text-foreground backdrop:bg-black/70 md:m-auto md:max-h-[calc(100dvh-48px)] md:w-[560px] md:rounded-[20px] md:border-b md:pb-0"
    >
      {project ? (
        <div className="flex flex-col items-center gap-2 md:gap-0">
          <span className="h-1 w-9 rounded-full bg-line md:hidden" aria-hidden="true" />
          <div className="relative w-full">
            <ScreenshotCarousel
              key={project.id}
              images={[project.image, ...(project.screens ?? [])]}
              alt={project.name}
            />
            <form method="dialog">
              <button
                type="submit"
                aria-label="Close"
                className="absolute top-2.5 right-2.5 grid size-8 cursor-pointer place-items-center rounded-full border border-line bg-background/80 text-foreground md:top-3 md:right-3"
              >
                <X className="size-4" strokeWidth={1.5} />
              </button>
            </form>
          </div>

          <div className="flex w-full flex-col gap-5 px-3 pt-1 md:px-4 md:pt-2 md:pb-4">
            <div className="flex items-start gap-2">
              <div className="flex flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <h2 id="project-title" className="text-xl leading-7 font-medium tracking-[-0.0064em]">
                    {project.name}
                  </h2>
                  {project.isNew ? (
                    <span className="rounded-full border border-new px-[7px] pb-px font-hand text-[15px] leading-4 text-new">
                      New
                    </span>
                  ) : null}
                </div>
                <p className="text-sm leading-5 tracking-[-0.0064em] text-muted">{project.label}</p>
              </div>
              <p className="font-mono text-[9px] leading-[14px] text-muted">{project.year}</p>
            </div>

            <div className="flex flex-col gap-3 text-sm leading-[22px] tracking-[-0.0064em] text-muted">
              {project.about.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <dl className="flex flex-col text-sm leading-5 tracking-[-0.0064em]">
              {project.facts.map(([label, value]) => (
                <div
                  key={label}
                  className="flex gap-4 border-t border-line py-2.5 last:border-b"
                >
                  <dt className="w-[72px] shrink-0 text-muted md:w-24">{label}</dt>
                  <dd className="text-foreground">{value}</dd>
                </div>
              ))}
            </dl>

            {project.live ?? project.github ? (
              <div className="flex gap-2">
                <a
                  href={project.live ?? project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${pill} bg-foreground text-background`}
                >
                  {project.live ? (
                    <Globe className="size-4" strokeWidth={1.5} />
                  ) : (
                    <Github className="size-4" strokeWidth={1.5} />
                  )}
                  {project.live ? "Open live site" : "View on GitHub"}
                  <ArrowUpRight className="size-4" strokeWidth={1.5} />
                </a>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
