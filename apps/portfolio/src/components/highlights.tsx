"use client";

import { useRef, useState } from "react";
import { highlights, type Highlight } from "@/data/profile";
import { SectionTitle } from "@/components/page-column";
import { ProjectDialog } from "@/components/project-dialog";

/**
 * A product screenshot set into the card, cropped by the card's right and bottom edges. Cards use
 * the 800px copies in public/projects/cards; the dialog shows the full-size screens.
 */
function Shot({ src, alt, eager }: { src: string; alt: string; eager: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- pre-sized static asset
    <img
      src={src.replace("/projects/", "/projects/cards/")}
      alt={alt}
      width={800}
      height={500}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      className="absolute top-6 left-5 aspect-[16/10] w-[360px] max-w-none rounded-[10px] border border-line object-cover object-left-top md:top-7 md:left-6 md:w-[400px]"
    />
  );
}

function HighlightCard({
  highlight,
  first,
  onOpen,
}: {
  highlight: Highlight;
  /** The first card is the page's largest paint on most screens, so it loads straight away. */
  first: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      className="group flex shrink-0 cursor-pointer snap-start flex-col gap-3 text-left"
    >
      <div className="relative grid h-[220px] w-[260px] place-items-center overflow-hidden rounded-2xl bg-surface transition-[filter] group-hover:brightness-110 md:h-[252px] md:w-[290px]">
        <Shot src={highlight.image} alt={`${highlight.name} screenshot`} eager={first} />
      </div>
      <div className="flex w-full gap-2">
        <div className="flex flex-1 flex-col gap-0.5">
          <p className="text-sm leading-5 font-medium tracking-[-0.0064em] text-foreground">
            {highlight.name}
          </p>
          <p className="text-xs leading-4 tracking-[-0.0064em] text-muted">{highlight.label}</p>
        </div>
        <p className="font-mono text-[9px] leading-[14px] text-muted">{highlight.year}</p>
      </div>
    </button>
  );
}

export function Highlights() {
  const [open, setOpen] = useState<Highlight | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  function show(highlight: Highlight) {
    setOpen(highlight);
    dialogRef.current?.showModal();
  }

  return (
    <section id="highlights" className="flex scroll-mt-16 flex-col gap-6" aria-labelledby="highlights-title">
      <SectionTitle>
        <span id="highlights-title">Highlights</span>
      </SectionTitle>
      {/* The row runs past the column to the right edge of the screen, as in the design. */}
      <div className="-mr-5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto pr-5 [scrollbar-width:none] md:mr-[calc(275px-50vw)] md:pr-6 [&::-webkit-scrollbar]:hidden">
        {highlights.map((h, i) => (
          <HighlightCard key={h.id} highlight={h} first={i === 0} onOpen={() => show(h)} />
        ))}
      </div>
      <ProjectDialog ref={dialogRef} project={open} />
    </section>
  );
}
