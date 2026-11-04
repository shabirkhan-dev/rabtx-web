// Copyright (c) 2026 Bruno Delorence. MIT License.

import type { Pose } from './render';

/*
 * What an avatar does, frame by frame: it breathes, looks around (or at the pointer when one
 * moves nearby), blinks now and then, and from time to time does a trick: a hop, a hop with a
 * full turn, a flip, a wiggle. At work it hops on a beat, now and then spinning and squinting
 * happily as it lands. Asleep it bows a little, eyes shut in two arcs, breathing slowly.
 * Poking it makes it crouch, leap with a turn and land beaming.
 *
 * Every motion is either a spring (the gaze, the eyes) or a short timeline (a trick), added
 * together into one pose; a trick's squash and stretch keep the body's volume about the same.
 */

export type State = 'idle' | 'working' | 'sleeping';

type Trick = {
  kind: 'hop' | 'spin' | 'flip' | 'wiggle' | 'squash' | 'poke';
  start: number;
  height: number;
  turns: number;
  roll: number;
  happy: boolean;
};

/** A critically damped spring towards a target, `rate` per second. */
function follow(value: number, target: number, velocity: number, rate: number, dt: number) {
  const w = rate;
  const x = value - target;
  const e = Math.exp(-w * dt);
  const nx = (x + (velocity + w * x) * dt) * e;
  const nv = (velocity - w * (velocity + w * x) * dt) * e;
  return [target + nx, nv] as const;
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** How long each part of a trick takes, in seconds. */
const CROUCH = 0.13;
const AIR = 0.42;
const SETTLE = 0.7;

export class Brain {
  t = 0;
  private rand: () => number;
  private gaze = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, next: 0 };
  private blink = { next: 2, at: -10, twice: false };
  private eyes = { open: 1, happy: 0, sleep: 0, vo: 0, vh: 0, vs: 0 };
  private trick: Trick | null = null;
  private nextTrick = 3;
  private hops = 0;
  private bow = { v: 0, vel: 0 };
  private happyUntil = 0;
  private lastState: State | null = null;

  constructor(seed: number) {
    let s = (seed * 2654435761) >>> 0 || 1;
    this.rand = () => {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      return (s >>> 0) / 4294967296;
    };
    this.t = this.rand() * 10;
    this.nextTrick = this.t + 0.8 + this.rand() * 3;
    this.blink.next = this.t + 0.8 + this.rand() * 3;
    this.gaze.next = this.t;
  }

  /** Starts the poke: a crouch, a leap with a full turn, a beaming landing. */
  poke() {
    this.trick = {
      kind: 'poke',
      start: this.t,
      height: 0.66,
      turns: 1,
      roll: 0,
      happy: true,
    };
  }

  /**
   * Moves `dt` seconds on. `pointer`, when set, is where the reader's pointer is, as -1 to 1 on
   * each axis around the avatar (y up). With `still`, nothing moves: the pose is the state's
   * resting one.
   */
  step(dt: number, state: State, pointer: { x: number; y: number } | null, still: boolean): Pose {
    if (still) return this.rest(state);
    dt = Math.min(dt, 0.1);
    this.t += dt;
    const t = this.t;
    const r = this.rand;
    const asleep = state === 'sleeping';
    // A new state starts at once: work begins with a hop, waking up with a look around.
    if (state !== this.lastState) {
      if (this.lastState !== null) {
        this.nextTrick = t + (state === 'working' ? 0.15 : 1 + r() * 1.5);
        this.gaze.next = t;
      }
      this.lastState = state;
    }

    // Where to look.
    const g = this.gaze;
    if (asleep) {
      g.tx = 0;
      g.ty = -0.25;
    } else if (pointer) {
      g.tx = pointer.x;
      g.ty = pointer.y;
      g.next = t + 0.8;
    } else if (t >= g.next) {
      const roll = r();
      if (roll < 0.3) {
        g.tx = 0;
        g.ty = 0;
      } else {
        g.tx = (r() * 2 - 1) * 0.95;
        g.ty = (r() * 2 - 1) * 0.6;
      }
      g.next = t + (state === 'working' ? 0.6 + r() * 1 : 0.9 + r() * 1.8);
    }
    const rate = pointer ? 9 : 5.5;
    [g.x, g.vx] = follow(g.x, g.tx, g.vx, rate, dt);
    [g.y, g.vy] = follow(g.y, g.ty, g.vy, rate, dt);

    // Blinks.
    const b = this.blink;
    if (!asleep && t >= b.next) {
      b.at = t;
      b.twice = r() < 0.18;
      b.next = t + 2.2 + r() * 3.6;
    }
    const since = t - b.at;
    let blinkClose = 0;
    const one = (s: number) =>
      s < 0 ? 0 : s < 0.06 ? s / 0.06 : s < 0.16 ? 1 - (s - 0.06) / 0.1 : 0;
    blinkClose = Math.max(one(since), b.twice ? one(since - 0.22) : 0);

    // Tricks.
    if (!this.trick && !asleep && t >= this.nextTrick) {
      this.trick = this.pickTrick(state);
    }
    if (asleep && this.trick && this.trick.kind !== 'poke') this.trick = null;
    let y = 0;
    let sx = 1;
    let sy = 1;
    let yaw = 0;
    let roll = 0;
    let happy = false;
    const k = this.trick;
    if (k) {
      const s = t - k.start;
      const total = k.kind === 'wiggle' ? 0.9 : k.kind === 'squash' ? 0.8 : CROUCH + AIR + SETTLE;
      if (s >= total) {
        if (k.happy) this.happyUntil = t + 0.45;
        this.trick = null;
        this.nextTrick = t + (state === 'working' ? 0.15 + r() * 0.45 : 1.4 + r() * 3.4);
      } else if (k.kind === 'wiggle') {
        yaw = Math.sin(s * 22) * 0.32 * (1 - s / total);
      } else if (k.kind === 'squash') {
        const a = Math.sin((s / total) * Math.PI);
        const wob = Math.exp(-s * 5) * Math.sin(s * 18);
        sy = 1 - 0.18 * a + 0.05 * wob;
        sx = 1 / Math.sqrt(sy);
      } else {
        happy = k.happy && s > CROUCH * 0.5;
        if (s < CROUCH) {
          const c = Math.sin((s / CROUCH) * (Math.PI / 2));
          sy = 1 - (k.kind === 'poke' ? 0.26 : 0.17) * c;
          sx = 1 / Math.sqrt(sy);
        } else if (s < CROUCH + AIR) {
          const a = (s - CROUCH) / AIR;
          y = k.height * 4 * a * (1 - a);
          const stretch = Math.abs(1 - 2 * a);
          sy = 1 + 0.13 * stretch ** 1.4;
          sx = 1 / Math.sqrt(sy);
          yaw = k.turns * Math.PI * 2 * easeInOut(a);
          roll = k.roll * Math.PI * 2 * easeInOut(a);
        } else {
          const l = s - CROUCH - AIR;
          const amp = (k.turns || k.roll ? 0.32 : 0.24) * (k.height / 0.4);
          const sq = Math.min(0.42, amp) * Math.exp(-l * 7.5) * Math.cos(l * 19);
          sy = 1 - sq;
          sx = 1 / Math.sqrt(sy);
        }
      }
    }
    if (t < this.happyUntil) happy = true;

    // Eyes: open, happy arcs, or asleep.
    const e = this.eyes;
    const openTarget = asleep ? 0 : 1 - blinkClose;
    if (blinkClose > 0) {
      e.open = openTarget;
      e.vo = 0;
    } else [e.open, e.vo] = follow(e.open, openTarget, e.vo, asleep ? 6 : 18, dt);
    [e.happy, e.vh] = follow(e.happy, happy && !asleep ? 1 : 0, e.vh, 22, dt);
    [e.sleep, e.vs] = follow(e.sleep, asleep ? 1 : 0, e.vs, 5, dt);

    // Breathing, and the sleeper's bow.
    const period = asleep ? 4.2 : 2.9;
    const breath = Math.sin((t / period) * Math.PI * 2);
    const amp = asleep ? 0.028 : 0.012;
    sy *= 1 + breath * amp;
    sx *= 1 - breath * amp * 0.6;
    [this.bow.v, this.bow.vel] = follow(this.bow.v, asleep ? 1 : 0, this.bow.vel, 3, dt);
    const bow = this.bow.v;

    return {
      y,
      sx,
      sy,
      yaw: yaw + g.x * 0.85,
      pitch: -g.y * 0.45 + bow * (0.16 + breath * 0.03),
      roll: roll + bow * Math.sin(t * 0.6) * 0.05 - g.x * 0.04,
      lookX: g.x * 0.1,
      lookY: g.y * 0.07,
      open: e.open,
      happy: Math.min(1, Math.max(0, e.happy)),
      sleep: Math.min(1, Math.max(0, e.sleep)),
    };
  }

  private pickTrick(state: State): Trick {
    const r = this.rand();
    const t = this.t;
    if (state === 'working') {
      this.hops++;
      const spin = this.hops % 3 === 0;
      return {
        kind: spin ? 'spin' : 'hop',
        start: t,
        height: spin ? 0.5 : 0.32,
        turns: spin ? (this.rand() < 0.5 ? 1 : -1) : 0,
        roll: 0,
        happy: spin && this.rand() < 0.6,
      };
    }
    if (r < 0.3) return { kind: 'hop', start: t, height: 0.36, turns: 0, roll: 0, happy: false };
    if (r < 0.64)
      return {
        kind: 'spin',
        start: t,
        height: 0.52,
        turns: this.rand() < 0.5 ? 1 : -1,
        roll: 0,
        happy: false,
      };
    if (r < 0.72)
      return {
        kind: 'flip',
        start: t,
        height: 0.6,
        turns: 0,
        roll: this.rand() < 0.5 ? 1 : -1,
        happy: true,
      };
    if (r < 0.86) return { kind: 'wiggle', start: t, height: 0, turns: 0, roll: 0, happy: false };
    return { kind: 'squash', start: t, height: 0, turns: 0, roll: 0, happy: false };
  }

  /** The state's resting pose: facing front, eyes open (or shut, asleep). */
  rest(state: State): Pose {
    const asleep = state === 'sleeping';
    return {
      y: 0,
      sx: 1,
      sy: 1,
      yaw: 0,
      pitch: asleep ? 0.16 : 0,
      roll: 0,
      lookX: 0,
      lookY: asleep ? -0.02 : 0,
      open: asleep ? 0 : 1,
      happy: 0,
      sleep: asleep ? 1 : 0,
    };
  }
}
