/**
 * Hand-drawn marks on a word in the intro: a highlighter swipe, a pen circle or a loose
 * underline. Each path draws itself in once on load (see `.scribble` in globals.css) and
 * stays still for people who prefer reduced motion.
 */
type Kind = "marker" | "circle" | "underline";

type Mark = {
  /** Where the mark sits around the word. */
  box: string;
  viewBox: string;
  path: string;
  stroke: string;
  width: number;
};

const marks: Record<Kind, Mark> = {
  marker: {
    // Behind the word, slightly lower than centre, like a real highlighter pass.
    box: "-inset-x-0.5 top-[6px] bottom-0 -z-10",
    viewBox: "0 0 100 20",
    path: "M3 11 C 25 9.5, 55 10.5, 97 9",
    stroke: "var(--mark)",
    width: 11,
  },
  circle: {
    box: "-inset-x-2.5 -inset-y-1.5",
    viewBox: "0 0 100 40",
    path: "M62 4 C 22 1, 2 11, 4 22 C 6 34, 40 39, 70 35 C 94 32, 99 18, 91 10 C 83 3, 58 1, 36 7",
    stroke: "var(--new)",
    width: 1.5,
  },
  underline: {
    box: "inset-x-0 -bottom-[7px] h-[9px]",
    viewBox: "0 0 100 10",
    path: "M1 6 C 18 3, 38 8, 56 5 S 86 3, 99 6",
    stroke: "var(--new)",
    width: 1.5,
  },
};

export function Scribble({
  kind,
  delay = 0,
  children,
}: {
  kind: Kind;
  /** Seconds to wait before drawing, so several marks land one after another. */
  delay?: number;
  children: React.ReactNode;
}) {
  const mark = marks[kind];
  return (
    <span className="relative isolate inline-block whitespace-nowrap">
      {children}
      {/* The span takes the size; an absolutely placed <svg> would keep its intrinsic size. */}
      <span className={`pointer-events-none absolute ${mark.box}`} aria-hidden="true">
        <svg
          className="scribble block size-full overflow-visible"
          viewBox={mark.viewBox}
          preserveAspectRatio="none"
          style={{ "--delay": `${delay}s` } as React.CSSProperties}
        >
          <path
            d={mark.path}
            pathLength={1}
            fill="none"
            stroke={mark.stroke}
            strokeWidth={mark.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </span>
    </span>
  );
}
