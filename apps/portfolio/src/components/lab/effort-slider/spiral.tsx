// Copyright (c) 2026 Bruno Delorence. MIT License.

import styles from './themes.module.css';

/*
 * The galaxy theme's thumb: a spiral galaxy seen face on, two arms winding out of a warm core, with
 * a few stars on them. It grows and turns faster step by step (the stylesheet reads --pos; the
 * slider sets the spin's rate). On the last step it collapses into what sits in the same drawing:
 * a black hole on a light page (a dark disc ringed by bent light, its accretion disc passing in
 * front and, lensed, over the top) or a white hole on a dark one (a blinding core throwing rings
 * and rays outwards).
 *
 * Units are px of the slider at its own size, around the thumb's middle.
 */

/** One arm: a logarithmic spiral, r = 1.1 e^(0.3 θ), as a band that thins outwards. */
function arm(turn: number) {
  const steps = 36;
  const end = Math.PI * 2.25;
  const point = (theta: number) => {
    const r = 1.1 * Math.exp(0.3 * theta);
    return [Math.cos(theta + turn) * r, Math.sin(theta + turn) * r];
  };
  const outer: string[] = [];
  const inner: string[] = [];
  for (let step = 0; step <= steps; step++) {
    const theta = (step / steps) * end;
    const [x, y] = point(theta);
    const [nx, ny] = point(theta + 0.01);
    const length = Math.hypot(nx - x, ny - y) || 1;
    // The band's half-width, from 1.25 at the core to 0.2 at the tip.
    const half = 1.25 - (step / steps) * 1.05;
    const ox = (-(ny - y) / length) * half;
    const oy = ((nx - x) / length) * half;
    outer.push(`${(x + ox).toFixed(2)} ${(y + oy).toFixed(2)}`);
    inner.unshift(`${(x - ox).toFixed(2)} ${(y - oy).toFixed(2)}`);
  }
  return `M${outer.join('L')}L${inner.join('L')}Z`;
}

const ARMS = [arm(0), arm(Math.PI)];
/** Stars on the arms, in polar terms (angle, radius, size). */
const STARS: [number, number, number][] = [
  [0.9, 5.4, 0.55],
  [2.6, 7.6, 0.45],
  [4.2, 4.6, 0.5],
  [5.5, 8.2, 0.4],
  [1.7, 3.4, 0.4],
  [3.5, 9, 0.35],
];

export function Spiral({ id }: { id: string }) {
  return (
    <svg className={styles.icon} viewBox="-16 -16 32 32" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${id}-arm`} cx="0" cy="0" r="10" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff1d6" />
          <stop offset="0.35" stopColor="#c7b2ff" />
          <stop offset="1" stopColor="#6e86ff" />
        </radialGradient>
        <radialGradient id={`${id}-core`}>
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.4" stopColor="#ffe2b3" />
          <stop offset="1" stopColor="#ffb86b" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id={`${id}-disc`}
          x1="-12"
          y1="0"
          x2="12"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#fff4d4" />
          <stop offset="0.35" stopColor="#ffb44a" />
          <stop offset="0.75" stopColor="#ff7a2e" />
          <stop offset="1" stopColor="#c2451c" />
        </linearGradient>
        <radialGradient id={`${id}-white`}>
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.3" stopColor="#fff" />
          <stop offset="0.55" stopColor="#dff3ff" stopOpacity="0.8" />
          <stop offset="1" stopColor="#9fd6ff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g className={styles.grow}>
        <g className={styles.spiral}>
          <g className={styles.spin}>
            {ARMS.map((d, index) => (
              <path key={index} d={d} className={styles.arm} fill={`url(#${id}-arm)`} />
            ))}
            {STARS.map(([angle, r, size], index) => (
              <circle
                key={index}
                className={styles.star}
                cx={(Math.cos(angle) * r).toFixed(2)}
                cy={(Math.sin(angle) * r).toFixed(2)}
                r={size}
              />
            ))}
          </g>
          <circle r="3.8" fill={`url(#${id}-core)`} />
        </g>
      </g>

      <g className={styles.blackHole}>
        {/* The far side of the disc, bent over the top by the hole's pull. */}
        <path
          className={styles.lensed}
          d="M-7.6 0A7.6 6.8 0 0 1 7.6 0"
          stroke={`url(#${id}-disc)`}
        />
        <path
          className={styles.disc}
          d="M-11.5 0A11.5 2.6 0 0 1 11.5 0"
          stroke={`url(#${id}-disc)`}
        />
        <circle className={styles.photonRing} r="5.3" />
        <circle className={styles.horizon} r="4.6" />
        {/* The near side, in front of the hole. */}
        <path
          className={styles.discFront}
          d="M-11.5 0A11.5 2.6 0 0 0 11.5 0"
          stroke={`url(#${id}-disc)`}
        />
      </g>

      <g className={styles.whiteHole}>
        <g className={styles.whiteRays}>
          {Array.from({ length: 8 }, (_, index) => (
            <path key={index} d="M0-7.2V-12.4" transform={`rotate(${index * 45 + 22.5})`} />
          ))}
        </g>
        <circle className={styles.whiteRing} r="7" />
        <circle r="7.4" fill={`url(#${id}-white)`} />
        <circle className={styles.whiteCore} r="2.6" />
      </g>
    </svg>
  );
}
