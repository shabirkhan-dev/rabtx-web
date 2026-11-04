// Copyright (c) 2026 Bruno Delorence. MIT License.

/*
 * The eighteen bodies. Each is a flat outline written as a signed distance function (negative
 * inside, in units where the body spans about -1 to 1, y up), which the renderer inflates into a
 * plush pillow: thick in the middle, rounding off to a thin seam at the outline. A body also says
 * where its eyes sit, its own colour, how thick it is, and any hard parts it wears (antennas, ear
 * discs), which are drawn as small glossy solids.
 */

export type ShapeName =
  | 'clover'
  | 'flower'
  | 'star'
  | 'ghost'
  | 'mech'
  | 'circle'
  | 'hexagon'
  | 'square'
  | 'triangle'
  | 'blob'
  | 'drop'
  | 'droid'
  | 'alien'
  | 'cat'
  | 'cloud'
  | 'pill'
  | 'pebble'
  | 'puddle';

export const SHAPE_NAMES: ShapeName[] = [
  'clover',
  'flower',
  'star',
  'ghost',
  'mech',
  'circle',
  'hexagon',
  'square',
  'triangle',
  'blob',
  'drop',
  'droid',
  'alien',
  'cat',
  'cloud',
  'pill',
  'pebble',
  'puddle',
];

type Sdf = (x: number, y: number) => number;

/** A hard part: a stem from `from` to `to` (object units, z out of the face) with a ball on top. */
export type Antenna = {
  from: [number, number, number];
  to: [number, number, number];
  ball: number;
};
/** A flattened disc on the side of the head, facing out along x. */
export type EarDisc = { at: [number, number]; radius: number };

export type Shape = {
  sdf: Sdf;
  /**
   * The body's colour, before light and before the colour tuning (brightness 120 %, saturation
   * 159 % by default) deepens it.
   */
  color: string;
  /** Eyes: their height, the half gap between them, and their radii. */
  eyes: { y: number; gap: number; rx: number; ry: number };
  /** Thickness, relative to the others. */
  depth: number;
  antennas?: Antenna[];
  ears?: EarDisc[];
  /** The colour of hard parts; the body's, a little lighter, without it. */
  partColor?: string;
};

const circle = (x: number, y: number, cx: number, cy: number, r: number) =>
  Math.hypot(x - cx, y - cy) - r;

function box(x: number, y: number, hx: number, hy: number, r: number) {
  const qx = Math.abs(x) - hx + r;
  const qy = Math.abs(y) - hy + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

/** A smooth union: the two outlines melt together over about k. */
function smin(a: number, b: number, k: number) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

/** Distance to a closed polygon, any shape, negative inside. */
function polygon(x: number, y: number, v: number[]) {
  const n = v.length / 2;
  let d = (x - v[0]) ** 2 + (y - v[1]) ** 2;
  let s = 1;
  for (let i = 0, j = n - 1; i < n; j = i, i++) {
    const vix = v[i * 2];
    const viy = v[i * 2 + 1];
    const ex = v[j * 2] - vix;
    const ey = v[j * 2 + 1] - viy;
    const wx = x - vix;
    const wy = y - viy;
    const t = Math.min(1, Math.max(0, (wx * ex + wy * ey) / (ex * ex + ey * ey)));
    const bx = wx - ex * t;
    const by = wy - ey * t;
    d = Math.min(d, bx * bx + by * by);
    const c1 = y >= viy;
    const c2 = y < v[j * 2 + 1];
    const c3 = ex * wy > ey * wx;
    if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s;
  }
  return s * Math.sqrt(d);
}

function regular(n: number, radius: number, start: number, cy = 0) {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = start + (i * Math.PI * 2) / n;
    out.push(Math.cos(a) * radius, Math.sin(a) * radius + cy);
  }
  return out;
}

function starPoints(outer: number, inner: number, cy: number) {
  const out: number[] = [];
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? inner : outer;
    out.push(Math.cos(a) * r, Math.sin(a) * r + cy);
  }
  return out;
}

const STAR = starPoints(0.78, 0.43, -0.01);
const HEX = regular(6, 0.78, 0);
const TRIANGLE = [0, 0.66, -0.78, -0.6, 0.78, -0.6];
const DROP_TIP = [0, 0.94, -0.52, -0.02, 0.52, -0.02];
const EAR_L = [-0.8, 0.28, -0.6, 0.98, -0.14, 0.66];
const EAR_R = [0.8, 0.28, 0.14, 0.66, 0.6, 0.98];

const EYES = { y: 0, gap: 0.27, rx: 0.115, ry: 0.15 };

export const SHAPES: Record<ShapeName, Shape> = {
  clover: {
    sdf: (x, y) =>
      smin(
        smin(
          smin(circle(x, y, 0, 0.45, 0.51), circle(x, y, 0, -0.45, 0.51), 0.16),
          smin(circle(x, y, 0.45, 0, 0.51), circle(x, y, -0.45, 0, 0.51), 0.16),
          0.16,
        ),
        circle(x, y, 0, 0, 0.64),
        0.2,
      ),
    color: '#4aaacd',
    eyes: { ...EYES, y: 0 },
    depth: 1,
  },
  flower: {
    sdf: (x, y) => {
      // Drawn a little small, then scaled up as a whole.
      const k = 1.06;
      const px = x / k;
      const py = y / k + 0.03;
      let d = circle(px, py, 0, -0.02, 0.58);
      for (let i = 0; i < 5; i++) {
        const a = Math.PI / 2 + (i * Math.PI * 2) / 5;
        d = smin(d, circle(px, py, Math.cos(a) * 0.44, Math.sin(a) * 0.44 - 0.02, 0.46), 0.12);
      }
      return d * k;
    },
    color: '#46be7c',
    eyes: { ...EYES, y: -0.07, gap: 0.25 },
    depth: 1,
  },
  star: {
    sdf: (x, y) => polygon(x, y, STAR) - 0.15,
    color: '#e0c951',
    eyes: { y: -0.06, gap: 0.22, rx: 0.1, ry: 0.13 },
    depth: 0.95,
  },
  ghost: {
    sdf: (x, y) => {
      const body = Math.min(circle(x, y, 0, 0.04, 0.72), box(x, y + 0.27, 0.72, 0.31, 0.02));
      let bumps = circle(x, y, 0, -0.55, 0.25);
      bumps = Math.min(bumps, circle(x, y, -0.47, -0.55, 0.25), circle(x, y, 0.47, -0.55, 0.25));
      return Math.max(smin(body, bumps, 0.08), Math.abs(x) - 0.72);
    },
    color: '#dad8e0',
    eyes: { y: 0.06, gap: 0.27, rx: 0.12, ry: 0.155 },
    depth: 0.95,
  },
  mech: {
    sdf: (x, y) =>
      smin(
        box(x, y + 0.3, 0.84, 0.6, 0.32),
        Math.min(circle(x, y, 0.8, -0.28, 0.25), circle(x, y, -0.8, -0.28, 0.25)),
        0.2,
      ),
    color: '#7586ab',
    eyes: { y: -0.32, gap: 0.26, rx: 0.115, ry: 0.15 },
    depth: 0.9,
    antennas: [
      { from: [-0.42, 0.22, 0], to: [-0.6, 0.86, 0], ball: 0.105 },
      { from: [0.42, 0.22, 0], to: [0.6, 0.86, 0], ball: 0.105 },
    ],
  },
  circle: {
    sdf: (x, y) => circle(x, y, 0, 0, 0.945),
    color: '#7b5bbd',
    eyes: { ...EYES, gap: 0.25 },
    depth: 1,
  },
  hexagon: {
    sdf: (x, y) => polygon(x, y, HEX) - 0.17,
    color: '#bb5f5f',
    eyes: { ...EYES, gap: 0.26 },
    depth: 1,
  },
  square: {
    sdf: (x, y) => box(x, y, 0.95, 0.95, 0.36),
    color: '#539cc9',
    eyes: { ...EYES, gap: 0.27 },
    depth: 1,
  },
  triangle: {
    sdf: (x, y) => polygon(x, y, TRIANGLE) - 0.2,
    color: '#d99153',
    eyes: { ...EYES, y: -0.2, gap: 0.22, rx: 0.1, ry: 0.13 },
    depth: 0.95,
  },
  blob: {
    sdf: (x, y) =>
      smin(
        smin(circle(x, y, -0.3, 0.12, 0.6), circle(x, y, 0.36, 0.2, 0.52), 0.3),
        smin(circle(x, y, 0.08, -0.34, 0.58), circle(x, y, 0.56, -0.3, 0.34), 0.3),
        0.3,
      ),
    color: '#50bdb1',
    eyes: { ...EYES, y: 0.02, gap: 0.25 },
    depth: 1,
  },
  drop: {
    sdf: (x, y) => smin(circle(x, y, 0, -0.26, 0.66), polygon(x, y, DROP_TIP) - 0.04, 0.3),
    color: '#5891d2',
    eyes: { ...EYES, y: -0.26, gap: 0.24 },
    depth: 1,
  },
  droid: {
    sdf: (x, y) => box(x, y + 0.04, 0.7, 0.8, 0.46),
    color: '#b5bac5',
    eyes: { ...EYES, y: 0.02, gap: 0.25 },
    depth: 0.95,
    antennas: [{ from: [0, 0.68, 0], to: [0, 1.1, 0], ball: 0.1 }],
    ears: [
      { at: [-0.7, 0], radius: 0.2 },
      { at: [0.7, 0], radius: 0.2 },
    ],
    partColor: '#676d7d',
  },
  alien: {
    sdf: (x, y) => smin(circle(x, y, 0, 0.14, 0.8), circle(x, y, 0, -0.56, 0.34), 0.55),
    color: '#97cf6b',
    eyes: { y: 0.04, gap: 0.3, rx: 0.15, ry: 0.19 },
    depth: 1,
    antennas: [
      { from: [-0.28, 0.72, 0], to: [-0.58, 1.12, 0], ball: 0.09 },
      { from: [0.28, 0.72, 0], to: [0.58, 1.12, 0], ball: 0.09 },
    ],
  },
  cat: {
    sdf: (x, y) =>
      smin(
        circle(x, y, 0, -0.08, 0.84),
        Math.min(polygon(x, y, EAR_L) - 0.07, polygon(x, y, EAR_R) - 0.07),
        0.12,
      ),
    color: '#d99a62',
    eyes: { ...EYES, y: -0.06, gap: 0.27 },
    depth: 1,
  },
  cloud: {
    sdf: (x, y) => {
      let d = circle(x, y, 0, 0.14, 0.56);
      d = smin(d, circle(x, y, -0.56, -0.16, 0.42), 0.16);
      d = smin(d, circle(x, y, 0.56, -0.14, 0.44), 0.16);
      d = smin(d, circle(x, y, -0.2, -0.3, 0.42), 0.16);
      d = smin(d, circle(x, y, 0.24, -0.3, 0.42), 0.16);
      return Math.max(d, -y - 0.62);
    },
    color: '#e2e6f0',
    eyes: { ...EYES, y: -0.06, gap: 0.25 },
    depth: 0.95,
  },
  pill: {
    sdf: (x, y) => box(x, y, 0.95, 0.56, 0.56),
    color: '#c96b8e',
    eyes: { ...EYES, gap: 0.26 },
    depth: 0.95,
  },
  pebble: {
    sdf: (x, y) => {
      const a = Math.atan2(y, x);
      const r = Math.hypot(x / 0.95, y / 0.74);
      return (r - 1 - 0.035 * Math.sin(a * 3 + 0.6) - 0.025 * Math.cos(a * 2)) * 0.74;
    },
    color: '#a2968d',
    eyes: { ...EYES, y: 0.02, gap: 0.26 },
    depth: 0.85,
  },
  puddle: {
    sdf: (x, y) => {
      let d = box(x, y + 0.2, 0.95, 0.36, 0.36);
      d = smin(d, circle(x, y, -0.22, 0.08, 0.42), 0.2);
      d = smin(d, circle(x, y, 0.32, 0.04, 0.34), 0.2);
      return d;
    },
    color: '#67acd1',
    eyes: { ...EYES, y: -0.06, gap: 0.25, rx: 0.1, ry: 0.13 },
    depth: 0.7,
  },
};
