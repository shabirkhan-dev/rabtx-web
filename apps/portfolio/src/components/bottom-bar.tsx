"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  Briefcase01Icon,
  Layers01Icon,
  Mail01Icon,
  QuillWrite02Icon,
  StarsIcon,
  TestTube01Icon,
} from "@hugeicons/core-free-icons";
import { links } from "@/data/profile";

const sections: { id: string; label: string; icon: IconSvgElement }[] = [
  { id: "highlights", label: "Highlights", icon: StarsIcon },
  { id: "lab", label: "Lab", icon: TestTube01Icon },
  { id: "work", label: "Work", icon: Briefcase01Icon },
  { id: "skills", label: "Skills", icon: Layers01Icon },
  { id: "writing", label: "Writing", icon: QuillWrite02Icon },
];

/** Soft glass, shared by the pill and the round button. */
const glass =
  "border border-line bg-surface/80 shadow-[inset_0_1px_0_rgb(255_255_255/0.07),0_16px_40px_-16px_rgb(0_0_0/0.5)] backdrop-blur-xl backdrop-saturate-150";

/** One easing for everything in the bar: quick start, long soft landing. */
const ease = "ease-[cubic-bezier(0.32,0.72,0,1)]";

/**
 * The floating bar from the reading-app reference: one pill of section icons with a raised chip
 * that glides to the section in view, and a separate round button to get in touch.
 */
export function BottomBar() {
  const [active, setActive] = useState<string | null>(null);
  const items = useRef<Record<string, HTMLLIElement | null>>({});
  const [chip, setChip] = useState<{ x: number; w: number } | null>(null);

  // Scrollspy: a section is "in view" when it crosses a thin band just above the middle.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    for (const { id } of sections) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
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

  // The chip follows the active item (measured on its <li>, whose offset parent is the pill), including while its label opens and changes its width.
  useLayoutEffect(() => {
    const el = active ? items.current[active] : null;
    if (!el) return;
    const place = () => setChip({ x: el.offsetLeft, w: el.offsetWidth });
    place();
    const ro = new ResizeObserver(place);
    ro.observe(el);
    return () => ro.disconnect();
  }, [active]);

  return (
    <nav
      aria-label="Sections"
      className="pointer-events-none fixed inset-x-0 bottom-[max(16px,env(safe-area-inset-bottom))] z-40 flex justify-center px-5"
    >
      <div className="pointer-events-auto flex w-full max-w-[550px] items-center justify-between gap-3">
        <ul className={`relative flex items-center rounded-full p-1.5 ${glass}`}>
          <li
            aria-hidden="true"
            className={`absolute top-1.5 bottom-1.5 left-0 rounded-full bg-raised shadow-[inset_0_1px_0_rgb(255_255_255/0.09),0_1px_3px_rgb(0_0_0/0.2)] transition-[transform,width,opacity] duration-500 ${ease} ${
              active && chip ? "opacity-100" : "opacity-0"
            }`}
            style={chip ? { transform: `translateX(${chip.x}px)`, width: chip.w } : undefined}
          />
          {sections.map(({ id, label, icon }) => {
            const on = active === id;
            return (
              <li
                key={id}
                ref={(el) => {
                  items.current[id] = el;
                }}
                className="relative"
              >
                <a
                  href={`#${id}`}
                  aria-label={label}
                  aria-current={on ? "location" : undefined}
                  title={label}
                  className={`flex h-11 items-center rounded-full px-4 text-sm leading-5 font-medium tracking-[-0.0064em] transition-colors duration-300 active:scale-95 md:h-12 md:px-5 ${
                    on ? "text-foreground" : "text-muted hover-capable:hover:text-foreground"
                  }`}
                >
                  <HugeiconsIcon icon={icon} size={20} strokeWidth={1.8} />
                  {/* The label opens beside the icon on wider screens. */}
                  <span
                    className={`hidden overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-500 md:block ${ease} ${
                      on ? "ml-2 max-w-24 opacity-100" : "ml-0 max-w-0 opacity-0"
                    }`}
                  >
                    {label}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
        <a
          href={links.email}
          aria-label="Email me"
          title="Email me"
          className={`grid size-14 shrink-0 place-items-center rounded-full text-foreground transition-transform duration-300 active:scale-95 hover-capable:hover:-translate-y-0.5 md:size-[60px] ${ease} ${glass}`}
        >
          <HugeiconsIcon icon={Mail01Icon} size={20} strokeWidth={1.8} />
        </a>
      </div>
    </nav>
  );
}
