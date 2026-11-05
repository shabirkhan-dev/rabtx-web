// Copyright (c) 2026 Bruno Delorence. MIT License.

import { Payoff, THUMB_X, between, clamp01, easeOut, pick, rgba, type Rgb } from './payoff';

/*
 * The formula theme's last step: the overtake.
 *
 * - The track runs: its kerbs stream past at the edges and speed lines rush left across the tarmac.
 * - The car draws light trails, a red one from its rain light and two pale ones from its wing tips,
 *   that shoot back down the track in a third of a second and then ripple as it weaves.
 * - A whoosh, a bright band of air, sweeps from the car down the whole track on arrival and again
 *   every 2.4 s, a lap.
 * - Around the car: arcs of pushed air leave its nose on arrival, and sparks spray from under its
 *   floor where it scrapes the tarmac.
 */

export const OVERTAKE_REACH = [56, 26] as const;
const ARRIVAL = 900;
/** Where the car's rear wing is on the track, with the theme's last-step scale. */
const REAR = THUMB_X - 14;
const LAP = 2400;

const SPARKS: Rgb[] = [
  [255, 236, 170],
  [255, 176, 72],
  [255, 255, 255],
  [255, 120, 40],
];

type Line = { x: number; y: number; length: number; speed: number; alpha: number };
type Spark = { x: number; y: number; vx: number; vy: number; age: number; life: number; hue: Rgb };

export class Overtake extends Payoff {
  private lines: Line[] = [];
  private sparks: Spark[] = [];
  private clock = 0;
  private due = 0;

  constructor(track: HTMLCanvasElement, box: HTMLCanvasElement, host: HTMLElement) {
    super(track, box, host, OVERTAKE_REACH, ARRIVAL);
  }

  protected reset() {
    this.clock = 0;
    this.due = 0;
    this.sparks = [];
    this.lines = Array.from({ length: 30 }, () => this.line(between(0, REAR)));
  }

  private line(x: number): Line {
    return {
      x,
      y: between(2.5, 17.5),
      length: between(8, 34),
      speed: between(0.35, 0.8),
      alpha: between(0.15, 0.5),
    };
  }

  private spark(speed: number): Spark {
    return {
      x: between(-11, -6),
      y: pick([-3.6, 3.6]) + between(-0.8, 0.8),
      vx: -speed,
      vy: between(-0.05, 0.05),
      age: 0,
      life: between(220, 460),
      hue: pick(SPARKS),
    };
  }

  protected arrive() {
    for (let i = 0; i < 30; i++) this.sparks.push(this.spark(between(0.1, 0.32)));
  }

  protected advance(dt: number) {
    this.clock += dt;
    this.due -= dt;
    while (this.due <= 0) {
      this.due += 28;
      this.sparks.push(this.spark(between(0.06, 0.2)));
    }
    for (const line of this.lines) {
      line.x -= line.speed * dt;
      if (line.x + line.length < 0) Object.assign(line, this.line(REAR + between(0, 10)));
    }
    for (const spark of this.sparks) {
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      spark.vy += (spark.y > 0 ? 1 : -1) * 0.00012 * dt;
      spark.age += dt;
    }
    this.sparks = this.sparks.filter((spark) => spark.age < spark.life);
  }

  protected paintTrack(context: CanvasRenderingContext2D, t: number) {
    const clock = this.clock;
    // The kerbs stream past, red and white, 4 px a stripe.
    const shift = (clock * 0.3) % 8;
    context.globalAlpha = 0.9;
    for (let i = 0; i * 4 - shift < THUMB_X; i++) {
      context.fillStyle = i % 2 ? '#f4f4f4' : '#e3241b';
      context.fillRect(i * 4 - shift, 0, 4, 1.5);
      context.fillRect(i * 4 - shift, 18.5, 4, 1.5);
    }
    // Speed lines.
    for (const line of this.lines) {
      const gradient = context.createLinearGradient(line.x, 0, line.x + line.length, 0);
      gradient.addColorStop(0, 'rgb(255 255 255 / 0)');
      gradient.addColorStop(1, 'rgb(255 255 255 / 1)');
      context.globalAlpha = line.alpha;
      context.fillStyle = gradient;
      context.fillRect(line.x, line.y - 0.3, line.length, 0.6);
    }
    // The light trails: they shoot back over a third of a second, then ripple.
    const reach = REAR * easeOut(t, 0, 320);
    for (const [offset, hue, width] of [
      [-4.6, [210, 236, 255], 0.7],
      [4.6, [210, 236, 255], 0.7],
      [0, [255, 40, 40], 1.2],
    ] as const) {
      const gradient = context.createLinearGradient(REAR - reach, 0, REAR, 0);
      gradient.addColorStop(0, rgba(hue, 0));
      gradient.addColorStop(0.7, rgba(hue, 0.55));
      gradient.addColorStop(1, rgba(hue, 0.95));
      context.globalAlpha = 1;
      context.strokeStyle = gradient;
      context.lineWidth = width;
      context.lineCap = 'round';
      context.beginPath();
      for (let x = REAR; x >= REAR - reach; x -= 3) {
        const away = (REAR - x) / REAR;
        const y = 10 + offset * (1 - away * 0.25) + Math.sin((x + clock * 0.25) / 13) * 1.4 * away;
        if (x === REAR) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
    }
    // The whoosh: on arrival, then once a lap.
    const since = clock % LAP;
    const at = THUMB_X - since * 0.62;
    if (at > -30) {
      const fade = clamp01(1 - since / 380) * 0.4 + 0.45;
      const band = context.createLinearGradient(at - 26, 0, at + 6, 0);
      band.addColorStop(0, 'rgb(170 225 255 / 0)');
      band.addColorStop(0.8, `rgb(225 245 255 / ${fade})`);
      band.addColorStop(1, 'rgb(255 255 255 / 0)');
      context.globalAlpha = 1;
      context.fillStyle = band;
      context.fillRect(at - 26, 0, 32, 20);
    }
  }

  protected paintBox(context: CanvasRenderingContext2D, t: number) {
    // Pushed air leaves the nose on arrival.
    if (t < ARRIVAL) {
      context.lineCap = 'round';
      for (const delay of [0, 110, 220]) {
        if (t < delay) continue;
        const k = easeOut(t, delay, delay + 520);
        context.globalAlpha = (1 - k) * 0.85;
        context.strokeStyle = this.dark ? '#cfeaff' : '#4e8fd6';
        context.lineWidth = 1.2 * (1 - k) + 0.4;
        context.beginPath();
        context.arc(6 + 26 * k, 0, 9 + 6 * k, -0.75, 0.75);
        context.stroke();
      }
    }
    for (const spark of this.sparks) {
      const k = spark.age / spark.life;
      context.globalAlpha = 1 - k;
      context.strokeStyle = rgba(spark.hue);
      context.lineWidth = 0.7;
      context.beginPath();
      context.moveTo(spark.x, spark.y);
      context.lineTo(spark.x - spark.vx * 14, spark.y - spark.vy * 14);
      context.stroke();
    }
  }
}
