// Copyright (c) 2026 Bruno Delorence. MIT License.

import { GROWN, HALF } from './brain';

/*
 * The last stop's two canvases.
 *
 * - The mosaic fills the track: a grid of small rounded squares, 4 px apart in 5 rows, each with a
 *   colour of its own and a brightness that steps now and then, so the track twinkles like a patch
 *   of sky. Squares are fewer and dimmer towards the left, where the effort is lowest.
 * - The burst sits on the thumb: dotted rays all around the brain that twinkle, sparks on the brain
 *   itself, and, as the stop is reached, a ring of coloured specks that flies out from the brain
 *   while the rays shoot outwards.
 *
 * Everything twinkles in steps, 7.5 times a second; only the burst, for its first second, draws
 * every frame. Nothing runs while the slider is off screen, the tab is hidden, or the reader asks
 * for less motion (then a still frame is drawn instead). The colours are the night sky's on both
 * schemes, so they live here rather than in the stylesheet.
 *
 * Units are px of the slider at its own size (13 px type); `unit` scales them to the page.
 */

type Rgb = readonly [number, number, number];

/** The mosaic's colours: orchid, magenta, violet, pale lilac, cyan, sky, mauve. */
const CELL_HUES: Rgb[] = [
  [216, 122, 217],
  [195, 103, 189],
  [144, 119, 245],
  [225, 223, 238],
  [131, 223, 235],
  [124, 190, 223],
  [169, 155, 175],
];
/** The rays' specks: grey, teal, lilac and a near-white. */
const RAY_HUES: Rgb[] = [
  [150, 150, 168],
  [96, 168, 170],
  [146, 136, 206],
  [196, 196, 214],
];
/** Sparks on the brain. */
const SPARK_HUES: Rgb[] = [
  [242, 240, 252],
  [143, 242, 253],
  [215, 211, 251],
  [184, 212, 255],
];
/** The ring that flies out. */
const BURST_HUES: Rgb[] = [
  [240, 138, 214],
  [127, 233, 245],
  [107, 77, 255],
  [255, 255, 255],
  [90, 108, 255],
  [201, 184, 255],
];

/** The track, and the mosaic's grid on it. */
export const TRACK_WIDTH = 196;
const TRACK_HEIGHT = 20;
const PITCH = 4;
const CELL = 3;
const COLUMNS = TRACK_WIDTH / PITCH;
const ROWS = TRACK_HEIGHT / PITCH;
/** The brightness steps a lit square can take. */
const LEVELS = [0.45, 0.6, 0.8, 1];
/** Ms between twinkles. */
const STEP = 133;
/** Half the burst canvas, around the thumb's middle. */
export const REACH = 50;
/** Where the rays start: just outside the grown brain. */
const RAY_START = 16;
/** How long the burst draws every frame. */
const BURST = 1000;

const rgb = ([r, g, b]: Rgb) => `rgb(${r} ${g} ${b})`;
const pick = <T>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];

type Cell = { hue: Rgb; level: number; flash: boolean };
type Ray = { angle: number; length: number; specks: { hue: Rgb; level: number }[] };
type Spark = { x: number; y: number; hue: Rgb; life: number };
type Speck = { angle: number; spread: number; speed: number; fade: number; hue: Rgb };

/** How likely a square is lit, and how bright it can be, from 0 at the left to 1 at the right. */
const presence = (x: number) => 0.4 + 0.5 * x;
const ramp = (x: number) => 0.3 + 0.7 * x ** 1.1;

export class Galaxy {
  private mosaic: CanvasRenderingContext2D;
  private burst: CanvasRenderingContext2D;
  private cells: Cell[] = [];
  private rays: Ray[] = [];
  private sparks: Spark[] = [];
  private specks: Speck[] = [];
  /** Points inside the grown brain, for sparks. */
  private inside: { x: number; y: number }[] = [];
  private unit = 1;
  private ratio = 1;
  private on = false;
  private started = 0;
  private lastStep = 0;
  private frame = 0;
  private visible = false;
  private reduced = false;
  private cleanups: (() => void)[] = [];

  constructor(
    private mosaicCanvas: HTMLCanvasElement,
    private burstCanvas: HTMLCanvasElement,
    /** The element whose width is the track's: it sets the scale. */
    private track: HTMLElement,
  ) {
    this.mosaic = mosaicCanvas.getContext('2d')!;
    this.burst = burstCanvas.getContext('2d')!;
    this.seed();

    const resize = new ResizeObserver(() => this.resize());
    resize.observe(track);
    const seen = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.update();
    });
    seen.observe(track);
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const readMotion = () => {
      this.reduced = motion.matches;
      this.update();
    };
    this.reduced = motion.matches;
    motion.addEventListener('change', readMotion);
    const onVisibility = () => this.update();
    document.addEventListener('visibilitychange', onVisibility);
    this.cleanups.push(
      () => resize.disconnect(),
      () => seen.disconnect(),
      () => motion.removeEventListener('change', readMotion),
      () => document.removeEventListener('visibilitychange', onVisibility),
    );
    this.resize();
  }

  /** Turns the last stop on or off; `burst` plays the arrival. */
  set(on: boolean, burst: boolean) {
    const arriving = on && !this.on;
    this.on = on;
    if (arriving) {
      this.seed();
      this.started = burst && !this.reduced ? performance.now() : -Infinity;
      if (burst && !this.reduced) this.launch();
    }
    this.update();
  }

  destroy() {
    cancelAnimationFrame(this.frame);
    for (const cleanup of this.cleanups) cleanup();
  }

  /** Lays out a fresh sky: the squares, the rays and the points the sparks may take. */
  private seed() {
    this.cells = [];
    for (let row = 0; row < ROWS; row++)
      for (let column = 0; column < COLUMNS; column++) {
        const cell: Cell = { hue: pick(CELL_HUES), level: 0, flash: false };
        this.roll(cell, column / (COLUMNS - 1));
        this.cells.push(cell);
      }
    const count = 14;
    this.rays = Array.from({ length: count }, (_, index) => {
      const length = 30 + Math.random() * 16;
      const specks = Array.from({ length: Math.floor((length - RAY_START) / 3) + 1 }, () => ({
        hue: pick(RAY_HUES),
        level: Math.random(),
      }));
      return {
        angle: ((index + (Math.random() - 0.5) * 0.6) / count) * Math.PI * 2,
        length,
        specks,
      };
    });
    if (!this.inside.length) {
      const left = new Path2D(HALF);
      const both = new Path2D();
      both.addPath(left);
      both.addPath(left, new DOMMatrix([-1, 0, 0, 1, 0, 0]));
      const context = this.burst;
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      const fits = (x: number, y: number) =>
        [
          [0, 0],
          [1.2, 0],
          [-1.2, 0],
          [0, 1.2],
          [0, -1.2],
        ].every(([dx, dy]) => context.isPointInPath(both, x + dx, y + dy));
      for (let y = -8.5; y <= 8.5; y += 1)
        for (let x = -8.5; x <= 8.5; x += 1)
          if (fits(x, y)) this.inside.push({ x: x * GROWN, y: y * GROWN });
      context.restore();
    }
    this.sparks = [];
  }

  /** A square's new brightness: lit or not, more often lit towards the right. */
  private roll(cell: Cell, x: number) {
    cell.flash = false;
    cell.level = Math.random() < presence(x) ? pick(LEVELS) : 0;
  }

  /** The ring of specks that flies out from the brain. */
  private launch() {
    const count = 28;
    this.specks = Array.from({ length: count }, (_, index) => ({
      angle: ((index + (Math.random() - 0.5) * 0.5) / count) * Math.PI * 2,
      spread: 0.8 + Math.random() * 0.5,
      speed: 0.6 + Math.random() * 0.9,
      fade: 0.7 + Math.random() * 0.6,
      hue: pick(BURST_HUES),
    }));
  }

  /** One twinkle: some squares, specks and sparks change. */
  private twinkle() {
    this.cells.forEach((cell, index) => {
      if (Math.random() > 0.12) return;
      const x = (index % COLUMNS) / (COLUMNS - 1);
      if (Math.random() < 0.03 * x) {
        cell.flash = true;
        cell.level = 1;
      } else this.roll(cell, x);
    });
    for (const ray of this.rays)
      for (const speck of ray.specks) if (Math.random() < 0.25) speck.level = Math.random();
    this.sparks = this.sparks.filter((spark) => --spark.life > 0);
    while (this.sparks.length < 7 && this.inside.length) {
      const at = pick(this.inside);
      this.sparks.push({ ...at, hue: pick(SPARK_HUES), life: 2 + Math.floor(Math.random() * 4) });
    }
  }

  private resize() {
    const unit = this.track.offsetWidth / TRACK_WIDTH;
    if (!unit) return;
    this.unit = unit;
    this.ratio = Math.min(window.devicePixelRatio || 1, 2);
    const size = (canvas: HTMLCanvasElement, width: number, height: number) => {
      canvas.width = Math.round(width * unit * this.ratio);
      canvas.height = Math.round(height * unit * this.ratio);
    };
    size(this.mosaicCanvas, TRACK_WIDTH, TRACK_HEIGHT);
    size(this.burstCanvas, REACH * 2, REACH * 2);
    this.draw(performance.now());
  }

  /** Runs the loop while it can be seen and moved; otherwise draws one still frame. */
  private update() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    if (!this.on) return;
    if (this.visible && !document.hidden && !this.reduced) {
      const tick = (now: number) => {
        let changed = now - this.started < BURST + 100;
        if (now - this.lastStep >= STEP) {
          this.lastStep = now;
          this.twinkle();
          changed = true;
        }
        if (changed) this.draw(now);
        this.frame = requestAnimationFrame(tick);
      };
      this.frame = requestAnimationFrame(tick);
    } else {
      if (!this.sparks.length) this.twinkle();
      this.draw(Infinity);
    }
  }

  private draw(now: number) {
    if (!this.on) return;
    this.drawMosaic();
    this.drawBurst(now - this.started);
  }

  private drawMosaic() {
    const context = this.mosaic;
    const scale = this.unit * this.ratio;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, this.mosaicCanvas.width, this.mosaicCanvas.height);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    this.cells.forEach((cell, index) => {
      if (!cell.level) return;
      const column = index % COLUMNS;
      const row = Math.floor(index / COLUMNS);
      const x = column * PITCH + (PITCH - CELL) / 2;
      const y = row * PITCH + (PITCH - CELL) / 2;
      context.globalAlpha = cell.flash ? 0.95 : cell.level * ramp(column / (COLUMNS - 1));
      context.fillStyle = cell.flash ? '#f1eeff' : rgb(cell.hue);
      context.beginPath();
      context.roundRect(x, y, CELL, CELL, 0.75);
      context.fill();
    });
    context.globalAlpha = 1;
  }

  /** `t`: ms since the stop was reached (Infinity: long since). */
  private drawBurst(t: number) {
    const context = this.burst;
    const scale = this.unit * this.ratio;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, this.burstCanvas.width, this.burstCanvas.height);
    context.setTransform(scale, 0, 0, scale, REACH * scale, REACH * scale);
    // Specks sit on a 1 px grid, as on a screen of big pixels.
    const square = (x: number, y: number, size: number) =>
      context.fillRect(Math.round(x) - size / 2, Math.round(y) - size / 2, size, size);

    // The rays shoot out over the first ~300 ms, then stay, twinkling.
    const reach = t < 30 ? 0 : RAY_START + 34 * (1 - Math.exp(-(t - 30) / 90));
    const intro = Math.min(1, Math.max(0, t / 160));
    for (const ray of this.rays) {
      const cos = Math.cos(ray.angle);
      const sin = Math.sin(ray.angle);
      ray.specks.forEach((speck, index) => {
        const r = RAY_START + index * 3;
        if (r > reach || r > ray.length) return;
        const fall = 1 - (r - RAY_START) / (ray.length - RAY_START + 3);
        context.globalAlpha = (0.3 + 0.7 * speck.level) * fall * intro;
        context.fillStyle = rgb(speck.hue);
        square(cos * r, sin * r, 1.25);
      });
    }

    // Sparks on the brain, once it has grown.
    if (t > 120) {
      for (const spark of this.sparks) {
        context.globalAlpha = 0.95;
        context.fillStyle = rgb(spark.hue);
        square(spark.x, spark.y, 1.5);
      }
    }

    // The ring: it opens from inside the brain to its edge in ~150 ms, hangs there, then
    // scatters outwards and fades.
    if (t < BURST) {
      for (const speck of this.specks) {
        const out = 7 + 10 * (1 - Math.exp(-t / 80)) + Math.max(0, t - 160) * 0.016 * speck.speed;
        const r = out * speck.spread ** (t > 160 ? 1 : 0.3);
        const fade = t < 220 ? 1 : Math.max(0, 1 - (t - 220) / (420 * speck.fade));
        if (!fade) continue;
        context.globalAlpha = fade;
        context.fillStyle = rgb(speck.hue);
        square(Math.cos(speck.angle) * r * 1.05, Math.sin(speck.angle) * r, 2);
      }
    }
    context.globalAlpha = 1;
  }
}
