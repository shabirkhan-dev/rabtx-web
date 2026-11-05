// Copyright (c) 2026 Bruno Delorence. MIT License.

/*
 * What the themed payoffs share (the brain's night sky has its own, galaxy.ts): two canvases, the
 * track and a box around the thumb, and a loop that draws them while the last step is on.
 *
 * - A theme says how big its box is, how long its arrival lasts, and draws three things: the
 *   arrival (t is ms since the last step was reached), what keeps going after it, and the track.
 * - The loop draws every frame through the arrival, then 30 times a second. It stops while the
 *   slider is off screen or the tab is hidden. Under reduced motion there is no arrival: the
 *   theme's world is run forward a second and a half out of sight and drawn once, as a still.
 * - Light or dark is told by the slider (`scheme`), which reads it from the page's CSS.
 *
 * Units are px of the slider at its own size (13 px type); `unit` scales them to the page. On the
 * track, (0, 0) is its top left and the thumb's middle is at (THUMB_X, 10). In the box, (0, 0) is
 * the thumb's middle.
 */

import { TRACK_WIDTH } from './galaxy';

export const TRACK_HEIGHT = 20;
/** The thumb's middle on the last step. */
export const THUMB_X = TRACK_WIDTH - 8;

/** Ms between frames once the arrival is over. */
const AMBIENT = 33;
/** The still frame's lead under reduced motion. */
const WARM_UP = 1500;

export type Rgb = readonly [number, number, number];
export const rgba = ([r, g, b]: Rgb, a = 1) => `rgb(${r} ${g} ${b} / ${a})`;
export const pick = <T>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];
export const between = (min: number, max: number) => min + Math.random() * (max - min);
export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
/** Rises from 0 to 1 between `from` and `to` ms, eased out. */
export const easeOut = (t: number, from: number, to: number) =>
  1 - (1 - clamp01((t - from) / (to - from))) ** 3;

/** A payoff as the slider drives it: this, or the brain's Galaxy. */
export type Engine = {
  set(on: boolean, burst: boolean): void;
  scheme?(dark: boolean): void;
  destroy(): void;
};

export abstract class Payoff implements Engine {
  protected track: CanvasRenderingContext2D;
  protected box: CanvasRenderingContext2D;
  protected dark = false;
  private unit = 1;
  private ratio = 1;
  private on = false;
  private started = -Infinity;
  private previous = 0;
  private drawn = 0;
  private frame = 0;
  private visible = false;
  private reduced = false;
  private sized = false;
  private cleanups: (() => void)[] = [];

  constructor(
    private trackCanvas: HTMLCanvasElement,
    private boxCanvas: HTMLCanvasElement,
    /** The element whose width is the track's: it sets the scale. */
    private host: HTMLElement,
    /** Half the box's width and height. */
    private reach: readonly [number, number],
    /** How long the arrival draws every frame. */
    private arrival: number,
  ) {
    this.track = trackCanvas.getContext('2d')!;
    this.box = boxCanvas.getContext('2d')!;

    const resize = new ResizeObserver(() => this.resize());
    resize.observe(host);
    const seen = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.update();
    });
    seen.observe(host);
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
  }

  /** Turns the last step on or off; `burst` plays the arrival. */
  set(on: boolean, burst: boolean) {
    const arriving = on && !this.on;
    this.on = on;
    if (arriving) {
      this.reset();
      const live = burst && !this.reduced;
      this.started = live ? performance.now() : -Infinity;
      if (live) this.arrive();
      else this.settle();
    }
    this.update();
  }

  scheme(dark: boolean) {
    if (dark === this.dark) return;
    this.dark = dark;
    if (this.on) {
      this.reset();
      this.settle();
    }
    this.update();
  }

  destroy() {
    cancelAnimationFrame(this.frame);
    for (const cleanup of this.cleanups) cleanup();
  }

  /** A fresh world, before the arrival. */
  protected abstract reset(): void;
  /** The arrival's start: what it throws out. */
  protected abstract arrive(): void;
  /** Moves the world on by `dt` ms; `t` is ms since the arrival. */
  protected abstract advance(dt: number, t: number): void;
  /** Draws the track (origin at its top left) and the box (origin at the thumb's middle). */
  protected abstract paintTrack(context: CanvasRenderingContext2D, t: number): void;
  protected abstract paintBox(context: CanvasRenderingContext2D, t: number): void;

  /** The world as it is a while after the arrival, for a still frame. */
  private settle() {
    for (let t = 0; t < WARM_UP; t += AMBIENT) this.advance(AMBIENT, Infinity);
  }

  private resize() {
    const unit = this.host.offsetWidth / TRACK_WIDTH;
    if (!unit) return;
    this.unit = unit;
    this.ratio = Math.min(window.devicePixelRatio || 1, 2);
    const size = (canvas: HTMLCanvasElement, width: number, height: number) => {
      canvas.width = Math.round(width * unit * this.ratio);
      canvas.height = Math.round(height * unit * this.ratio);
    };
    size(this.trackCanvas, TRACK_WIDTH, TRACK_HEIGHT);
    size(this.boxCanvas, this.reach[0] * 2, this.reach[1] * 2);
    this.sized = true;
    this.draw(performance.now());
  }

  /** Runs the loop while it can be seen and moved; otherwise draws one still frame. */
  private update() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    if (!this.on) return;
    if (this.visible && !document.hidden && !this.reduced) {
      this.previous = performance.now();
      const tick = (now: number) => {
        const t = now - this.started;
        if (t < this.arrival + 100 || now - this.drawn >= AMBIENT) {
          this.advance(Math.min(100, Math.max(0, now - this.previous)), t);
          this.previous = now;
          this.draw(now);
        }
        this.frame = requestAnimationFrame(tick);
      };
      this.frame = requestAnimationFrame(tick);
    } else this.draw(Infinity);
  }

  private draw(now: number) {
    if (!this.on || !this.sized) return;
    this.drawn = now;
    const t = now - this.started;
    const scale = this.unit * this.ratio;
    for (const [context, canvas, x, y] of [
      [this.track, this.trackCanvas, 0, 0],
      [this.box, this.boxCanvas, this.reach[0], this.reach[1]],
    ] as const) {
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.globalAlpha = 1;
      context.globalCompositeOperation = 'source-over';
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.setTransform(scale, 0, 0, scale, x * scale, y * scale);
    }
    this.paintTrack(this.track, t);
    this.paintBox(this.box, t);
    this.track.globalAlpha = 1;
    this.box.globalAlpha = 1;
  }
}
