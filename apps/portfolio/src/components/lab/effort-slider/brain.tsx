// Copyright (c) 2026 Bruno Delorence. MIT License.

/*
 * The thumb's drawing: a brain seen from above, two lobed halves either side of a gap, each with a
 * fold that branches from the middle. One path draws the left half and a mirror of it the right.
 *
 * Units are px of the slider at its own size (13 px type), around the brain's middle. Each half is
 * painted twice in one go: a thick round stroke first, which becomes the dark outline outside the
 * fill and fills the gap, the fold and the notches, then the fill over the inner half of it.
 */

/** The left half, its edges in px from the brain's middle. */
export const HALF =
  'M-1.2-7.3C-1.2-8.4-2-9-3.1-9C-4.3-9-5.1-8.3-5.1-7.2L-5.1-6.2C-5.1-5.6-4.9-5.2-4.6-4.9' +
  'C-5.4-4.5-6.2-5.2-7-5.1C-7.8-5-8.1-4.3-8.1-3.6L-8.1-2.6C-8.1-2-7.3-1.8-7.3-1.2' +
  'C-7.3-0.6-8.1-0.3-8.6 0.3C-9 0.7-9.1 1.2-9.1 1.8L-9.1 3.4C-9.1 4.4-8.3 4.9-7.4 5' +
  'C-6.6 5.1-5.6 5.6-5 6.1C-5.9 6.4-6.6 7-6.6 8C-6.6 9-5.5 9.6-4.3 9.6' +
  'C-2.6 9.6-1.2 8.5-1.2 6.8L-1.2 1.4C-1.6 1.4-2.2 1.9-3 2C-3.8 2.1-4.4 2-4.7 1.6' +
  'C-5 1.2-4.8 0.7-4.3 0.5C-3.5 0.1-2.6-0.6-2.2-1.2C-1.9-1.7-1.6-2.3-1.2-2.4Z';

/** How much larger the brain grows at the last stop. */
export const GROWN = 1.3;

function Halves({ className }: { className: string }) {
  return (
    <g className={className}>
      <path d={HALF} />
      <path d={HALF} transform="scale(-1 1)" />
    </g>
  );
}

/**
 * Both brains in one drawing: the everyday one, pink, and the last stop's, blue to violet. The
 * stylesheet fades one into the other; `gradient` must be unique on the page.
 */
export function Brain({
  className,
  pinkClass,
  galaxyClass,
  gradient,
}: {
  className: string;
  pinkClass: string;
  galaxyClass: string;
  gradient: string;
}) {
  return (
    <svg className={className} viewBox="-12 -12 24 24" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradient} x1="-8" y1="-9" x2="8" y2="9" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#93bbfd" />
          <stop offset="0.5" stopColor="#9172f7" />
          <stop offset="1" stopColor="#ca7cee" />
        </linearGradient>
      </defs>
      <Halves className={pinkClass} />
      <g className={galaxyClass} fill={`url(#${gradient})`}>
        <path d={HALF} />
        <path d={HALF} transform="scale(-1 1)" />
      </g>
    </svg>
  );
}
