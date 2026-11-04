// Copyright (c) 2026 Bruno Delorence. MIT License.

import { SHAPES, type ShapeName } from './shapes';

/*
 * From a flat outline to a plush body. A square grid is laid over the outline; grid points just
 * outside it are pulled onto it, so the edge is smooth. Each point is lifted to a height that
 * grows from nothing at the outline, round like a cushion's seam, to the body's full thickness
 * a little way in, plus a gentle dome over the whole face. The front is that surface and the back
 * its mirror, joined at the outline: two triangle sheets, each with a normal at every point.
 *
 * Built once per body, thickness and grid size, and shared by every avatar that draws it. The
 * fur's roots are scattered over the same surface, as many as the size asks for.
 */

export type Mesh = {
  /** Points, then normals, 3 numbers each: the front sheet's first, then the back's. */
  pos: Float32Array;
  nrm: Float32Array;
  /** Triangles, as point indices, already wound to face out. */
  tris: Uint32Array;
  /** The lowest point of the outline (the body squashes down onto it) and its top at the middle. */
  bottom: number;
  top: number;
  /** Height of the front surface anywhere on the face (0 outside it). */
  heightAt: (x: number, y: number) => number;
};

export type Roots = {
  /** Per root: x, y, z, nx, ny, nz, length (0–1), shade (0–1), jitter x, y, z. */
  data: Float32Array;
  count: number;
};

const STRIDE = 11;
export const ROOT_STRIDE = STRIDE;

/** How far in from the outline the seam rounds over, and the thickness at full height. */
const SEAM = 0.5;
const THICK = 0.4;

const meshes = new Map<string, Mesh>();
const roots = new Map<string, Roots>();

export function getMesh(name: ShapeName, depth: number, grid: number): Mesh {
  const key = `${name}|${depth.toFixed(2)}|${grid}`;
  let mesh = meshes.get(key);
  if (!mesh) {
    mesh = build(name, depth, grid);
    if (meshes.size > 40) meshes.clear();
    meshes.set(key, mesh);
  }
  return mesh;
}

function build(name: ShapeName, depthScale: number, grid: number): Mesh {
  const shape = SHAPES[name];
  const sdf = shape.sdf;
  const thick = THICK * shape.depth * depthScale;
  const extent = 1.2;
  const step = (extent * 2) / grid;
  const eps = 0.002;

  const grad = (x: number, y: number) => {
    const gx = sdf(x + eps, y) - sdf(x - eps, y);
    const gy = sdf(x, y + eps) - sdf(x, y - eps);
    const l = Math.hypot(gx, gy) || 1;
    return [gx / l, gy / l];
  };
  // The face's swell: a membrane stretched over the outline and pushed out evenly from behind
  // (a Poisson problem, solved on a grid by over-relaxation). Its square root rounds off steeply
  // at the outline, like a stuffed cushion's seam, with no folds where lobes meet.
  const F = 72;
  const cell = (extent * 2) / F;
  const N = F + 1;
  const m = new Float32Array(N * N);
  const inside = new Uint8Array(N * N);
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++)
      inside[j * N + i] = sdf(-extent + i * cell, -extent + j * cell) < 0 ? 1 : 0;
  const load = cell * cell;
  for (let pass = 0; pass < 260; pass++) {
    for (let j = 1; j < F; j++)
      for (let i = 1; i < F; i++) {
        const k = j * N + i;
        if (!inside[k]) continue;
        const next = (m[k - 1] + m[k + 1] + m[k - N] + m[k + N] + load) / 4;
        m[k] += (next - m[k]) * 1.85;
      }
  }
  let peak = 0;
  for (let k = 0; k < m.length; k++) peak = Math.max(peak, m[k]);
  // Wide bodies swell a little more than narrow ones, but never by much.
  const swell = Math.min(1.15, Math.max(0.75, Math.sqrt(peak / 0.2)));
  const membrane = (x: number, y: number) => {
    const fx = (x + extent) / cell;
    const fy = (y + extent) / cell;
    const i = Math.max(0, Math.min(F - 1, Math.floor(fx)));
    const j = Math.max(0, Math.min(F - 1, Math.floor(fy)));
    const tx = fx - i;
    const ty = fy - j;
    const k = j * N + i;
    const a = m[k] + (m[k + 1] - m[k]) * tx;
    const b = m[k + N] + (m[k + N + 1] - m[k + N]) * tx;
    return (a + (b - a) * ty) / peak;
  };
  const heightAt = (x: number, y: number) => {
    const d = -sdf(x, y);
    if (d <= 0) return 0;
    // Close to the outline the membrane's grid is too coarse: there the swell follows the
    // distance in, which the membrane matches a little way inside.
    const near = Math.min(1, d / (cell * 2.5));
    const v = membrane(x, y) * near + Math.min(1, (d / SEAM) * 0.5) * (1 - near);
    return thick * swell * Math.sqrt(Math.max(0, v));
  };

  const n = grid + 1;
  const px = new Float32Array(n * n);
  const py = new Float32Array(n * n);
  const keep = new Int32Array(n * n).fill(-1);
  const near = step * 1.6;
  let count = 0;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      let x = -extent + i * step;
      let y = -extent + j * step;
      let d = sdf(x, y);
      if (d > near) continue;
      if (d > 0) {
        // Pull the point onto the outline.
        for (let k = 0; k < 4 && Math.abs(d) > 1e-4; k++) {
          const [gx, gy] = grad(x, y);
          x -= gx * d;
          y -= gy * d;
          d = sdf(x, y);
        }
      }
      const k = j * n + i;
      px[k] = x;
      py[k] = y;
      keep[k] = count++;
    }
  }

  const pos = new Float32Array(count * 2 * 3);
  const nrm = new Float32Array(count * 2 * 3);
  let bottom = Infinity;
  for (let k = 0; k < n * n; k++) {
    const v = keep[k];
    if (v < 0) continue;
    const x = px[k];
    const y = py[k];
    const h = heightAt(x, y);
    let nx: number;
    let ny: number;
    let nz: number;
    if (h <= 1e-5) {
      // On the outline the surface stands on edge: its normal points straight out.
      [nx, ny] = grad(x, y);
      nz = 0;
    } else {
      const e = step * 0.5;
      const hx = (heightAt(x + e, y) - heightAt(x - e, y)) / (2 * e);
      const hy = (heightAt(x, y + e) - heightAt(x, y - e)) / (2 * e);
      const l = Math.hypot(hx, hy, 1);
      nx = -hx / l;
      ny = -hy / l;
      nz = 1 / l;
    }
    bottom = Math.min(bottom, y);
    const f = v * 3;
    const b = (v + count) * 3;
    pos[f] = x;
    pos[f + 1] = y;
    pos[f + 2] = h;
    nrm[f] = nx;
    nrm[f + 1] = ny;
    nrm[f + 2] = nz;
    pos[b] = x;
    pos[b + 1] = y;
    pos[b + 2] = -h;
    nrm[b] = nx;
    nrm[b + 1] = ny;
    nrm[b + 2] = -nz;
  }

  const tris: number[] = [];
  const push = (a: number, b: number, c: number) => {
    tris.push(a, b, c);
    tris.push(c + count, b + count, a + count);
  };
  for (let j = 0; j < grid; j++) {
    for (let i = 0; i < grid; i++) {
      const a = keep[j * n + i];
      const b = keep[j * n + i + 1];
      const c = keep[(j + 1) * n + i + 1];
      const d = keep[(j + 1) * n + i];
      const all = a >= 0 && b >= 0 && c >= 0 && d >= 0;
      if (all) {
        push(a, b, c);
        push(a, c, d);
      } else {
        // A corner cell: keep the triangle its three points make.
        const corners = [a, b, c, d].filter((v) => v >= 0);
        if (corners.length === 3) push(corners[0], corners[1], corners[2]);
      }
    }
  }
  // Wind each triangle to face out: front ones towards +z, back ones towards -z.
  const out = new Uint32Array(tris);
  for (let t = 0; t < out.length; t += 3) {
    const a = out[t] * 3;
    const b = out[t + 1] * 3;
    const c = out[t + 2] * 3;
    const cross =
      (pos[b] - pos[a]) * (pos[c + 1] - pos[a + 1]) - (pos[c] - pos[a]) * (pos[b + 1] - pos[a + 1]);
    const back = out[t] >= count;
    if (cross < 0 !== back) {
      const s = out[t + 1];
      out[t + 1] = out[t + 2];
      out[t + 2] = s;
    }
  }

  let top = 0;
  for (let y = 1.3; y > -1; y -= 0.005) {
    if (sdf(0, y) < 0) {
      top = y;
      break;
    }
  }
  return { pos, nrm, tris: out, bottom, top, heightAt };
}

/** A small, fixed random series, so the fur looks the same on every load. */
function random(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

/**
 * The fur's roots: scattered evenly over the surface, `density` per square unit, each with a
 * length, a shade and a lean of its own.
 */
export function getRoots(key: string, mesh: Mesh, density: number): Roots {
  const id = `${key}|${density}`;
  let found = roots.get(id);
  if (found) return found;
  const { pos, nrm, tris } = mesh;
  const rand = random(7919);
  const list: number[] = [];
  for (let t = 0; t < tris.length; t += 3) {
    const a = tris[t] * 3;
    const b = tris[t + 1] * 3;
    const c = tris[t + 2] * 3;
    const ux = pos[b] - pos[a];
    const uy = pos[b + 1] - pos[a + 1];
    const uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a];
    const vy = pos[c + 1] - pos[a + 1];
    const vz = pos[c + 2] - pos[a + 2];
    const area = 0.5 * Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx);
    let want = area * density;
    while (want > 0) {
      if (want < 1 && rand() > want) break;
      want -= 1;
      let r1 = rand();
      let r2 = rand();
      if (r1 + r2 > 1) {
        r1 = 1 - r1;
        r2 = 1 - r2;
      }
      const w0 = 1 - r1 - r2;
      for (let k = 0; k < 3; k++) list.push(pos[a + k] * w0 + pos[b + k] * r1 + pos[c + k] * r2);
      let nx = nrm[a] * w0 + nrm[b] * r1 + nrm[c] * r2;
      let ny = nrm[a + 1] * w0 + nrm[b + 1] * r1 + nrm[c + 1] * r2;
      let nz = nrm[a + 2] * w0 + nrm[b + 2] * r1 + nrm[c + 2] * r2;
      const l = Math.hypot(nx, ny, nz) || 1;
      nx /= l;
      ny /= l;
      nz /= l;
      list.push(nx, ny, nz, 0.45 + rand() * 0.55, rand());
      list.push(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1);
    }
  }
  // Shuffle, so that drawing only the first part of the list still covers the whole body.
  const count = list.length / STRIDE;
  const data = new Float32Array(list);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    for (let k = 0; k < STRIDE; k++) {
      const s = data[i * STRIDE + k];
      data[i * STRIDE + k] = data[j * STRIDE + k];
      data[j * STRIDE + k] = s;
    }
  }
  found = { data, count };
  if (roots.size > 40) roots.clear();
  roots.set(id, found);
  return found;
}
