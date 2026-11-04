// Copyright (c) 2026 Bruno Delorence. MIT License.

'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { Brain, type State } from './brain';
import { Renderer, type Glasses, type Hat, type Look, type Shading } from './render';
import type { ShapeName } from './shapes';
import styles from './bot-avatars.module.css';

/*
 * One avatar: a canvas half as large again as the avatar's box (more of it above, so a hop or a hat
 * has room), with the body drawn in the box by the renderer (render.ts) in the pose its brain (brain.ts) gives
 * it each frame.
 *
 * All avatars on a page share one animation frame loop, and each only draws while it is on
 * screen, the tab is visible and it isn't paused. Under reduced motion it draws its resting pose
 * once (and again when a prop changes). The pointer is read once per move for all of them; each
 * looks at it while it moves, then goes back to looking around on its own.
 */

export type BotAvatarProps = {
  /** The body. */
  type?: ShapeName;
  /** The box it takes in the layout, in px; the drawing overflows it, most of all above. */
  size?: number;
  /** Idle looks around and does tricks; working hops on a beat; sleeping dozes, eyes shut. */
  state?: State;
  /** The finish: furry fabric, glossy plastic, short crisp pile, smooth velvet or flat colour. */
  shading?: Shading;
  hat?: Hat;
  glasses?: Glasses;
  /** The body's colour (any hex); each type has its own without it. */
  color?: string;
  /** The eyes' colour. */
  ink?: string;
  /** Strand length, 0–2 (1 is the default length). */
  furLength?: number;
  /** Brightness and saturation of the colour, in % (120 and 159 are neutral). */
  brightness?: number;
  saturation?: number;
  /** Depth of the shading, in % (115 is the default). */
  shadow?: number;
  /** Light round the rim from behind, 0–100 %. */
  backLight?: number;
  /** A soft highlight from the key light, 0–100 %. */
  sheen?: number;
  /** Thickness of the body, 0–100 % (65 is the default). */
  depth?: number;
  /** How far the fur fluffs out along the outline, 0–100 %. */
  edgeFuzz?: number;
  /** Speed of every motion, as a multiple (1 is the default). */
  speed?: number;
  /** Holds the avatar still, facing front. */
  paused?: boolean;
  /**
   * Looks at the pointer, and leaps when poked (clicked or tapped). With a `label`, and not
   * `paused`, the avatar is a button: it takes focus and Enter or Space pokes it too.
   */
  interactive?: boolean;
  /** Varies its habits, so avatars side by side don't move in step. */
  seed?: number;
  /** A name for screen readers; without it the avatar is decorative (and takes no focus). */
  label?: string;
  className?: string;
  style?: CSSProperties;
};

type Instance = {
  canvas: HTMLCanvasElement;
  renderer: Renderer;
  brain: Brain;
  props: Required<Omit<BotAvatarProps, 'label' | 'className' | 'style' | 'color'>> & {
    color?: string;
  };
  visible: boolean;
  dirty: boolean;
  last: number;
};

const instances = new Set<Instance>();
let frame = 0;
let reduced = false;
const pointer = { x: 0, y: 0, at: -1e9 };
let listening = false;

function listen() {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType === 'touch') return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.at = performance.now();
    },
    { passive: true },
  );
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  reduced = motion.matches;
  motion.addEventListener('change', () => {
    reduced = motion.matches;
    for (const i of instances) i.dirty = true;
    schedule();
  });
  document.addEventListener('visibilitychange', () => {
    for (const i of instances) i.last = 0;
    schedule();
  });
}

function schedule() {
  if (!frame && typeof window !== 'undefined') frame = requestAnimationFrame(tick);
}

function tick(now: number) {
  frame = 0;
  if (document.hidden) return;
  let again = false;
  const pointerLive = now - pointer.at < 2500;
  // With many on screen, each draws every other frame (30 a second), which halves the work.
  let shown = 0;
  for (const inst of instances) if (inst.visible) shown++;
  const every = shown > 3 ? 1000 / 30 - 4 : 0;
  for (const inst of instances) {
    if (!inst.visible) continue;
    const p = inst.props;
    const still = p.paused || reduced;
    if (still && !inst.dirty) continue;
    if (!still && !inst.dirty && inst.last && now - inst.last < every) {
      again = true;
      continue;
    }
    const dt = inst.last ? (now - inst.last) / 1000 : 1 / 60;
    inst.last = now;
    let look: { x: number; y: number } | null = null;
    if (pointerLive && p.interactive && !still) {
      const r = inst.canvas.getBoundingClientRect();
      const dx = pointer.x - (r.left + r.width / 2);
      const dy = pointer.y - (r.top + r.height / 2);
      const reach = 260;
      look = {
        x: Math.max(-1, Math.min(1, dx / reach)),
        y: Math.max(-1, Math.min(1, -dy / reach)),
      };
    }
    const pose = inst.brain.step(dt * p.speed, p.state, look, still);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    inst.renderer.draw(toLook(p), pose, p.size * dpr);
    inst.dirty = false;
    if (!still) again = true;
  }
  if (again) schedule();
}

function toLook(p: Instance['props']): Look {
  return {
    type: p.type,
    shading: p.shading,
    hat: p.hat,
    glasses: p.glasses,
    color: p.color,
    ink: p.ink,
    furLength: p.furLength,
    brightness: p.brightness / 120,
    saturation: p.saturation / 159,
    shadow: p.shadow / 115,
    backLight: p.backLight / 100,
    sheen: p.sheen / 100,
    depth: 0.4 + (p.depth / 100) * 0.92,
    edgeFuzz: p.edgeFuzz / 100,
  };
}

let observer: IntersectionObserver | null = null;
const byCanvas = new WeakMap<Element, Instance>();
function observe(inst: Instance) {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const i = byCanvas.get(e.target);
          if (!i) continue;
          i.visible = e.isIntersecting;
          i.dirty = true;
          i.last = 0;
        }
        schedule();
      },
      { rootMargin: '40px' },
    );
  }
  byCanvas.set(inst.canvas, inst);
  observer.observe(inst.canvas);
}

let seeds = 1;

export function BotAvatar({
  type = 'clover',
  size = 64,
  state = 'idle',
  shading = 'fabric',
  hat = 'none',
  glasses = 'none',
  color,
  ink = '#1f1b2e',
  furLength = 1,
  brightness = 120,
  saturation = 159,
  shadow = 115,
  backLight = 60,
  sheen = 0,
  depth = 65,
  edgeFuzz = 90,
  speed = 1,
  paused = false,
  interactive = true,
  seed,
  label,
  className = '',
  style,
}: BotAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inst = useRef<Instance | null>(null);
  const props = {
    type,
    size,
    state,
    shading,
    hat,
    glasses,
    color,
    ink,
    furLength,
    brightness,
    saturation,
    shadow,
    backLight,
    sheen,
    depth,
    edgeFuzz,
    speed,
    paused,
    interactive,
    seed: seed ?? 0,
  };
  const key = JSON.stringify(props);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    listen();
    const i: Instance = {
      canvas,
      renderer: new Renderer(ctx),
      brain: new Brain(seed ?? seeds++),
      props: JSON.parse(key),
      visible: false,
      dirty: true,
      last: 0,
    };
    inst.current = i;
    instances.add(i);
    observe(i);
    return () => {
      instances.delete(i);
      observer?.unobserve(canvas);
      inst.current = null;
    };
    // The brain lives as long as the canvas; props flow in below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const i = inst.current;
    const canvas = canvasRef.current;
    if (!i || !canvas) return;
    i.props = JSON.parse(key);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const px = Math.round(i.props.size * 1.5 * dpr);
    if (canvas.width !== px) {
      canvas.width = px;
      canvas.height = px;
    }
    i.dirty = true;
    i.last = 0;
    schedule();
  }, [key]);

  const poke = () => {
    if (!interactive || paused || reduced) return;
    inst.current?.brain.poke();
    schedule();
  };
  // A named, live, interactive avatar acts as a button (the WAI-ARIA button pattern on the same
  // span, so the canvas is never remounted): it takes focus, and Enter or Space pokes it like a
  // click. Without a name it is decoration, hidden from assistive tech, and the poke stays a
  // pointer-only flourish.
  const pokable = Boolean(label) && interactive && !paused;

  return (
    <span
      className={`${styles.avatar} ${className}`}
      style={{ ...style, ['--size' as string]: `${size}px` }}
      role={pokable ? 'button' : label ? 'img' : undefined}
      tabIndex={pokable ? 0 : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-part="avatar"
      onPointerDown={poke}
      onKeyDown={
        pokable
          ? (e) => {
              if (e.key !== 'Enter' && e.key !== ' ') return;
              e.preventDefault();
              if (!e.repeat) poke();
            }
          : undefined
      }
    >
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
    </span>
  );
}
