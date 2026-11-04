// Copyright (c) 2026 Bruno Delorence. MIT License.

import styles from './themes.module.css';

/*
 * The missile theme's thumb: a slim rocket seen side on, nose to the right, with fins at the back
 * and a flame out of its nozzle. Step by step (the stylesheet reads --pos) the first wisps of vapour
 * give way to a flame that grows and flickers faster. On the last step it lifts: the nose tips up,
 * the plume blazes white with shock diamonds in it, and the body shakes.
 *
 * Units are px of the slider at its own size, around the thumb's middle.
 */

const BODY = 'M-10 -2.2L5.6 -2.2C8.8 -2.2 11.4 -1.2 13.2 0C11.4 1.2 8.8 2.2 5.6 2.2L-10 2.2Z';
const NOSE = 'M8.6 -1.85C10.6 -1.5 12 -0.8 13.2 0C12 0.8 10.6 1.5 8.6 1.85Z';
const FIN = 'M-10 -2.2L-12.3 -6.2L-9.4 -6.2L-5.8 -2.2Z';
const CANARD = 'M0.4 -2.2L-1.2 -3.9L-3.2 -3.9L-2.8 -2.2Z';
/** The flame, from the nozzle (x 0) back to the left, and its hotter middle. */
const FLAME = 'M0 -1.7C-3 -2 -8.5 -1.1 -13 0C-8.5 1.1 -3 2 0 1.7Z';
const FLAME_INNER = 'M0 -1.1C-2.4 -1.2 -5.6 -0.6 -8.4 0C-5.6 0.6 -2.4 1.2 0 1.1Z';

export function Missile({ id }: { id: string }) {
  return (
    <svg className={styles.icon} viewBox="-16 -16 32 32" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient
          id={`${id}-hull`}
          x1="0"
          y1="-2.2"
          x2="0"
          y2="2.2"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#dde2ea" />
          <stop offset="1" stopColor="#a9b2c0" />
        </linearGradient>
        <linearGradient
          id={`${id}-flame`}
          x1="-13"
          y1="0"
          x2="0"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#ff4d1a" stopOpacity="0" />
          <stop offset="0.45" stopColor="#ff7a1f" />
          <stop offset="1" stopColor="#ffc247" />
        </linearGradient>
      </defs>

      <g className={styles.rocket}>
        <g className={styles.shake}>
          <g className={styles.wisps}>
            <circle cx="-13" cy="-0.8" r="1.3" />
            <circle cx="-15.2" cy="0.6" r="1.7" />
            <circle cx="-12.6" cy="1.4" r="1" />
          </g>
          <g className={styles.flameAt}>
            <g className={styles.flame}>
              <g className={styles.boost}>
                <g className={styles.flicker}>
                  <path d={FLAME} fill={`url(#${id}-flame)`} />
                  <path className={styles.flameInner} d={FLAME_INNER} />
                  <g className={styles.diamonds}>
                    <path d="M-2.6 0L-3.6 -0.8L-4.6 0L-3.6 0.8Z" />
                    <path d="M-5.6 0L-6.5 -0.65L-7.4 0L-6.5 0.65Z" />
                    <path d="M-8.3 0L-9 -0.5L-9.7 0L-9 0.5Z" />
                  </g>
                </g>
              </g>
            </g>
          </g>
          <rect className={styles.nozzle} x="-11.3" y="-1.6" width="1.6" height="3.2" rx="0.4" />
          <path className={styles.fin} d={FIN} />
          <path className={styles.fin} d={FIN} transform="scale(1 -1)" />
          <path className={styles.hull} d={BODY} fill={`url(#${id}-hull)`} />
          <path className={styles.noseCone} d={NOSE} />
          <path className={styles.fin} d={CANARD} />
          <path className={styles.fin} d={CANARD} transform="scale(1 -1)" />
          <path className={styles.band} d="M-6.6 -2.2V2.2M2.6 -2.2V2.2" />
        </g>
      </g>
    </svg>
  );
}
