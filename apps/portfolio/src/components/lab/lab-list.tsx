import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { experiments } from "@/data/lab";
import { LabPreview } from "@/components/lab/lab-preview";
import { iconButton } from "@/lib/icon-button";

/** The Lab's cards: a live preview over the name, one line and the tags. */
export function LabList() {
  return (
    <ul className="grid gap-2.5">
      {experiments.map((e) => (
        <li key={e.slug} className="reveal">
          <Link
            href={`/lab/${e.slug}`}
            className="group flex flex-col overflow-hidden rounded-2xl bg-surface transition-[filter] hover-capable:hover:brightness-110"
          >
            <div className="grid h-[168px] place-items-center bg-inset/60">
              <LabPreview slug={e.slug} />
            </div>
            <div className="flex items-center gap-4 p-4 text-sm leading-5 tracking-[-0.0064em]">
              <div className="flex flex-1 flex-col gap-1">
                <p className="flex items-baseline gap-2">
                  <span className="font-medium text-foreground">{e.name}</span>
                  <span className="font-mono text-[10px] text-faint">{e.date}</span>
                </p>
                <p className="max-w-[420px] text-muted">{e.summary}</p>
                <p className="mt-1.5 flex flex-wrap gap-1.5">
                  {e.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-line px-2 text-[11px] leading-[18px] text-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </p>
              </div>
              <span
                className={`${iconButton} bg-raised group-hover:text-foreground`}
                aria-hidden="true"
              >
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
