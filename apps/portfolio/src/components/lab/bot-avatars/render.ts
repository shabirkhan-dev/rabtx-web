// Copyright (c) 2026 Bruno Delorence. MIT License.

import { getMesh, getRoots, ROOT_STRIDE, type Mesh } from './mesh';
import { SHAPES, type ShapeName } from './shapes';

/*
 * A small software renderer on a 2D canvas: no WebGL.
 *
 * 1. The body's two sheets are turned and squashed into place, and their triangles filled into a
 *    depth buffer pixel by pixel; each pixel keeps the nearest surface's normal and its spot on
 *    the face. Hats, glasses and antennas are solids (spheres, cones, tubes) found by casting a
 *    ray through each pixel of their box, into the same buffer.
 * 2. Every pixel the body covers is lit once: a soft key light from the upper left, a fill, a
 *    back light round the rim and a sheen, over the body's colour broken up by fine noise that
 *    sticks to the surface. The eyes are painted on the face from the same spot, so they turn
 *    with it.
 * 3. Fur: thousands of short strands grow out along the surface's normal from fixed roots. Those
 *    on the visible side are drawn as fading lines over the lit body, and along the outline they
 *    stand out against the background, which gives the soft fuzzy edge.
 *
 * Smooth finishes (plastic, smooth, flat) skip the fur and are drawn at twice the size, then
 * scaled down, for clean edges.
 */

export type Shading = 'fabric' | 'plastic' | 'crisp' | 'smooth' | 'flat';
export type Hat = 'none' | 'beret' | 'beanie' | 'party' | 'crown';
export type Glasses = 'none' | 'round' | 'square';

export type Look = {
  type: ShapeName;
  shading: Shading;
  hat: Hat;
  glasses: Glasses;
  color: string | undefined;
  ink: string;
  furLength: number;
  brightness: number;
  saturation: number;
  shadow: number;
  backLight: number;
  sheen: number;
  depth: number;
  edgeFuzz: number;
};

/** Where the body is and how its face looks this frame. */
export type Pose = {
  y: number;
  sx: number;
  sy: number;
  yaw: number;
  pitch: number;
  roll: number;
  /** Eyes: where they look on the face, how open they are, and how much they are arcs. */
  lookX: number;
  lookY: number;
  open: number;
  happy: number;
  sleep: number;
};

type Rgb = [number, number, number];

function parse(hex: string): Rgb {
  let h = hex.replace('#', '');
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  const v = parseInt(h, 16) || 0;
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
}

/**
 * The colour tuning, applied to the lit colour (so shade deepens as well as darkens): saturation
 * and brightness as multipliers, 1.59 and 1.2 at their defaults.
 */
function grade(c: Rgb, brightness: number, saturation: number) {
  const l = c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
  const s = saturation * 1.59;
  const b = brightness * 1.2;
  c[0] = Math.max(0, (l + (c[0] - l) * s) * b);
  c[1] = Math.max(0, (l + (c[1] - l) * s) * b);
  c[2] = Math.max(0, (l + (c[2] - l) * s) * b);
}

/** The light: a key from the upper left and in front, with the view straight on. */
const LX = -0.55;
const LY = 0.6;
const LZ = 0.58;
const HX = LX;
const HY = LY;
const HZ = LZ + 1;
const HL = Math.hypot(HX, HY, HZ);
/** The highlight's half vector: a light up and to the left, nearer the view. */
const SX0 = -0.3;
const SY0 = 0.35;
const SZ0 = 0.89 + 1;
const SL = Math.hypot(SX0, SY0, SZ0);
const SX = SX0 / SL;
const SY = SY0 / SL;
const SZ = SZ0 / SL;

function hash(x: number, y: number) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * The fur's grain: a 256 × 256 tile of fine noise with a little coarser clumping, worked out
 * once and looked up by the spot on the face.
 */
const GRAIN = (() => {
  const tile = new Float32Array(256 * 256);
  for (let y = 0; y < 256; y++)
    for (let x = 0; x < 256; x++) {
      // The clumps wrap round the tile: 256 / 8 = 32 cells across.
      const cx = x / 8;
      const cy = y / 8;
      const ix = Math.floor(cx);
      const iy = Math.floor(cy);
      const fx = cx - ix;
      const fy = cy - iy;
      const sx = fx * fx * (3 - 2 * fx);
      const sy = fy * fy * (3 - 2 * fy);
      const h = (a: number, b: number) => hash(a & 31, b & 31);
      const a = h(ix, iy);
      const b = h(ix + 1, iy);
      const c = h(ix, iy + 1);
      const d = h(ix + 1, iy + 1);
      const clump = a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
      tile[y * 256 + x] = (hash(x, y + 5003) - 0.5) * 0.8 + (clump - 0.5) * 0.25;
    }
  return tile;
})();

/** Materials kept per pixel. */
const BODY = 1;
const PART = 2;
const CLOTH = 3;
const GOLD = 4;
const FRAME = 5;

type Solid = {
  kind: 'ball' | 'cone' | 'tube';
  /** Centre (or base), in the body's own units, and its axes (columns: x, y, z), scaled. */
  at: [number, number, number];
  axes: number[];
  material: number;
  color: Rgb;
  /** Paints stripes or a cuff: a second colour by height along the solid. */
  stripes?: { color: Rgb; every: number };
  /** Only the part above this local height is solid (a dome). */
  clip?: number;
};

export class Renderer {
  private w = 0;
  private h = 0;
  private zb = new Float32Array(0);
  private nx = new Float32Array(0);
  private ny = new Float32Array(0);
  private nz = new Float32Array(0);
  private u = new Float32Array(0);
  private v = new Float32Array(0);
  private cr = new Float32Array(0);
  private cg = new Float32Array(0);
  private cb = new Float32Array(0);
  private mat = new Uint8Array(0);
  private side = new Uint8Array(0);
  private image: ImageData | null = null;
  /** The box of pixels drawn this frame: left, top, right, bottom. */
  private box = [0, 0, 0, 0];
  private scratch: HTMLCanvasElement | null = null;
  private wpos = new Float32Array(0);
  private wnrm = new Float32Array(0);

  constructor(private ctx: CanvasRenderingContext2D) {}

  /**
   * Draws one frame. `size` is the avatar's size in device px; the canvas is 1.5 times that,
   * the body in the avatar's box within it.
   */
  draw(look: Look, pose: Pose, size: number) {
    const canvas = this.ctx.canvas;
    const smooth = look.shading !== 'fabric' && look.shading !== 'crisp';
    const ss = smooth ? 2 : 1;
    const W = Math.round(canvas.width * ss);
    const H = Math.round(canvas.height * ss);
    this.resize(W, H);
    const scale = size * ss * 0.462;
    const cx = W / 2;
    // The body sits in the avatar's box, a little below the canvas's middle (more room above).
    const cy = H * 0.5693;

    const shape = SHAPES[look.type];
    const grid = Math.max(24, Math.min(64, Math.round((scale * 2.4) / 3.2)));
    const mesh = getMesh(look.type, look.depth, grid);

    // The body's transform: squash about its bottom, turn (yaw, then pitch, then roll), lift.
    const cyw = Math.cos(pose.yaw);
    const syw = Math.sin(pose.yaw);
    const cp = Math.cos(pose.pitch);
    const sp = Math.sin(pose.pitch);
    const cr = Math.cos(pose.roll);
    const sr = Math.sin(pose.roll);
    // R = Rz(roll) * Rx(pitch) * Ry(yaw)
    const Ry = [cyw, 0, syw, 0, 1, 0, -syw, 0, cyw];
    const Rx = [1, 0, 0, 0, cp, -sp, 0, sp, cp];
    const Rz = [cr, -sr, 0, sr, cr, 0, 0, 0, 1];
    const R = mul(Rz, mul(Rx, Ry));
    const sz = (pose.sx + 1) / 2;
    const S = [pose.sx, 0, 0, 0, pose.sy, 0, 0, 0, sz];
    const L = mul(R, S);
    const pivot = mesh.bottom;
    // p' = L (p - pivot) + pivot + lift; the turn's centre is the body's middle, so lift that too.
    const ox = -L[1] * pivot;
    const oy = pivot - L[4] * pivot + pose.y;
    const oz = -L[7] * pivot;

    const transform = (x: number, y: number, z: number, out: Float32Array, o: number) => {
      out[o] = L[0] * x + L[1] * y + L[2] * z + ox;
      out[o + 1] = L[3] * x + L[4] * y + L[5] * z + oy;
      out[o + 2] = L[6] * x + L[7] * y + L[8] * z + oz;
    };

    // 1. The body.
    const { pos, nrm, tris } = mesh;
    const vcount = pos.length / 3;
    if (this.wpos.length < pos.length) {
      this.wpos = new Float32Array(pos.length);
      this.wnrm = new Float32Array(pos.length);
    }
    const wp = this.wpos;
    const wn = this.wnrm;
    // Normals turn with R and lean with the squash (inverse scale).
    const isx = 1 / pose.sx;
    const isy = 1 / pose.sy;
    const isz = 1 / sz;
    for (let i = 0; i < vcount; i++) {
      const o = i * 3;
      transform(pos[o], pos[o + 1], pos[o + 2], wp, o);
      const ax = nrm[o] * isx;
      const ay = nrm[o + 1] * isy;
      const az = nrm[o + 2] * isz;
      let x = R[0] * ax + R[1] * ay + R[2] * az;
      let y = R[3] * ax + R[4] * ay + R[5] * az;
      let z = R[6] * ax + R[7] * ay + R[8] * az;
      const l = Math.hypot(x, y, z) || 1;
      x /= l;
      y /= l;
      z /= l;
      wn[o] = x;
      wn[o + 1] = y;
      wn[o + 2] = z;
    }
    const half = vcount / 2;
    this.fill(tris, wp, wn, pos, half, scale, cx, cy);

    // Hard parts and what the avatar wears.
    const solids = this.solids(look, mesh);
    const base = parse(look.color ?? shape.color);
    const bright = look.brightness;
    const sat = look.saturation;
    for (const solid of solids) this.cast(solid, L, ox, oy, oz, scale, cx, cy);

    // 2. Light every covered pixel.
    const img = this.image!;
    const data = img.data;
    data.fill(0);
    const ink = parse(look.ink);
    const eyes = shape.eyes;
    const fur = look.shading === 'fabric' || look.shading === 'crisp';
    const grain = scale * (look.shading === 'crisp' ? 1.1 : 0.85);
    const noiseAmp =
      look.shading === 'fabric'
        ? 0.2
        : look.shading === 'crisp'
          ? 0.36
          : look.shading === 'smooth'
            ? 0.1
            : 0;
    const aa = 1.2 / scale;
    const zb = this.zb;
    const col: Rgb = [0, 0, 0];
    const x0 = Math.max(0, this.box[0]);
    const x1 = Math.min(W - 1, this.box[2]);
    for (let y = Math.max(0, this.box[1]); y <= Math.min(H - 1, this.box[3]); y++) {
      for (let i = y * W + x0; i <= y * W + x1; i++) {
        const m = this.mat[i];
        if (!m) continue;
        let r: number;
        let g: number;
        let b: number;
        const nX = this.nx[i];
        const nY = this.ny[i];
        const nZ = this.nz[i];
        if (m === BODY) {
          const pu = this.u[i];
          const pv = this.v[i];
          r = base[0];
          g = base[1];
          b = base[2];
          if (noiseAmp) {
            const gx = Math.floor(pu * grain + 4096) & 255;
            const gy = (Math.floor(pv * grain + 4096) + this.side[i] * 97) & 255;
            const k = 1 + noiseAmp * GRAIN[(gy << 8) | gx];
            r *= k;
            g *= k;
            b *= k;
          }
          this.light(r, g, b, nX, nY, nZ, look, col);
          if (this.side[i]) {
            const e = eyeCover(pu, pv, eyes, pose, aa);
            if (e > 0) {
              col[0] += (ink[0] - col[0]) * e;
              col[1] += (ink[1] - col[1]) * e;
              col[2] += (ink[2] - col[2]) * e;
            }
          }
        } else {
          r = this.cr[i];
          g = this.cg[i];
          b = this.cb[i];
          this.lightPart(r, g, b, nX, nY, nZ, m, look, col);
          if (m === PART) grade(col, bright, sat);
        }
        const o = i * 4;
        data[o] = col[0] * 255;
        data[o + 1] = col[1] * 255;
        data[o + 2] = col[2] * 255;
        data[o + 3] = 255;
      }
    }

    // 3. Fur.
    if (fur && look.furLength > 0) {
      const crisp = look.shading === 'crisp';
      const area = scale * scale;
      const density = Math.round(Math.min(1500, Math.max(220, area * (crisp ? 0.3 : 0.22))));
      const roots = getRoots(`${look.type}|${look.depth.toFixed(2)}|${grid}`, mesh, density);
      const rd = roots.data;
      const strand = (crisp ? 0.022 : 0.032) * look.furLength;
      const fuzz = look.edgeFuzz;
      const tmp = new Float32Array(3);
      for (let k = 0; k < roots.count; k++) {
        const o = k * ROOT_STRIDE;
        const ax = rd[o + 3] * isx;
        const ay = rd[o + 4] * isy;
        const az = rd[o + 5] * isz;
        let nX = R[0] * ax + R[1] * ay + R[2] * az;
        let nY = R[3] * ax + R[4] * ay + R[5] * az;
        let nZ = R[6] * ax + R[7] * ay + R[8] * az;
        const nl = Math.hypot(nX, nY, nZ) || 1;
        nX /= nl;
        nY /= nl;
        nZ /= nl;
        if (nZ < -0.15) continue;
        // Strands facing the viewer add only texture: keep one in three.
        if (nZ > 0.55 && k % 3) continue;
        transform(rd[o], rd[o + 1], rd[o + 2], tmp, 0);
        const X0 = cx + tmp[0] * scale;
        const Y0 = cy - tmp[1] * scale;
        const pxi = X0 | 0;
        const pyi = Y0 | 0;
        if (pxi < 0 || pyi < 0 || pxi >= W || pyi >= H) continue;
        const pi = pyi * W + pxi;
        if (zb[pi] > tmp[2] + 0.04) continue;
        const rim = 1 - Math.abs(nZ);
        const len = strand * rd[o + 6] * (1 + fuzz * rim * 0.9);
        const jx = rd[o + 8] * 0.35;
        const jy = rd[o + 9] * 0.35 - 0.3;
        const dX = (nX + jx) * len * scale;
        const dY = -(nY + jy) * len * scale;
        // Colour: the body's, lit by the strand's normal, a little lighter or darker by strand.
        const shadeK = 0.86 + rd[o + 7] * 0.3;
        let r = base[0] * shadeK;
        let g = base[1] * shadeK;
        let b = base[2] * shadeK;
        this.light(r, g, b, nX, nY, nZ, look, col);
        r = col[0];
        g = col[1];
        b = col[2];
        if (rd[o + 2] > 0) {
          const e = eyeCover(rd[o], rd[o + 1], eyes, pose, aa);
          if (e > 0) {
            r += (ink[0] - r) * e;
            g += (ink[1] - g) * e;
            b += (ink[2] - b) * e;
          }
        }
        const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dX), Math.abs(dY))));
        const alpha0 = (crisp ? 0.75 : 0.55) * (0.6 + 0.4 * rim);
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          const X = (X0 + dX * t) | 0;
          const Y = (Y0 + dY * t) | 0;
          if (X < 0 || Y < 0 || X >= W || Y >= H) break;
          const a = alpha0 * (1 - t * (0.35 + 0.45 * (1 - fuzz * 0.5)));
          const q = (Y * W + X) * 4;
          const da = data[q + 3] / 255;
          const lift = 1 + t * 0.12;
          const oa = a + da * (1 - a);
          const k1 = a / oa;
          data[q] = (r * lift * 255 - data[q]) * k1 + data[q];
          data[q + 1] = (g * lift * 255 - data[q + 1]) * k1 + data[q + 1];
          data[q + 2] = (b * lift * 255 - data[q + 2]) * k1 + data[q + 2];
          data[q + 3] = oa * 255;
        }
      }
    }

    // Out to the canvas.
    const ctx = this.ctx;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (ss === 1) {
      ctx.putImageData(img, 0, 0);
    } else {
      if (!this.scratch) this.scratch = document.createElement('canvas');
      const s = this.scratch;
      if (s.width !== W || s.height !== H) {
        s.width = W;
        s.height = H;
      }
      s.getContext('2d')!.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(s, 0, 0, canvas.width, canvas.height);
    }
  }

  private resize(W: number, H: number) {
    this.box[0] = W;
    this.box[1] = H;
    this.box[2] = -1;
    this.box[3] = -1;
    if (this.w === W && this.h === H) {
      this.zb.fill(-1e9);
      this.mat.fill(0);
      return;
    }
    this.w = W;
    this.h = H;
    const n = W * H;
    this.zb = new Float32Array(n).fill(-1e9);
    this.nx = new Float32Array(n);
    this.ny = new Float32Array(n);
    this.nz = new Float32Array(n);
    this.u = new Float32Array(n);
    this.v = new Float32Array(n);
    this.cr = new Float32Array(n);
    this.cg = new Float32Array(n);
    this.cb = new Float32Array(n);
    this.mat = new Uint8Array(n);
    this.side = new Uint8Array(n);
    this.image = new ImageData(W, H);
  }

  /** Fills the body's triangles into the buffers. */
  private fill(
    tris: Uint32Array,
    wp: Float32Array,
    wn: Float32Array,
    op: Float32Array,
    half: number,
    scale: number,
    cx: number,
    cy: number,
  ) {
    const W = this.w;
    const H = this.h;
    const zb = this.zb;
    for (let t = 0; t < tris.length; t += 3) {
      const ia = tris[t] * 3;
      const ib = tris[t + 1] * 3;
      const ic = tris[t + 2] * 3;
      const ax = wp[ia];
      const ay = wp[ia + 1];
      const bx = wp[ib];
      const by = wp[ib + 1];
      const cxw = wp[ic];
      const cyw = wp[ic + 1];
      // Facing away (in the world, y up): skip.
      const area = (bx - ax) * (cyw - ay) - (cxw - ax) * (by - ay);
      if (area <= 0) continue;
      const X0 = cx + ax * scale;
      const Y0 = cy - ay * scale;
      const X1 = cx + bx * scale;
      const Y1 = cy - by * scale;
      const X2 = cx + cxw * scale;
      const Y2 = cy - cyw * scale;
      const minX = Math.max(0, Math.floor(Math.min(X0, X1, X2)));
      const maxX = Math.min(W - 1, Math.ceil(Math.max(X0, X1, X2)));
      const minY = Math.max(0, Math.floor(Math.min(Y0, Y1, Y2)));
      const maxY = Math.min(H - 1, Math.ceil(Math.max(Y0, Y1, Y2)));
      if (minX > maxX || minY > maxY) continue;
      const box = this.box;
      if (minX < box[0]) box[0] = minX;
      if (minY < box[1]) box[1] = minY;
      if (maxX > box[2]) box[2] = maxX;
      if (maxY > box[3]) box[3] = maxY;
      // In screen space (y down) the winding flips.
      const D = (X1 - X0) * (Y2 - Y0) - (X2 - X0) * (Y1 - Y0);
      if (D === 0) continue;
      const invD = 1 / D;
      const back = tris[t] >= half ? 0 : 1;
      const za = wp[ia + 2];
      const zbv = wp[ib + 2];
      const zc = wp[ic + 2];
      for (let y = minY; y <= maxY; y++) {
        const py = y + 0.5;
        for (let x = minX; x <= maxX; x++) {
          const px = x + 0.5;
          const w1 = ((px - X0) * (Y2 - Y0) - (X2 - X0) * (py - Y0)) * invD;
          const w2 = ((X1 - X0) * (py - Y0) - (px - X0) * (Y1 - Y0)) * invD;
          const w0 = 1 - w1 - w2;
          if (w0 < -1e-4 || w1 < -1e-4 || w2 < -1e-4) continue;
          const z = za * w0 + zbv * w1 + zc * w2;
          const i = y * W + x;
          if (z <= zb[i]) continue;
          zb[i] = z;
          this.nx[i] = wn[ia] * w0 + wn[ib] * w1 + wn[ic] * w2;
          this.ny[i] = wn[ia + 1] * w0 + wn[ib + 1] * w1 + wn[ic + 1] * w2;
          this.nz[i] = wn[ia + 2] * w0 + wn[ib + 2] * w1 + wn[ic + 2] * w2;
          this.u[i] = op[ia] * w0 + op[ib] * w1 + op[ic] * w2;
          this.v[i] = op[ia + 1] * w0 + op[ib + 1] * w1 + op[ic + 1] * w2;
          this.mat[i] = BODY;
          this.side[i] = back;
        }
      }
    }
  }

  /**
   * The body's light, for its colour r, g, b and normal n, into `out`: lit, then tuned (so shade
   * deepens as well as darkens), then the lit side washed paler and the highlights added.
   */
  private light(
    r: number,
    g: number,
    b: number,
    nx: number,
    ny: number,
    nz: number,
    look: Look,
    out: Rgb,
  ) {
    const l = Math.hypot(nx, ny, nz) || 1;
    nx /= l;
    ny /= l;
    nz /= l;
    const ndl = nx * LX + ny * LY + nz * LZ;
    const shading = look.shading;
    const shadow = look.shadow;
    let k: number;
    let spec = 0;
    let wash = 0;
    if (shading === 'flat') {
      k = ndl > 0.05 ? 0.84 : 0.84 - 0.16 * shadow;
    } else {
      const wrap = shading === 'plastic' ? 0.2 : 0.25;
      const diff = Math.min(1, Math.max(0, (ndl + wrap) / (1 + wrap)));
      k =
        shading === 'plastic'
          ? 1 - shadow * (1 - (0.3 + 0.62 * diff))
          : (1 - shadow * (1 - (0.18 + 0.82 * diff))) * 1.02;
      const lit = ndl > 0 ? ndl : 0;
      const lit2 = lit * lit;
      wash = shading === 'plastic' ? lit2 * 0.4 : lit2 * lit2 * lit2 * 0.6;
      // Highlights come from a light a little more in front.
      const ndh = nx * SX + ny * SY + nz * SZ;
      if (shading === 'plastic')
        spec = Math.pow(Math.max(0, ndh), 60) * 0.3 + Math.pow(Math.max(0, ndh), 10) * 0.1;
      else if (look.sheen > 0 && ndh > 0) spec = Math.pow(ndh, 10) * look.sheen * 0.35;
    }
    out[0] = r * k;
    out[1] = g * k;
    out[2] = b * k;
    // Shade deepens: the darker, the more saturated.
    grade(out, look.brightness, look.saturation * (1 + Math.max(0, 0.9 - k) * 0.5));
    const lum = Math.min(1, (out[0] * 0.2126 + out[1] * 0.7152 + out[2] * 0.0722) * 1.1 + 0.06);
    const edge = 1 - Math.max(0, nz);
    const rim =
      edge *
      edge *
      edge *
      look.backLight *
      (shading === 'smooth' ? 0.7 : 0.16) *
      Math.max(0, 0.35 - nx * 0.65 + ny * 0.4);
    for (let c = 0; c < 3; c++) {
      const v = out[c] + (lum - out[c]) * wash;
      out[c] = v + spec + rim * (v * 0.6 + 0.25);
    }
  }

  /** Hard parts: glossy; cloth: soft; gold: metal; frames: dark gloss. */
  private lightPart(
    r: number,
    g: number,
    b: number,
    nx: number,
    ny: number,
    nz: number,
    m: number,
    look: Look,
    out: Rgb,
  ) {
    const ndl = nx * LX + ny * LY + nz * LZ;
    const ndh = (nx * HX + ny * HY + nz * HZ) / HL;
    const shadow = look.shadow;
    if (m === CLOTH) {
      const diff = Math.max(0, (ndl + 0.5) / 1.5);
      const k = 1 - shadow * (1 - (0.45 + 0.55 * diff)) * 0.9;
      out[0] = r * k;
      out[1] = g * k;
      out[2] = b * k;
      return;
    }
    const diff = Math.max(0, (ndl + 0.2) / 1.2);
    const k = 1 - shadow * (1 - (0.4 + 0.6 * diff)) * 0.9;
    const gloss = m === GOLD ? 0.9 : m === FRAME ? 0.5 : 0.7;
    const spec = Math.pow(Math.max(0, ndh), m === GOLD ? 24 : 50) * gloss;
    const tint = m === GOLD ? 1 : 0;
    out[0] = r * k + spec * (1 - tint + tint * r);
    out[1] = g * k + spec * (1 - tint + tint * g);
    out[2] = b * k + spec * (1 - tint + tint * b);
  }

  /** The solids this avatar wears, in the body's own units. */
  private solids(look: Look, mesh: Mesh): Solid[] {
    const shape = SHAPES[look.type];
    const out: Solid[] = [];
    const body = parse(look.color ?? shape.color);
    const part = shape.partColor
      ? parse(shape.partColor)
      : (body.map((c) => Math.min(1, c * 0.9 + 0.08)) as Rgb);
    for (const a of shape.antennas ?? []) {
      const [fx, fy, fz] = a.from;
      const [tx, ty, tz] = a.to;
      const dx = tx - fx;
      const dy = ty - fy;
      const dz = tz - fz;
      const len = Math.hypot(dx, dy, dz);
      const [ux, uy, uz] = [dx / len, dy / len, dz / len];
      // Any two axes across the stem.
      const [px, py, pz] =
        Math.abs(uy) < 0.9 ? cross(ux, uy, uz, 0, 1, 0) : cross(ux, uy, uz, 1, 0, 0);
      const [qx, qy, qz] = cross(ux, uy, uz, px, py, pz);
      const rad = 0.042;
      out.push({
        kind: 'tube',
        at: [fx, fy, fz],
        axes: [px * rad, py * rad, pz * rad, dx, dy, dz, qx * rad, qy * rad, qz * rad],
        material: PART,
        color: part,
      });
      out.push({
        kind: 'ball',
        at: [tx, ty, tz],
        axes: [a.ball, 0, 0, 0, a.ball, 0, 0, 0, a.ball],
        material: PART,
        color: part,
      });
    }
    for (const e of shape.ears ?? []) {
      out.push({
        kind: 'ball',
        at: [e.at[0], e.at[1], 0],
        axes: [0.09, 0, 0, 0, e.radius, 0, 0, 0, e.radius],
        material: PART,
        color: part,
      });
    }

    const top = mesh.top;
    const hatColor: Record<Exclude<Hat, 'none'>, Rgb> = {
      beret: parse('#2b2d42'),
      beanie: parse('#e25a4f'),
      party: parse('#ffca3a'),
      crown: parse('#f2b632'),
    };
    if (look.hat === 'beret') {
      const tilt = 0.28;
      const c = Math.cos(tilt);
      const s = Math.sin(tilt);
      out.push({
        kind: 'ball',
        at: [0.08, top - 0.08, 0],
        axes: [0.62 * c, 0.62 * s, 0, -0.17 * s, 0.17 * c, 0, 0, 0, 0.6],
        material: CLOTH,
        color: hatColor.beret,
      });
      out.push({
        kind: 'ball',
        at: [0.08 - 0.17 * s, top + 0.09, 0],
        axes: [0.05, 0, 0, 0, 0.07, 0, 0, 0, 0.05],
        material: CLOTH,
        color: hatColor.beret,
      });
    } else if (look.hat === 'beanie') {
      out.push({
        kind: 'ball',
        at: [0, top - 0.3, 0],
        axes: [0.66, 0, 0, 0, 0.56, 0, 0, 0, 0.56],
        material: CLOTH,
        color: hatColor.beanie,
        clip: 0,
        stripes: { color: hatColor.beanie.map((v) => v * 0.82) as Rgb, every: 0.18 },
      });
      out.push({
        kind: 'tube',
        at: [0, top - 0.4, 0],
        axes: [0.69, 0, 0, 0, 0.17, 0, 0, 0, 0.6],
        material: CLOTH,
        color: hatColor.beanie.map((v) => v * 0.86) as Rgb,
      });
      out.push({
        kind: 'ball',
        at: [0, top + 0.3, 0],
        axes: [0.15, 0, 0, 0, 0.15, 0, 0, 0, 0.15],
        material: CLOTH,
        color: parse('#f6f1ea'),
      });
    } else if (look.hat === 'party') {
      const tilt = -0.22;
      const c = Math.cos(tilt);
      const s = Math.sin(tilt);
      const h = 0.78;
      out.push({
        kind: 'cone',
        at: [0.1, top - 0.16, 0],
        axes: [0.3 * c, 0.3 * s, 0, -h * s, h * c, 0, 0, 0, 0.3],
        material: CLOTH,
        color: hatColor.party,
        stripes: { color: parse('#ff5d8f'), every: 0.22 },
      });
      out.push({
        kind: 'ball',
        at: [0.1 - h * s, top - 0.16 + h * c, 0],
        axes: [0.09, 0, 0, 0, 0.09, 0, 0, 0, 0.09],
        material: CLOTH,
        color: parse('#5ec8ff'),
      });
    } else if (look.hat === 'crown') {
      const y0 = top - 0.16;
      out.push({
        kind: 'tube',
        at: [0, y0, 0],
        axes: [0.42, 0, 0, 0, 0.16, 0, 0, 0, 0.3],
        material: GOLD,
        color: hatColor.crown,
      });
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + ((i - 2) * Math.PI) / 5.2;
        const x = Math.cos(a) * 0.42;
        const z = -Math.sin(a) * 0.3;
        out.push({
          kind: 'cone',
          at: [x, y0 + 0.14, z],
          axes: [0.08, 0, 0, 0, 0.2, 0, 0, 0, 0.08],
          material: GOLD,
          color: hatColor.crown,
        });
        out.push({
          kind: 'ball',
          at: [x, y0 + 0.36, z],
          axes: [0.045, 0, 0, 0, 0.045, 0, 0, 0, 0.045],
          material: GOLD,
          color: hatColor.crown,
        });
      }
    }

    if (look.glasses !== 'none') {
      const eyes = shape.eyes;
      const frame = parse('#1d1b22');
      const ring = Math.max(eyes.rx, eyes.ry) * 1.65;
      const squareFrame = look.glasses === 'square';
      for (const sideX of [-1, 1]) {
        const ex = sideX * eyes.gap;
        const ey = eyes.y;
        const z = mesh.heightAt(ex, ey) + 0.03;
        const n = 26;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          let x = Math.cos(a);
          let y = Math.sin(a);
          if (squareFrame) {
            const m = Math.max(Math.abs(x), Math.abs(y));
            x = (x / m) * 0.92;
            y = (y / m) * 0.8;
          }
          const px = ex + x * ring;
          const py = ey + y * ring;
          const pz = Math.max(z, mesh.heightAt(px, py) + 0.03);
          out.push({
            kind: 'ball',
            at: [px, py, pz],
            axes: [0.034, 0, 0, 0, 0.034, 0, 0, 0, 0.034],
            material: FRAME,
            color: frame,
          });
        }
      }
      // The bridge.
      const by = eyes.y + 0.04;
      const bz = mesh.heightAt(0, by) + 0.04;
      for (let i = 0; i <= 6; i++) {
        const x = (-0.5 + i / 6) * (eyes.gap * 2 - ring * 1.7);
        out.push({
          kind: 'ball',
          at: [x, by + 0.02 * Math.cos((i / 6) * Math.PI - Math.PI / 2), bz],
          axes: [0.03, 0, 0, 0, 0.03, 0, 0, 0, 0.03],
          material: FRAME,
          color: frame,
        });
      }
    }
    return out;
  }

  /** Casts a ray through every pixel of a solid's box, straight into the screen. */
  private cast(
    solid: Solid,
    L: number[],
    ox: number,
    oy: number,
    oz: number,
    scale: number,
    cx: number,
    cy: number,
  ) {
    const W = this.w;
    const H = this.h;
    // World centre and axes.
    const [sx, sy, sz] = solid.at;
    const wx = L[0] * sx + L[1] * sy + L[2] * sz + ox;
    const wy = L[3] * sx + L[4] * sy + L[5] * sz + oy;
    const wz = L[6] * sx + L[7] * sy + L[8] * sz + oz;
    const a = solid.axes;
    // A = L * axes (columns).
    const A = mul(L, [a[0], a[3], a[6], a[1], a[4], a[7], a[2], a[5], a[8]]);
    const inv = invert(A);
    if (!inv) return;
    // Its screen box: the solid fits in a sphere of radius the longest axis (and its height).
    const c0 = Math.hypot(A[0], A[3], A[6]);
    const c1 = Math.hypot(A[1], A[4], A[7]);
    const c2 = Math.hypot(A[2], A[5], A[8]);
    const reach =
      (solid.kind === 'ball' ? Math.max(c0, c1, c2) : c1 + Math.max(c0, c2)) * scale + 2;
    const mx = cx + wx * scale;
    const my = cy - wy * scale;
    const minX = Math.max(0, Math.floor(mx - reach));
    const maxX = Math.min(W - 1, Math.ceil(mx + reach));
    const minY = Math.max(0, Math.floor(my - reach));
    const maxY = Math.min(H - 1, Math.ceil(my + reach));
    const box = this.box;
    if (minX < box[0]) box[0] = minX;
    if (minY < box[1]) box[1] = minY;
    if (maxX > box[2]) box[2] = maxX;
    if (maxY > box[3]) box[3] = maxY;
    // The ray's direction in local units: A^-1 (0, 0, 1).
    const dx = inv[2];
    const dy = inv[5];
    const dz = inv[8];
    const zb = this.zb;
    for (let y = minY; y <= maxY; y++) {
      const py = (cy - (y + 0.5)) / scale - wy;
      for (let x = minX; x <= maxX; x++) {
        const px = (x + 0.5 - cx) / scale - wx;
        const qx = inv[0] * px + inv[1] * py;
        const qy = inv[3] * px + inv[4] * py;
        const qz = inv[6] * px + inv[7] * py;
        let t = NaN;
        let hx = 0;
        let hy = 0;
        let hz = 0;
        let nxl = 0;
        let nyl = 0;
        let nzl = 0;
        if (solid.kind === 'ball') {
          const A2 = dx * dx + dy * dy + dz * dz;
          const B = 2 * (qx * dx + qy * dy + qz * dz);
          const C = qx * qx + qy * qy + qz * qz - 1;
          const disc = B * B - 4 * A2 * C;
          if (disc < 0) continue;
          const sq = Math.sqrt(disc);
          for (const tt of [(-B + sq) / (2 * A2), (-B - sq) / (2 * A2)]) {
            const ly = qy + dy * tt;
            if (solid.clip !== undefined && ly < solid.clip) continue;
            t = tt;
            hx = qx + dx * tt;
            hy = ly;
            hz = qz + dz * tt;
            nxl = hx;
            nyl = hy;
            nzl = hz;
            break;
          }
        } else if (solid.kind === 'cone') {
          // x² + z² = (1 - y)², 0 ≤ y ≤ 1.
          const ky = 1 - qy;
          const A2 = dx * dx + dz * dz - dy * dy;
          const B = 2 * (qx * dx + qz * dz + ky * dy);
          const C = qx * qx + qz * qz - ky * ky;
          const disc = B * B - 4 * A2 * C;
          if (disc < 0 || Math.abs(A2) < 1e-9) continue;
          const sq = Math.sqrt(disc);
          const t1 = (-B + sq) / (2 * A2);
          const t2 = (-B - sq) / (2 * A2);
          for (const tt of t1 > t2 ? [t1, t2] : [t2, t1]) {
            const ly = qy + dy * tt;
            if (ly < 0 || ly > 1) continue;
            t = tt;
            hx = qx + dx * tt;
            hy = ly;
            hz = qz + dz * tt;
            nxl = hx;
            nyl = 1 - ly;
            nzl = hz;
            break;
          }
        } else {
          // Tube: x² + z² = 1, 0 ≤ y ≤ 1, open at both ends.
          const A2 = dx * dx + dz * dz;
          const B = 2 * (qx * dx + qz * dz);
          const C = qx * qx + qz * qz - 1;
          const disc = B * B - 4 * A2 * C;
          if (disc < 0 || A2 < 1e-9) continue;
          const sq = Math.sqrt(disc);
          const t1 = (-B + sq) / (2 * A2);
          const t2 = (-B - sq) / (2 * A2);
          let first = true;
          for (const tt of t1 > t2 ? [t1, t2] : [t2, t1]) {
            const ly = qy + dy * tt;
            if (ly >= 0 && ly <= 1) {
              t = tt;
              hx = qx + dx * tt;
              hy = ly;
              hz = qz + dz * tt;
              const f = first ? 1 : -1;
              nxl = hx * f;
              nyl = 0;
              nzl = hz * f;
              break;
            }
            first = false;
          }
        }
        if (Number.isNaN(t)) continue;
        const z = wz + t;
        const i = y * W + x;
        if (z <= zb[i]) continue;
        // World normal: A^-T times the local one.
        let nX = inv[0] * nxl + inv[3] * nyl + inv[6] * nzl;
        let nY = inv[1] * nxl + inv[4] * nyl + inv[7] * nzl;
        let nZ = inv[2] * nxl + inv[5] * nyl + inv[8] * nzl;
        const l = Math.hypot(nX, nY, nZ) || 1;
        nX /= l;
        nY /= l;
        nZ /= l;
        zb[i] = z;
        this.nx[i] = nX;
        this.ny[i] = nY;
        this.nz[i] = nZ;
        this.mat[i] = solid.material;
        let c = solid.color;
        if (solid.stripes && Math.floor(hy / solid.stripes.every) % 2) c = solid.stripes.color;
        this.cr[i] = c[0];
        this.cg[i] = c[1];
        this.cb[i] = c[2];
      }
    }
  }
}

/** How much of the eyes covers a point (u, v) of the face, 0–1, with an edge `aa` wide. */
function eyeCover(
  u: number,
  v: number,
  eyes: { y: number; gap: number; rx: number; ry: number },
  pose: Pose,
  aa: number,
) {
  const dy0 = v - (eyes.y + pose.lookY);
  if (Math.abs(dy0) > eyes.ry * 1.6) return 0;
  const lx = pose.lookX;
  const dxl = Math.abs(u - lx);
  if (dxl > eyes.gap + eyes.rx * 2) return 0;
  let best = 0;
  for (const side of [-1, 1]) {
    const dx = u - (side * eyes.gap + lx);
    const dy = dy0;
    let cover = 0;
    const arcs = Math.max(pose.happy, pose.sleep);
    if (arcs < 1) {
      // Open eye: an ellipse that flattens to a dash as it closes.
      const open = Math.max(0, Math.min(1, pose.open));
      const ry = Math.max(eyes.ry * open, eyes.ry * 0.17);
      const rx = eyes.rx * (1 + (1 - open) * 0.35);
      const q = Math.hypot(dx / rx, dy / ry);
      const d = (q - 1) * Math.min(rx, ry);
      cover = Math.max(0, Math.min(1, 0.5 - d / aa)) * (1 - arcs);
    }
    if (arcs > 0) {
      // Arcs: ^ when happy (the top of a ring), ‿ asleep (its bottom).
      const happy = pose.happy >= pose.sleep;
      const ring = eyes.rx * 1.05;
      const thick = eyes.rx * 0.32;
      const ccy = happy ? -ring * 0.45 : ring * 0.55;
      const px = dx;
      const py = dy - ccy;
      const ang = Math.atan2(py, px);
      const spread = 1.05;
      const mid = happy ? Math.PI / 2 : -Math.PI / 2;
      let da = ang - mid;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      let d: number;
      if (Math.abs(da) <= spread) {
        d = Math.abs(Math.hypot(px, py) - ring) - thick;
      } else {
        const ea = mid + Math.sign(da) * spread;
        d = Math.hypot(px - Math.cos(ea) * ring, py - Math.sin(ea) * ring) - thick;
      }
      cover = Math.max(cover, Math.max(0, Math.min(1, 0.5 - d / aa)) * arcs);
    }
    best = Math.max(best, cover);
  }
  return best;
}

function mul(a: number[], b: number[]) {
  const o = new Array<number>(9);
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      o[r * 3 + c] = a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c];
  return o;
}

function invert(m: number[]) {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const det = a * A + b * B + c * C;
  if (Math.abs(det) < 1e-12) return null;
  const k = 1 / det;
  return [
    A * k,
    -(b * i - c * h) * k,
    (b * f - c * e) * k,
    B * k,
    (a * i - c * g) * k,
    -(a * f - c * d) * k,
    C * k,
    -(a * h - b * g) * k,
    (a * e - b * d) * k,
  ];
}

function cross(ax: number, ay: number, az: number, bx: number, by: number, bz: number) {
  const x = ay * bz - az * by;
  const y = az * bx - ax * bz;
  const z = ax * by - ay * bx;
  const l = Math.hypot(x, y, z) || 1;
  return [x / l, y / l, z / l] as const;
}
