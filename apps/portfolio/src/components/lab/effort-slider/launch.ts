// Copyright (c) 2026 Bruno Delorence. MIT License.

import { Payoff, THUMB_X, between, clamp01, easeOut, pick, rgba, type Rgb } from './payoff';

/*
 * The missile theme's last step: the launch.
 *
 * - On arrival a flash of plume lights the thumb and two shockwave rings spread from the nozzle,
 *   flattened as if over the ground.
 * - Smoke billows: puffs leave the nozzle down and back, hit the bottom of the track, roll left
 *   along it, swell and thin out. The first second throws a big cloud at once. Near the nozzle the
 *   smoke is lit orange by the flame.
 * - Embers fly back out of the plume, and a faint heat ripple leaves the nozzle every 1.8 s.
 */

export const LAUNCH_REACH = [50, 34] as const;
const ARRIVAL = 1000;
/** The nozzle, around the thumb's middle, with the rocket tipped up 12° and lifted. */
const NOZZLE = [-11, 0.9] as const;
/** The exhaust's way: back and a little down. */
const EXHAUST = [-0.978, 0.208] as const;

const EMBERS: Rgb[] = [
  [255, 226, 140],
  [255, 160, 60],
  [255, 250, 230],
  [255, 110, 40],
];

type Puff = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  grow: number;
  age: number;
  life: number;
  shade: number;
};
type Ember = { x: number; y: number; vx: number; vy: number; age: number; life: number; hue: Rgb };

export class Launch extends Payoff {
  private puffs: Puff[] = [];
  private embers: Ember[] = [];
  private clock = 0;
  private due = 0;

  constructor(track: HTMLCanvasElement, box: HTMLCanvasElement, host: HTMLElement) {
    super(track, box, host, LAUNCH_REACH, ARRIVAL);
  }

  protected reset() {
    this.puffs = [];
    this.embers = [];
    this.clock = 0;
    this.due = 0;
  }

  private puff(speed: number, spread: number): Puff {
    const angle = between(-spread, spread);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: THUMB_X + NOZZLE[0] - 2,
      y: 10 + NOZZLE[1],
      vx: (EXHAUST[0] * cos - EXHAUST[1] * sin) * speed,
      vy: (EXHAUST[0] * sin + EXHAUST[1] * cos) * speed,
      r: between(1, 1.8),
      grow: between(0.0025, 0.005),
      age: 0,
      life: between(1500, 2600),
      shade: Math.random(),
    };
  }

  private ember(speed: number): Ember {
    const angle = between(-0.5, 0.5);
    return {
      x: NOZZLE[0] - 4,
      y: NOZZLE[1],
      vx: (EXHAUST[0] * Math.cos(angle) - EXHAUST[1] * Math.sin(angle)) * speed,
      vy: (EXHAUST[0] * Math.sin(angle) + EXHAUST[1] * Math.cos(angle)) * speed,
      age: 0,
      life: between(280, 620),
      hue: pick(EMBERS),
    };
  }

  protected arrive() {
    for (let i = 0; i < 44; i++) this.puffs.push(this.puff(between(0.25, 0.6), 0.7));
    for (let i = 0; i < 26; i++) this.embers.push(this.ember(between(0.08, 0.2)));
  }

  protected advance(dt: number) {
    this.clock += dt;
    this.due -= dt;
    while (this.due <= 0) {
      this.due += 24;
      this.puffs.push(this.puff(between(0.14, 0.28), 0.35));
      if (Math.random() < 0.6) this.embers.push(this.ember(between(0.05, 0.14)));
    }
    const drag = 0.9975 ** dt;
    for (const puff of this.puffs) {
      puff.vx *= drag;
      puff.vy *= drag;
      // The ground: the bottom of the track turns the smoke along it.
      if (puff.y + puff.r * 0.5 > 19 && puff.vy > 0) {
        puff.vx -= puff.vy * 0.6;
        puff.vy *= -0.15;
      }
      // Smoke rises a little as it cools.
      puff.vy -= 0.00002 * dt;
      puff.x += puff.vx * dt;
      puff.y += puff.vy * dt;
      puff.r += puff.grow * dt;
      puff.age += dt;
    }
    this.puffs = this.puffs.filter((puff) => puff.age < puff.life && puff.x + puff.r > -2);
    for (const ember of this.embers) {
      ember.x += ember.vx * dt;
      ember.y += ember.vy * dt;
      ember.vy += 0.00025 * dt;
      ember.age += dt;
    }
    this.embers = this.embers.filter((ember) => ember.age < ember.life);
  }

  protected paintTrack(context: CanvasRenderingContext2D) {
    const nozzleX = THUMB_X + NOZZLE[0];
    // The flame lights the smoke near it.
    const glow = context.createRadialGradient(nozzleX, 11, 0, nozzleX, 11, 34);
    glow.addColorStop(0, 'rgb(255 190 90 / 0.75)');
    glow.addColorStop(0.4, 'rgb(255 140 50 / 0.3)');
    glow.addColorStop(1, 'rgb(255 120 40 / 0)');
    context.fillStyle = glow;
    context.fillRect(nozzleX - 34, 0, 68, 20);

    for (const puff of this.puffs) {
      const k = puff.age / puff.life;
      const fade = clamp01(puff.age / 120) * (1 - k) ** 1.4;
      // Lit warm near the nozzle, cooling to the smoke's grey.
      const heat = clamp01(1 - (nozzleX - puff.x) / 40);
      const base = this.dark ? 96 + puff.shade * 40 : 196 + puff.shade * 50;
      const r = base + (255 - base) * heat * 0.8;
      const g = base + (190 - base) * heat * 0.8;
      const b = base + (120 - base) * heat * 0.8 + (this.dark ? 6 : 8);
      context.globalAlpha = fade * (this.dark ? 0.7 : 0.85);
      context.fillStyle = `rgb(${r} ${g} ${b})`;
      context.beginPath();
      context.arc(puff.x, puff.y, puff.r, 0, Math.PI * 2);
      context.fill();
      // A lighter top, so each puff reads round.
      context.globalAlpha = fade * 0.35;
      context.fillStyle = this.dark ? 'rgb(170 172 180)' : '#fff';
      context.beginPath();
      context.arc(puff.x - puff.r * 0.2, puff.y - puff.r * 0.3, puff.r * 0.55, 0, Math.PI * 2);
      context.fill();
    }
  }

  protected paintBox(context: CanvasRenderingContext2D, t: number) {
    const [nx, ny] = NOZZLE;
    if (t < ARRIVAL) {
      // The plume's flash.
      const flash = 1 - clamp01(t / 520);
      const light = context.createRadialGradient(nx - 4, ny, 0, nx - 4, ny, 26);
      light.addColorStop(0, `rgb(255 250 225 / ${flash})`);
      light.addColorStop(0.35, `rgb(255 196 90 / ${flash * 0.6})`);
      light.addColorStop(1, 'rgb(255 140 40 / 0)');
      context.fillStyle = light;
      context.fillRect(nx - 30, ny - 26, 52, 52);
      // Two shockwaves, flattened as over the ground.
      for (const [delay, reach] of [
        [0, 46],
        [150, 30],
      ]) {
        if (t < delay) continue;
        const k = easeOut(t, delay, delay + 620);
        context.globalAlpha = (1 - k) * 0.9;
        context.strokeStyle = this.dark ? 'rgb(255 240 220)' : 'rgb(110 118 136)';
        context.lineWidth = 2.2 * (1 - k) + 0.4;
        context.beginPath();
        context.ellipse(nx, ny, 3 + reach * k, (3 + reach * k) * 0.6, 0, 0, Math.PI * 2);
        context.stroke();
      }
    }
    // A heat ripple every 1.8 s.
    const k = (this.clock % 1800) / 1800;
    context.globalAlpha = 0.3 * (1 - k);
    context.strokeStyle = this.dark ? 'rgb(255 214 170)' : 'rgb(150 156 170)';
    context.lineWidth = 0.7;
    context.beginPath();
    context.ellipse(nx, ny, 4 + 22 * k, (4 + 22 * k) * 0.6, 0, 0, Math.PI * 2);
    context.stroke();
    for (const ember of this.embers) {
      context.globalAlpha = 1 - ember.age / ember.life;
      context.fillStyle = rgba(ember.hue);
      context.fillRect(ember.x - 0.55, ember.y - 0.55, 1.1, 1.1);
    }
  }
}
