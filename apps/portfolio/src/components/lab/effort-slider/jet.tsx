// Copyright (c) 2026 Bruno Delorence. MIT License.

import styles from './themes.module.css';

/*
 * The jet theme's thumb: a swing-wing fighter seen from above, nose to the right. Step by step (the
 * stylesheet reads --pos) its wings sweep back from spread to tucked, and from the middle steps
 * the afterburner lights. On the last step it breaks the sound barrier: a vapour cone blooms over
 * it from the nose back, and the flame shows its shock diamonds.
 *
 * Units are px of the slider at its own size, around the thumb's middle.
 */

const FUSELAGE = 'M-12 -1.4L5.8 -1.6C9 -1.5 11.6 -0.8 13.6 0C11.6 0.8 9 1.5 5.8 1.6L-12 1.4Z';
/** The upper wing, pivoting at (0.6, -1.2); the lower is its mirror. */
const WING = 'M2.2 -1.4L-1.4 -10.4L-3.6 -10.4L-3.8 -1.4Z';
const TAIL = 'M-7.6 -1.3L-10.8 -5.2L-12.4 -5.2L-11.6 -1.3Z';
/** The vapour cone: a bell from just behind the nose that opens backwards. */
const CONE =
  'M7.4 0C6 -2.6 3.2 -7.2 -1 -10.6C-4 -12.8 -7.6 -13.6 -9.4 -13.4C-8.6 -11 -8.6 11 -9.4 13.4' +
  'C-7.6 13.6 -4 12.8 -1 10.6C3.2 7.2 6 2.6 7.4 0Z';

export function Jet({ id }: { id: string }) {
  return (
    <svg className={styles.icon} viewBox="-16 -16 32 32" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient
          id={`${id}-skin`}
          x1="0"
          y1="-1.6"
          x2="0"
          y2="1.6"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#eef2f6" />
          <stop offset="1" stopColor="#a7b3c2" />
        </linearGradient>
        <linearGradient
          id={`${id}-burner`}
          x1="-24"
          y1="0"
          x2="-12"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#ff6a1f" stopOpacity="0" />
          <stop offset="0.5" stopColor="#ff9a3a" />
          <stop offset="0.85" stopColor="#ffe7a8" />
          <stop offset="1" stopColor="#bfe3ff" />
        </linearGradient>
        <radialGradient id={`${id}-cone`} cx="7" cy="0" r="17" gradientUnits="userSpaceOnUse">
          <stop offset="0.25" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="0.75" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.9" />
        </radialGradient>
      </defs>

      <g className={styles.burner}>
        <g className={styles.boost}>
          <g className={styles.flicker}>
            <path
              d="M-12 -1.2C-15 -1.4 -20 -0.7 -24 0C-20 0.7 -15 1.4 -12 1.2Z"
              fill={`url(#${id}-burner)`}
            />
            <g className={styles.diamonds}>
              <path d="M-14 0L-14.9 -0.7L-15.8 0L-14.9 0.7Z" />
              <path d="M-16.9 0L-17.7 -0.55L-18.5 0L-17.7 0.55Z" />
            </g>
          </g>
        </g>
      </g>
      <path className={styles.tail} d={TAIL} />
      <path className={styles.tail} d={TAIL} transform="scale(1 -1)" />
      <g className={styles.wingUp}>
        <path className={styles.wingSkin} d={WING} />
      </g>
      <g className={styles.wingDown}>
        <path className={styles.wingSkin} d={WING} transform="scale(1 -1)" />
      </g>
      <path className={styles.fuselage} d={FUSELAGE} fill={`url(#${id}-skin)`} />
      <ellipse className={styles.canopy} cx="6.4" rx="2.5" ry="0.85" />
      <g className={styles.coneAt}>
        <path className={styles.cone} d={CONE} fill={`url(#${id}-cone)`} />
      </g>
    </svg>
  );
}
