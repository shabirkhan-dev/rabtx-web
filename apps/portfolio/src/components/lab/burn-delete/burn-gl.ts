// Copyright (c) 2026 Bruno Delorence. MIT License.
// Changed for rabtx: an `ember` uniform blends the pink fire into a classic orange one.

/*
 * The burn, drawn by one fragment shader over the whole stage. Every pixel asks how far it is
 * from the burn's origin (the button), against a radius roughened by two layers of value noise:
 * big slow lobes, so the hole grows unevenly, and a fine jag that flickers, so its edge looks
 * torn. That signed distance f, in units of a hundredth of the stage, decides everything:
 *
 * - f < 0, burnt: first a band of fire, white-hot at the edge through pink and salmon to an
 *   indigo glow, 2 units deep along the top and up to 26 along the bottom, where it rises in
 *   tongues (noise stretched tall, scrolling up); past it, black.
 * - f > 0, the page still standing: a thin charred line on the edge, a scorched brown band
 *   (deeper as the page is restored), a white and pink heat haze, and soft flames licking up
 *   the page above the hole.
 * - Far inside, the dark screen's fine embers: a grid of cells, one spark in some of them,
 *   drifting up and twinkling.
 * - Out of the burn, the grey smoke the page is left with after a restore, fading away.
 *
 * It writes premultiplied alpha, so the page under the canvas shows wherever nothing is drawn.
 */

const VERTEX = `
attribute vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }
`;

const FRAGMENT = `
precision highp float;
uniform vec2 uRes;      // the stage, css px
uniform float uDpr;
uniform vec2 uOrigin;   // css px, y down
uniform float uRadius;  // css px
uniform float uUnit;    // css px in a unit: a hundredth of the stage's shorter side
uniform float uTime;
uniform float uSmoke;
uniform float uSmokeTone;
uniform float uScorch;   // 0 on the way out, 1 on the way back
uniform float uEmber;    // 0: the pink fire; 1: an orange one

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.03 + 17.1;
    a *= 0.5;
  }
  return v;
}
// The fire, from where it meets the black (0) to the white-hot edge (1).
vec3 flameRamp(float t) {
  vec3 c = mix(vec3(0.0), mix(vec3(0.2, 0.15, 0.62), vec3(0.42, 0.05, 0.02), uEmber), smoothstep(0.0, 0.14, t));
  c = mix(c, mix(vec3(0.92, 0.3, 0.42), vec3(0.95, 0.32, 0.05), uEmber), smoothstep(0.1, 0.35, t));
  c = mix(c, mix(vec3(1.0, 0.66, 0.74), vec3(1.0, 0.72, 0.28), uEmber), smoothstep(0.32, 0.6, t));
  return mix(c, vec3(1.0, 0.98, 0.94), smoothstep(0.55, 0.85, t));
}
float sparks(vec2 p, float cell, float speed, float seed) {
  vec2 g = p / cell + vec2(seed, uTime * speed);
  vec2 id = floor(g);
  vec2 fr = fract(g) - 0.5;
  float h = hash(id + seed);
  vec2 off = vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5;
  float d = length((fr - off * 0.7) * cell);
  float on = step(0.55, h);
  float twinkle = 0.45 + 0.55 * sin(uTime * (1.5 + h * 3.0) + h * 40.0);
  return on * twinkle * smoothstep(1.4, 0.2, d);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y * uDpr - gl_FragCoord.y) / uDpr;
  vec2 q = p / uUnit;
  vec2 d = p - uOrigin;
  // The hole is a little wider than it is tall, as in a page held upright.
  d.y *= 1.14;
  float r = length(d);
  float lobes = fbm(q * 0.045 + vec2(0.0, uTime * 0.04));
  float jag = fbm(q * 0.38 - vec2(0.0, uTime * 0.5));
  float grown = smoothstep(0.0, 12.0 * uUnit, uRadius);
  float edge = uRadius * (0.72 + 0.56 * lobes) + (jag - 0.5) * 3.2 * uUnit * grown;
  float f = (r - edge) / uUnit;
  // 1 below the origin, less above: the flames climb from the hole's lower lip.
  float below = smoothstep(-0.4, 0.5, d.y / max(r, 1.0));
  float above = 1.0 - smoothstep(-0.5, 0.3, d.y / max(r, 1.0));

  vec3 col = vec3(0.0);
  float alpha = 0.0;

  if (uRadius > 0.5) {
    // The fire's band inside the edge: thin along the top, deep along the bottom, where tongues
    // of it climb into the hole (noise stretched tall and scrolling up).
    float tongues = fbm(vec2(q.x * 0.075, q.y * 0.03 + uTime * 0.32));
    float band = mix(3.0, 4.0 + 24.0 * smoothstep(0.3, 0.66, tongues), below) * grown;
    if (f < 0.0) {
      float depth = -f;
      float h = 1.0 - depth / max(band, 0.001);
      if (h > 0.0) {
        col = flameRamp(h);
      } else {
        // Past the fire: black, a glow just beyond it, and the drifting embers.
        col = mix(vec3(0.24, 0.2, 0.8), vec3(0.6, 0.12, 0.03), uEmber) * exp(h * band / 2.4) * 0.55;
        float dust = sparks(p, 26.0, 0.12, 0.0) * 0.7 + sparks(p, 41.0, 0.07, 9.0);
        float sparkTone = hash(floor(p / 26.0));
        col += dust * mix(vec3(0.55, 0.55, 0.6), vec3(1.0, 0.78, 0.4), step(0.7, sparkTone))
               * smoothstep(0.0, 3.0, -h * band);
      }
      alpha = 1.0;
    } else {
      // Still standing: a thin charred line on the edge, a scorched band (deeper on the way
      // back), a heat haze, and flames licking up the page above the hole.
      float charLine = exp(-abs(f - 0.5) / 0.35) * (0.5 + 0.5 * jag) * 0.85;
      float scorch = exp(-f / (1.5 + 3.0 * uScorch)) * (0.4 + 0.6 * jag) * (0.3 + 0.6 * uScorch);
      float halo = exp(-f / 3.2) * 0.85;
      float fl = fbm(vec2(q.x * 0.12, q.y * 0.045 + uTime * 0.7));
      float lick = smoothstep(0.42, 0.8, fl) * exp(-f / 5.0) * above * step(f, 30.0);
      vec4 acc = vec4(vec3(0.5, 0.25, 0.08) * scorch, scorch);
      vec3 haze = mix(vec3(1.0, 0.82, 0.88), vec3(1.0, 0.86, 0.62), uEmber);
      vec4 hz = vec4(haze * halo, halo);
      acc = hz + acc * (1.0 - hz.a);
      vec3 lickTone = mix(
        mix(vec3(0.78, 0.7, 1.0), vec3(1.0, 0.72, 0.85), fl),
        mix(vec3(1.0, 0.45, 0.1), vec3(1.0, 0.82, 0.4), fl),
        uEmber
      );
      vec4 lk = vec4(lickTone * lick, lick);
      acc = lk + acc * (1.0 - lk.a);
      vec4 ch = vec4(vec3(0.3, 0.14, 0.05) * charLine, charLine);
      acc = ch + acc * (1.0 - ch.a);
      col = acc.rgb;
      alpha = acc.a;
    }
  }

  // The smoke left over the page: soft grey wisps, outside the hole.
  if (uSmoke > 0.001 && f > 0.0) {
    float s = fbm(vec2(q.x * 0.035, q.y * 0.022 + uTime * 0.08));
    float wisp = smoothstep(0.45, 0.8, s) * uSmoke * 0.2;
    vec4 sm = vec4(vec3(uSmokeTone) * wisp, wisp);
    col = sm.rgb + col * (1.0 - sm.a);
    alpha = sm.a + alpha * (1.0 - sm.a);
  }

  gl_FragColor = vec4(col, alpha);
}
`;

export type BurnFrame = {
  width: number;
  height: number;
  origin: { x: number; y: number };
  radius: number;
  time: number;
  smoke: number;
  /** The smoke's grey: darker over a light page, lighter over a dark one. */
  smokeTone: number;
  /** How burnt the page around the hole looks: 0 as it burns, 1 as it is restored. */
  scorch: number;
  /** 0 for the pink fire, 1 for an orange one. */
  ember?: number;
};

export type BurnRenderer = {
  draw: (frame: BurnFrame) => void;
  clear: () => void;
  dispose: () => void;
};

/** The px a burn unit is on a stage this size: a hundredth of its shorter side. */
export const unitOf = (width: number, height: number) => Math.min(width, height) / 100;

/** How far the radius must go to burn the whole stage, its noisy edge included. */
export function fullRadius(width: number, height: number, origin: { x: number; y: number }) {
  const far = Math.max(
    Math.hypot(origin.x, origin.y * 1.14),
    Math.hypot(width - origin.x, origin.y * 1.14),
    Math.hypot(origin.x, (height - origin.y) * 1.14),
    Math.hypot(width - origin.x, (height - origin.y) * 1.14),
  );
  // The smallest the lobes make the edge is 0.72 of the radius; past that, the flames' reach.
  return far / 0.72 + unitOf(width, height) * 22;
}

/** Sets up the shader on `canvas`, or returns null where WebGL isn't there. */
export function createBurn(canvas: HTMLCanvasElement): BurnRenderer | null {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false });
  if (!gl) return null;
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
  };
  const vs = compile(gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vs || !fs || !program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  // One triangle that covers the viewport.
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const a = gl.getAttribLocation(program, 'a');
  gl.enableVertexAttribArray(a);
  gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);

  const u = (name: string) => gl.getUniformLocation(program, name);
  const loc = {
    res: u('uRes'),
    dpr: u('uDpr'),
    origin: u('uOrigin'),
    radius: u('uRadius'),
    unit: u('uUnit'),
    time: u('uTime'),
    smoke: u('uSmoke'),
    smokeTone: u('uSmokeTone'),
    scorch: u('uScorch'),
    ember: u('uEmber'),
  };

  // A burn has soft edges everywhere: up to 1.5 device px per css px is plenty, and cheaper.
  const dpr = () => Math.min(window.devicePixelRatio || 1, 1.5);

  const fit = (width: number, height: number) => {
    const k = dpr();
    const w = Math.max(1, Math.round(width * k));
    const h = Math.max(1, Math.round(height * k));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    return k;
  };

  return {
    draw(frame) {
      const k = fit(frame.width, frame.height);
      gl.uniform2f(loc.res, frame.width, frame.height);
      gl.uniform1f(loc.dpr, canvas.width / frame.width || k);
      gl.uniform2f(loc.origin, frame.origin.x, frame.origin.y);
      gl.uniform1f(loc.radius, frame.radius);
      gl.uniform1f(loc.unit, unitOf(frame.width, frame.height));
      gl.uniform1f(loc.time, frame.time);
      gl.uniform1f(loc.smoke, frame.smoke);
      gl.uniform1f(loc.smokeTone, frame.smokeTone);
      gl.uniform1f(loc.scorch, frame.scorch);
      gl.uniform1f(loc.ember, frame.ember ?? 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    clear() {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    },
    // The context stays with the canvas (a remount asks it for the same one again): only what
    // was made for it goes.
    dispose() {
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    },
  };
}
