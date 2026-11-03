/**
 * The reading focus from the reference: text blurs and fades as it nears the top of the screen
 * and the floating bar at the bottom, so the lines in the middle stay sharp. Stacked layers of
 * growing blur, each masked to a shorter band, make the blur progressive instead of a hard edge.
 */
const layers = [
  { blur: 1, stop: 100 },
  { blur: 2, stop: 70 },
  { blur: 4, stop: 45 },
  { blur: 8, stop: 25 },
];

function Edge({ side }: { side: "top" | "bottom" }) {
  const to = side === "top" ? "to bottom" : "to top";
  return (
    <div
      aria-hidden="true"
      className={`edge-fade pointer-events-none fixed inset-x-0 z-30 ${
        side === "top" ? "top-0 h-16 md:h-20" : "bottom-0 h-32 md:h-36"
      }`}
    >
      {layers.map(({ blur, stop }) => (
        <div
          key={blur}
          className="absolute inset-0"
          style={{
            backdropFilter: `blur(${blur}px)`,
            WebkitBackdropFilter: `blur(${blur}px)`,
            maskImage: `linear-gradient(${to}, black 0%, transparent ${stop}%)`,
            WebkitMaskImage: `linear-gradient(${to}, black 0%, transparent ${stop}%)`,
          }}
        />
      ))}
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(${to}, var(--background) 0%, transparent 100%)` }}
      />
    </div>
  );
}

export function EdgeFade() {
  return (
    <>
      <Edge side="top" />
      <Edge side="bottom" />
    </>
  );
}
