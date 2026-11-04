// Copyright (c) 2026 Bruno Delorence. MIT License.

import { Payoff, THUMB_X, between, clamp01, easeOut } from './payoff';

/*
 * The jet theme's last step: breaking the sound barrier. The vapour cone itself is part of the
 * thumb's drawing (jet.tsx); this draws what goes with it.
 *
 * - On arrival, the boom: three ring shocks spread from the jet, a beat apart, and a shock front, a
 *   hard bright edge with a glow behind it, sweeps the whole track from the jet to the left end.
 * - The track becomes a streaked sky: thin wind lines rush left past the jet, fast, and two
 *   contrails trail from its wing tips, swelling and drifting as they age.
 * - Specks of condensation peel off the cone's rim and fall back; a faint ring leaves the jet every
 *   two seconds.
 */

export const SONIC_REACH = [46, 34] as const;
const ARRIVAL = 1100;
/** Where the contrails start, around the thumb's middle: the swept wings' tips. */
const TIPS = [-6, 7.2] as const;

type Streak = { x: number; y: number; length: number; speed: number; alpha: number; width: number };
type Speck = { x: number; y: number; vx: number; vy: number; age: number; life: number };

/** A point on the vapour cone's rim, from its nose (0) to its open end (1), above or below. */
const rim = (s: number, side: number) => [
  7 - 16 * s,
  side * (2 + 11.5 * Math.sin((s * Math.PI) / 2)),
];

export class Sonic extends Payoff {
  private streaks: Streak[] = [];
  private specks: Speck[] = [];
  private clock = 0;
  private due = 0;

  constructor(track: HTMLCanvasElement, box: HTMLCanvasElement, host: HTMLElement) {
    super(track, box, host, SONIC_REACH, ARRIVAL);
  }

  protected reset() {
    this.clock = 0;
    this.due = 0;
    this.specks = [];
    this.streaks = Array.from({ length: 40 }, () => this.streak(between(0, THUMB_X)));
  }

  private streak(x: number): Streak {
    return {
      x,
      y: between(1, 19),
      length: between(12, 46),
      speed: between(0.55, 1.3),
      alpha: between(0.2, 0.65),
      width: between(0.4, 0.9),
    };
  }

  private speck(): Speck {
    const [x, y] = rim(between(0.2, 1), Math.random() < 0.5 ? -1 : 1);
    return { x, y, vx: -between(0.05, 0.13), vy: y * 0.002, age: 0, life: between(300, 700) };
  }

  protected arrive() {
    for (let i = 0; i < 24; i++) this.specks.push(this.speck());
  }

  protected advance(dt: number) {
    this.clock += dt;
    this.due -= dt;
    while (this.due <= 0) {
      this.due += 30;
      this.specks.push(this.speck());
    }
    for (const streak of this.streaks) {
      streak.x -= streak.speed * dt;
      if (streak.x + streak.length < 0)
        Object.assign(streak, this.streak(THUMB_X + between(-10, 4)));
    }
    for (const speck of this.specks) {
      speck.x += speck.vx * dt;
      speck.y += speck.vy * dt;
      speck.age += dt;
    }
    this.specks = this.specks.filter((speck) => speck.age < speck.life);
  }

  protected paintTrack(context: CanvasRenderingContext2D, t: number) {
    const clock = this.clock;
    const ink = this.dark ? '226 238 255' : '255 255 255';
    for (const streak of this.streaks) {
      const gradient = context.createLinearGradient(streak.x, 0, streak.x + streak.length, 0);
      gradient.addColorStop(0, `rgb(${ink} / 0)`);
      gradient.addColorStop(1, `rgb(${ink} / 1)`);
      context.globalAlpha = streak.alpha;
      context.fillStyle = gradient;
      context.fillRect(streak.x, streak.y - streak.width / 2, streak.length, streak.width);
    }
    // The contrails, from the wing tips: swelling, drifting and thinning as they age.
    const start = THUMB_X + TIPS[0];
    context.fillStyle = `rgb(${ink})`;
    for (const side of [-1, 1]) {
      for (let x = start; x > 0; x -= 2) {
        const age = (start - x) / start;
        const y =
          10 + side * TIPS[1] * (1 - age * 0.3) + Math.sin((x + clock * 0.4) / 9) * age * 1.6;
        context.globalAlpha = 0.75 * (1 - age) ** 1.3;
        context.beginPath();
        context.arc(x, y, 0.55 + age * 2.4, 0, Math.PI * 2);
        context.fill();
      }
    }
    // The shock front sweeps the track on arrival.
    if (t < ARRIVAL) {
      const at = THUMB_X - t * 0.36;
      const fade = 1 - clamp01((t - 300) / 260);
      context.globalAlpha = 1;
      const glow = context.createLinearGradient(at, 0, at + 40, 0);
      glow.addColorStop(0, `rgb(255 255 255 / ${0.9 * fade})`);
      glow.addColorStop(1, 'rgb(255 255 255 / 0)');
      context.fillStyle = glow;
      context.fillRect(at, 0, 40, 20);
      context.fillStyle = `rgb(255 255 255 / ${fade})`;
      context.fillRect(at - 0.6, 0, 1.2, 20);
    }
  }

  protected paintBox(context: CanvasRenderingContext2D, t: number) {
    const ring = this.dark ? '232 244 255' : '74 136 214';
    if (t < ARRIVAL) {
      for (const delay of [0, 120, 260]) {
        if (t < delay) continue;
        const k = easeOut(t, delay, delay + 700);
        context.globalAlpha = (1 - k) * 0.9;
        context.strokeStyle = `rgb(${ring})`;
        context.lineWidth = 1.6 * (1 - k) + 0.35;
        context.beginPath();
        context.ellipse(2, 0, 6 + 40 * k, (6 + 40 * k) * 0.82, 0, 0, Math.PI * 2);
        context.stroke();
      }
    }
    const k = (this.clock % 2000) / 2000;
    context.globalAlpha = 0.28 * (1 - k);
    context.strokeStyle = `rgb(${ring})`;
    context.lineWidth = 0.6;
    context.beginPath();
    context.ellipse(2, 0, 9 + 22 * k, (9 + 22 * k) * 0.82, 0, 0, Math.PI * 2);
    context.stroke();
    context.fillStyle = this.dark ? '#fff' : 'rgb(120 168 226)';
    for (const speck of this.specks) {
      context.globalAlpha = (1 - speck.age / speck.life) * 0.9;
      context.fillRect(speck.x - 0.5, speck.y - 0.5, 1, 1);
    }
  }
}
