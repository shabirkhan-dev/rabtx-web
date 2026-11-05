// Copyright (c) 2026 Bruno Delorence. MIT License.

/*
 * The bits of page that fly off the burn front: charred flakes and glowing embers, drawn on a 2D
 * canvas over everything. They are thrown from the front, mostly from its upper half (the heat
 * rises), outwards and up, flutter as they climb, spin, and fade over one to three seconds.
 * A fifth glow gold; the rest are dark scraps, a third of them with a lit edge.
 */

type Flake = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  spin: number;
  angle: number;
  size: number;
  life: number;
  age: number;
  kind: 'char' | 'edge' | 'glow';
  /** A rough six-sided scrap: each corner's distance, as a share of size. */
  shape: number[];
  phase: number;
};

/** No more flakes than this at once: enough to read as a shower, cheap to draw. */
const MAX = 520;

export type Flakes = {
  /** Throws `count` flakes from points on a front of radius `radius` around `origin`. */
  emit: (count: number, origin: { x: number; y: number }, radius: number, unit: number) => void;
  /** Moves and draws them; returns how many are still alive. */
  step: (dt: number, width: number, height: number) => number;
  clear: () => void;
};

export function createFlakes(canvas: HTMLCanvasElement): Flakes | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  let flakes: Flake[] = [];

  const fit = (width: number, height: number) => {
    const k = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(width * k);
    const h = Math.round(height * k);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.setTransform(k, 0, 0, k, 0, 0);
  };

  return {
    emit(count, origin, radius, unit) {
      for (let i = 0; i < count && flakes.length < MAX; i += 1) {
        // Mostly the upper half: an angle around straight up, spread wide.
        const up = Math.random() < 0.72;
        const angle = up
          ? -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3
          : Math.random() * Math.PI * 2;
        const along = radius * (0.9 + Math.random() * 0.25);
        const dx = Math.cos(angle);
        const dy = Math.sin(angle) / 1.14;
        const speed = unit * (3 + Math.random() * 9);
        const roll = Math.random();
        flakes.push({
          x: origin.x + dx * along,
          y: origin.y + dy * along,
          vx: dx * speed,
          vy: dy * speed - unit * (4 + Math.random() * 8),
          spin: (Math.random() - 0.5) * 8,
          angle: Math.random() * Math.PI * 2,
          size: unit * (0.15 + Math.random() * Math.random() * 0.75),
          life: 1 + Math.random() * 2,
          age: 0,
          kind: roll < 0.2 ? 'glow' : roll < 0.45 ? 'edge' : 'char',
          shape: Array.from({ length: 6 }, () => 0.45 + Math.random() * 0.55),
          phase: Math.random() * Math.PI * 2,
        });
      }
    },
    step(dt, width, height) {
      fit(width, height);
      ctx.clearRect(0, 0, width, height);
      flakes = flakes.filter((flake) => flake.age < flake.life);
      for (const flake of flakes) {
        flake.age += dt;
        // Rising air: a little lift, drag, and a sideways flutter.
        flake.vy -= flake.size * 2.4 * dt;
        flake.vx *= 1 - 0.9 * dt;
        flake.vy *= 1 - 0.6 * dt;
        flake.x += (flake.vx + Math.sin(flake.age * 5 + flake.phase) * flake.size * 6) * dt;
        flake.y += flake.vy * dt;
        flake.angle += flake.spin * dt;
        const fade = 1 - flake.age / flake.life;
        if (flake.x < -20 || flake.x > width + 20 || flake.y < -20 || flake.y > height + 20) {
          flake.age = flake.life;
          continue;
        }
        ctx.save();
        ctx.translate(flake.x, flake.y);
        ctx.rotate(flake.angle);
        ctx.globalAlpha = Math.min(1, fade * 1.6);
        const s = flake.size;
        ctx.beginPath();
        flake.shape.forEach((reach, corner) => {
          const turn = (corner / flake.shape.length) * Math.PI * 2;
          ctx.lineTo(Math.cos(turn) * s * reach, Math.sin(turn) * s * reach);
        });
        ctx.closePath();
        if (flake.kind === 'glow') {
          ctx.fillStyle = fade > 0.5 ? '#ffe2a0' : '#f2a13c';
          ctx.fill();
        } else {
          ctx.fillStyle = '#1e1612';
          ctx.fill();
          if (flake.kind === 'edge') {
            ctx.lineWidth = Math.max(0.6, s * 0.28);
            ctx.strokeStyle = '#e0a24a';
            ctx.stroke();
          }
        }
        ctx.restore();
      }
      return flakes.length;
    },
    clear() {
      flakes = [];
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
}
