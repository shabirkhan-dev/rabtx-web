"use client";

import { useEffect, useState } from "react";
import { BriefcaseBusiness, Layers, Mail, PenLine, Sparkles } from "lucide-react";
import { links } from "@/data/profile";

const sections = [
  { id: "highlights", label: "Highlights", Icon: Sparkles },
  { id: "work", label: "Work", Icon: BriefcaseBusiness },
  { id: "skills", label: "Skills", Icon: Layers },
  { id: "writing", label: "Writing", Icon: PenLine },
] as const;

type SectionId = (typeof sections)[number]["id"];

/** Soft glass, shared by the pill and the round button. */
const glass =
  "border border-line bg-surface/75 shadow-[0_1px_0_0_rgb(255_255_255/0.06)_inset,0_12px_32px_-12px_rgb(0_0_0/0.45)] backdrop-blur-xl backdrop-saturate-150";

/**
 * The floating bar from the reading-app reference: one pill of section icons, with a raised chip
 * on the section in view, and a separate round button to get in touch.
 */
export function BottomBar() {
  const [active, setActive] = useState<SectionId | null>(null);

  useEffect(() => {
    // A section counts as "in view" when it crosses a thin band just above the middle of the screen.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id as SectionId);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    for (const { id } of sections) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    // Above the first section nothing is active.
    const onScroll = () => {
      const first = document.getElementById(sections[0].id);
      if (first && first.getBoundingClientRect().top > window.innerHeight * 0.45) setActive(null);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <nav
      aria-label="Sections"
      className="pointer-events-none fixed inset-x-0 bottom-[max(16px,env(safe-area-inset-bottom))] z-40 flex justify-center px-5"
    >
      <div className="pointer-events-auto flex w-full max-w-[550px] items-center justify-between gap-3">
        <ul className={`flex items-center gap-1 rounded-full p-1.5 ${glass}`}>
          {sections.map(({ id, label, Icon }) => {
            const on = active === id;
            return (
              <li key={id}>
                <a
                  href={`#${id}`}
                  aria-label={label}
                  aria-current={on ? "location" : undefined}
                  title={label}
                  className={`flex h-11 items-center justify-center gap-2 rounded-full px-4 text-sm leading-5 font-medium tracking-[-0.0064em] transition-[background-color,color,box-shadow] duration-300 md:h-12 md:px-5 ${
                    on
                      ? "bg-raised text-foreground shadow-[0_1px_0_0_rgb(255_255_255/0.08)_inset,0_1px_2px_rgb(0_0_0/0.25)]"
                      : "text-muted hover-capable:hover:text-foreground"
                  }`}
                >
                  <Icon className="size-[18px]" strokeWidth={1.75} />
                  <span className={on ? "hidden md:inline" : "hidden"}>{label}</span>
                </a>
              </li>
            );
          })}
        </ul>
        <a
          href={links.email}
          aria-label="Email me"
          title="Email me"
          className={`grid size-14 shrink-0 place-items-center rounded-full text-foreground transition-transform hover-capable:hover:scale-105 md:size-[60px] ${glass}`}
        >
          <Mail className="size-[18px]" strokeWidth={1.75} />
        </a>
      </div>
    </nav>
  );
}
