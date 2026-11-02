"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const arrow =
  "absolute top-1/2 hidden size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-line bg-background/80 text-foreground transition-opacity disabled:pointer-events-none disabled:opacity-0 hover-capable:grid";

/** Product screens one at a time: swipe on touch, arrows with a mouse or keys, dots for position. */
export function ScreenshotCarousel({ images, alt }: { images: string[]; alt: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const many = images.length > 1;

  function go(to: number) {
    const el = track.current;
    if (!el) return;
    el.scrollTo({ left: to * el.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="flex w-full flex-col gap-2.5">
      <div className="relative">
        <div
          ref={track}
          tabIndex={many ? 0 : undefined}
          role={many ? "region" : undefined}
          aria-label={many ? `${alt} screens, use the arrow keys to move` : undefined}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft" && index > 0) {
              event.preventDefault();
              go(index - 1);
            } else if (event.key === "ArrowRight" && index < images.length - 1) {
              event.preventDefault();
              go(index + 1);
            }
          }}
          onScroll={(event) => {
            const el = event.currentTarget;
            setIndex(Math.round(el.scrollLeft / el.clientWidth));
          }}
          className="flex snap-x snap-mandatory overflow-x-auto rounded-[14px] outline-offset-2 focus-visible:outline-2 focus-visible:outline-foreground border border-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- pre-sized static asset
            <img
              key={src}
              src={src}
              alt={`${alt}, screen ${i + 1} of ${images.length}`}
              loading={i === 0 ? "eager" : "lazy"}
              className="aspect-[16/10] w-full shrink-0 snap-center object-cover object-left-top"
            />
          ))}
        </div>
        {many ? (
          <>
            <button
              type="button"
              aria-label="Previous screen"
              disabled={index === 0}
              onClick={() => go(index - 1)}
              className={`${arrow} left-3`}
            >
              <ChevronLeft className="size-4" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              aria-label="Next screen"
              disabled={index === images.length - 1}
              onClick={() => go(index + 1)}
              className={`${arrow} right-3`}
            >
              <ChevronRight className="size-4" strokeWidth={1.5} />
            </button>
          </>
        ) : null}
      </div>
      {many ? (
        <div className="flex justify-center gap-1.5">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-current={i === index ? "true" : undefined}
              aria-label={`Show screen ${i + 1} of ${images.length}`}
              onClick={() => go(i)}
              className={`h-1.5 cursor-pointer rounded-full transition-[width,background-color] ${
                i === index ? "w-4 bg-foreground" : "w-1.5 bg-line"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
