// Copyright (c) 2026 Bruno Delorence. MIT License.

import styles from './themes.module.css';

/*
 * The formula theme's thumb: a single-seater racing car seen from above, nose to the right. Step
 * by step (the stylesheet reads --pos) speed lines stream off its back, the exhaust glows and the
 * car shivers on its springs. On the last step the rear wing's flap opens, the rain light blinks
 * and the car pulls ahead of its own place on the track.
 *
 * Units are px of the slider at its own size, around the thumb's middle.
 */

/** The body: narrow at the gearbox, wide at the sidepods, a long tapering nose. */
const BODY =
  'M-11 -2.2L-6.4 -3.3C-2.6 -3.6 -0.4 -3.2 1.4 -1.9L11.9 -0.9Q13.3 0 11.9 0.9L1.4 1.9' +
  'C-0.4 3.2 -2.6 3.6 -6.4 3.3L-11 2.2Z';
/** The front wing, a shallow arrow under the nose. */
const FRONT_WING = 'M9.4 -5.6L11.4 -5.4L12.4 -0.4L12.4 0.4L11.4 5.4L9.4 5.6L10.4 0Z';

export function Car({ id }: { id: string }) {
  return (
    <svg className={styles.icon} viewBox="-16 -16 32 32" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient
          id={`${id}-paint`}
          x1="0"
          y1="-4"
          x2="0"
          y2="4"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#ff5a4f" />
          <stop offset="0.5" stopColor="#e3241b" />
          <stop offset="1" stopColor="#a8130d" />
        </linearGradient>
        <radialGradient id={`${id}-heat`}>
          <stop offset="0" stopColor="#fff3c4" />
          <stop offset="0.4" stopColor="#ffa040" stopOpacity="0.8" />
          <stop offset="1" stopColor="#ff5a1f" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id={`${id}-line`}
          x1="-26"
          y1="0"
          x2="-13"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      <g className={styles.ahead}>
        <g className={styles.speedLines} stroke={`url(#${id}-line)`}>
          <path d="M-26 -3.6H-14" />
          <path d="M-24 0.4H-13.4" />
          <path d="M-27 4H-14.4" />
        </g>

        <g className={styles.chassis}>
          <circle className={styles.heat} cx="-12.4" r="3" fill={`url(#${id}-heat)`} />
          {/* Suspension, under the body. */}
          <path
            className={styles.arms}
            d="M-8.6 -2.6L-8.6 -4.6M-8.6 2.6L-8.6 4.6M6.4 -1.4L6.8 -4.2M6.4 1.4L6.8 4.2"
          />
          <g className={styles.tyres}>
            <rect x="-11" y="-6.4" width="4.8" height="2.9" rx="0.9" />
            <rect x="-11" y="3.5" width="4.8" height="2.9" rx="0.9" />
            <rect x="5" y="-5.9" width="3.8" height="2.5" rx="0.8" />
            <rect x="5" y="3.4" width="3.8" height="2.5" rx="0.8" />
          </g>
          <path className={styles.frontWing} d={FRONT_WING} />
          <path className={styles.body} d={BODY} fill={`url(#${id}-paint)`} />
          <path className={styles.stripe} d="M-9.6 0H10.6" />
          <ellipse className={styles.cockpit} cx="-1.6" rx="2.3" ry="1.25" />
          <path className={styles.cockpitHalo} d="M-3.6 -1.5Q0.4 -2 0.9 0Q0.4 2 -3.6 1.5" />
          {/* The rear wing: its fixed plane and the flap that opens on the last step. */}
          <rect className={styles.wing} x="-13.2" y="-4.8" width="1.2" height="9.6" rx="0.4" />
          <rect className={styles.flap} x="-12.2" y="-4.6" width="1.2" height="9.2" rx="0.4" />
          <rect className={styles.rainLight} x="-13.9" y="-0.7" width="0.8" height="1.4" rx="0.3" />
        </g>
      </g>
    </svg>
  );
}
