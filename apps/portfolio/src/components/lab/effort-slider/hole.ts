// Copyright (c) 2026 Bruno Delorence. MIT License.

import { Payoff, THUMB_X, between, clamp01, easeOut, pick, rgba, type Rgb } from './payoff';

/*
 * The galaxy theme's last step. The spiral has collapsed, and what it became depends on the page.
 *
 * - Light: a black hole. A ring of light falls in on it as it forms; the track's sky is pulled
 *   towards it, every mote of it streaking to the right faster and faster as it nears, until the
 *   dark swallows it; specks orbit in the hole's tilted disc (hidden while behind it), and the
 *   ring of bent light around it breathes.
 * - Dark: a white hole, the same thing run backwards. Two rings and a crown of rays burst out of
 *   it, and from then on it throws light out: motes stream away left along the track, slowing as
 *   they go, specks fly out all around, and a faint ring leaves it every 1.4 s.
 */

/** Half the box around the thumb. */
export const HOLE_REACH = [44, 34] as const;
const ARRIVAL = 1000;

const FALLING: Rgb[] = [
  [160, 132, 255],
  [236, 128, 214],
  [255, 255, 255],
  [110, 86, 230],
  [255, 200, 140],
];
const THROWN: Rgb[] = [
  [255, 255, 255],
  [191, 230, 255],
  [255, 233, 184],
  [199, 184, 255],
];
const DISC: Rgb[] = [
  [255, 214, 150],
  [255, 168, 80],
  [255, 240, 210],
];

/** A mote on the track. */
type Mote = { x: number; y: number; vx: number; vy: number; age: number; hue: Rgb; size: number };
/** A speck in the box, in polar terms around the hole. */
type Speck = { angle: number; r: number; speed: number; age: number; life: number; hue: Rgb };

export class Hole extends Payoff {
  private motes: Mote[] = [];
  private specks: Speck[] = [];
  private orbit: Speck[] = [];
  private rays: { angle: number; length: number }[] = [];
  private clock = 0;
  private due = 0;

  constructor(track: HTMLCanvasElement, box: HTMLCanvasElement, host: HTMLElement) {
    super(track, box, host, HOLE_REACH, ARRIVAL);
  }

  protected reset() {
    this.motes = [];
    this.specks = [];
    this.clock = 0;
    this.due = 0;
    this.orbit = Array.from({ length: 16 }, () => ({
      angle: between(0, Math.PI * 2),
      r: between(6.5, 14),
      speed: 0,
      age: 0,
      life: Infinity,
      hue: pick(DISC),
    }));
    this.rays = Array.from({ length: 16 }, (_, index) => ({
      angle: ((index + between(-0.3, 0.3)) / 16) * Math.PI * 2,
      length: between(14, 26),
    }));
  }

  protected arrive() {
    if (this.dark) {
      // The burst: a wave of motes thrown down the track, and specks all around.
      for (let i = 0; i < 70; i++) this.motes.push(this.thrown(between(0.35, 0.9)));
      for (let i = 0; i < 30; i++) this.specks.push(this.outward(between(0.04, 0.09)));
    } else {
      // The whole fill gives way at once, and a ring of specks falls in.
      for (let i = 0; i < 90; i++) this.motes.push(this.falling(between(0, THUMB_X - 12)));
      for (let i = 0; i < 26; i++)
        this.specks.push({
          angle: (i / 26) * Math.PI * 2,
          r: between(30, 40),
          speed: 0,
          age: 0,
          life: 520,
          hue: pick(FALLING),
        });
    }
  }

  private falling(x: number): Mote {
    return {
      x,
      y: between(1, 19),
      vx: 0,
      vy: 0,
      age: 0,
      hue: pick(FALLING),
      size: between(0.7, 1.3),
    };
  }
  private thrown(speed: number): Mote {
    const spread = between(-0.18, 0.18);
    return {
      x: THUMB_X - 4,
      y: 10 + spread * 10,
      vx: -speed,
      vy: spread * speed * 0.35,
      age: 0,
      hue: pick(THROWN),
      size: between(0.7, 1.4),
    };
  }
  private outward(speed: number): Speck {
    return {
      angle: between(0, Math.PI * 2),
      r: 5,
      speed,
      age: 0,
      life: between(500, 900),
      hue: pick(THROWN),
    };
  }

  protected advance(dt: number) {
    this.clock += dt;
    this.due -= dt;
    if (this.dark) {
      // Motes leave the hole, slowing as they go.
      while (this.due <= 0) {
        this.due += 22;
        this.motes.push(this.thrown(between(0.12, 0.32)));
        if (Math.random() < 0.5) this.specks.push(this.outward(between(0.02, 0.05)));
      }
      const drag = 0.9985 ** dt;
      for (const mote of this.motes) {
        mote.vx *= drag;
        mote.vy *= drag;
        mote.x += mote.vx * dt;
        mote.y += mote.vy * dt;
        mote.age += dt;
      }
      this.motes = this.motes.filter(
        (mote) => mote.x > -4 && mote.age < 2600 && mote.y > -2 && mote.y < 22,
      );
    } else {
      // Motes fall towards the hole, faster the nearer they are.
      while (this.due <= 0) {
        this.due += 26;
        this.motes.push(this.falling(between(0, THUMB_X - 30)));
      }
      for (const mote of this.motes) {
        const dx = THUMB_X - mote.x;
        const dy = 10 - mote.y;
        const distance = Math.hypot(dx, dy) || 1;
        const speed = 0.018 + 5 / (distance + 6);
        // A little swirl as they near: the disc turns.
        const swirl = Math.min(0.6, 8 / distance);
        mote.vx = ((dx - dy * swirl) / distance) * speed;
        mote.vy = ((dy + dx * swirl * 0.25) / distance) * speed;
        mote.x += mote.vx * dt;
        mote.y += mote.vy * dt;
        mote.age += dt;
      }
      this.motes = this.motes.filter((mote) => Math.hypot(THUMB_X - mote.x, 10 - mote.y) > 4.5);
    }
    for (const speck of this.specks) {
      speck.age += dt;
      if (this.dark) speck.r += speck.speed * dt;
      // Falling in: from its start to the edge of the dark, faster and faster, turning.
      else {
        const k = clamp01(speck.age / speck.life);
        speck.r = Math.max(4.6, speck.r - (speck.r - 4.6) * k * 0.12 * (dt / 16));
        speck.angle += 0.004 * dt * (1 + k * 3);
      }
    }
    this.specks = this.specks.filter((speck) => speck.age < speck.life);
    for (const speck of this.orbit) speck.angle += 0.0035 * (9 / speck.r) ** 1.5 * dt;
  }

  protected paintTrack(context: CanvasRenderingContext2D) {
    context.lineCap = 'round';
    for (const mote of this.motes) {
      const speed = Math.hypot(mote.vx, mote.vy);
      const fadeIn = clamp01(mote.age / 240);
      const tail = 24 + speed * 30;
      if (this.dark) {
        const fade = fadeIn * clamp01(1 - mote.age / 2600) * clamp01(mote.x / 40);
        context.globalAlpha = fade;
      } else {
        const near = clamp01(1 - (THUMB_X - mote.x) / 180);
        context.globalAlpha = fadeIn * (0.45 + 0.55 * near);
      }
      context.strokeStyle = rgba(mote.hue);
      context.lineWidth = mote.size;
      context.beginPath();
      context.moveTo(mote.x, mote.y);
      context.lineTo(mote.x - mote.vx * tail, mote.y - mote.vy * tail);
      context.stroke();
    }
  }

  protected paintBox(context: CanvasRenderingContext2D, t: number) {
    const clock = this.clock;
    if (this.dark) {
      // Rings and rays out of the core on arrival.
      if (t < ARRIVAL) {
        for (const [delay, reach] of [
          [0, 46],
          [150, 34],
        ]) {
          const k = easeOut(t, delay, delay + 650);
          if (t < delay) continue;
          context.globalAlpha = (1 - k) * 0.9;
          context.strokeStyle = '#fff';
          context.lineWidth = 2.4 * (1 - k) + 0.4;
          context.beginPath();
          context.arc(0, 0, 5 + reach * k, 0, Math.PI * 2);
          context.stroke();
        }
        const grow = easeOut(t, 0, 260);
        const fade = 1 - clamp01((t - 300) / 600);
        context.lineCap = 'round';
        for (const ray of this.rays) {
          const end = 6 + ray.length * grow;
          const gradient = context.createLinearGradient(
            0,
            0,
            Math.cos(ray.angle) * end,
            Math.sin(ray.angle) * end,
          );
          gradient.addColorStop(0.2, 'rgb(255 255 255 / 0.9)');
          gradient.addColorStop(1, 'rgb(190 225 255 / 0)');
          context.globalAlpha = fade;
          context.strokeStyle = gradient;
          context.lineWidth = 1.1;
          context.beginPath();
          context.moveTo(Math.cos(ray.angle) * 6, Math.sin(ray.angle) * 6);
          context.lineTo(Math.cos(ray.angle) * end, Math.sin(ray.angle) * end);
          context.stroke();
        }
      }
      // A faint ring leaves every 1.4 s.
      const k = (clock % 1400) / 1400;
      context.globalAlpha = 0.4 * (1 - k);
      context.strokeStyle = 'rgb(210 236 255)';
      context.lineWidth = 0.8;
      context.beginPath();
      context.arc(0, 0, 7 + 24 * k, 0, Math.PI * 2);
      context.stroke();
      for (const speck of this.specks) {
        context.globalAlpha = 1 - speck.age / speck.life;
        context.fillStyle = rgba(speck.hue);
        const x = Math.cos(speck.angle) * speck.r;
        const y = Math.sin(speck.angle) * speck.r;
        context.fillRect(x - 0.6, y - 0.6, 1.2, 1.2);
      }
      return;
    }

    // Black hole: the ring of light that falls in as it forms.
    if (t < ARRIVAL) {
      const k = 1 - (1 - clamp01(t / 480)) ** 2;
      const r = 38 - 32 * k;
      context.globalAlpha = clamp01(t / 60) * (1 - clamp01((t - 420) / 200));
      context.strokeStyle = 'rgb(176 156 255)';
      context.lineWidth = 0.8 + 2.2 * k;
      context.beginPath();
      context.arc(0, 0, r, 0, Math.PI * 2);
      context.stroke();
      for (const speck of this.specks) {
        context.globalAlpha = 1 - clamp01((speck.r - 4.6) / 30) * 0.4;
        context.fillStyle = rgba(speck.hue);
        const x = Math.cos(speck.angle) * speck.r;
        const y = Math.sin(speck.angle) * speck.r;
        context.fillRect(x - 0.7, y - 0.7, 1.4, 1.4);
      }
    }
    // The ring of bent light breathes.
    const formed = easeOut(t, 300, 700);
    context.globalAlpha = formed * (0.3 + 0.18 * Math.sin(clock / 320));
    context.strokeStyle = 'rgb(255 220 160)';
    context.lineWidth = 1.4;
    context.beginPath();
    context.arc(0, 0, 6.4, 0, Math.PI * 2);
    context.stroke();
    // Specks in the tilted disc, hidden while they pass behind the dark.
    for (const speck of this.orbit) {
      const x = Math.cos(speck.angle) * speck.r;
      const y = Math.sin(speck.angle) * speck.r * 0.24;
      if (y < 0 && Math.abs(x) < 4.8) continue;
      context.globalAlpha = formed * (0.55 + 0.45 * Math.cos(speck.angle));
      context.fillStyle = rgba(speck.hue);
      context.fillRect(x - 0.55, y - 0.55, 1.1, 1.1);
    }
  }
}
