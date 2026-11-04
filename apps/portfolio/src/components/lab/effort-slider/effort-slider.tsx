// Copyright (c) 2026 Bruno Delorence. MIT License.

'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react';
import { Brain } from './brain';
import { Galaxy, TRACK_WIDTH } from './galaxy';
import type { Engine } from './payoff';
import { LOOKS, type Theme } from './themes';
import { useAutoplay } from './use-autoplay';
import styles from './effort-slider.module.css';
import looks from './themes.module.css';

/*
 * Effort slider: how hard a model should think, from Faster to Smarter, in a few named steps. The
 * thumb is a small pink brain; the track fills behind it in pink turning violet. The last step is
 * the payoff: the brain grows and turns blue-violet in a flash of light, rays of specks shoot out
 * around it, and the track becomes a mosaic of twinkling squares, a patch of night sky.
 *
 * - The thumb glides to each stop on an exponential ease (each frame closes the same share of the
 *   gap, a time constant of 56 ms), written as one custom property, --pos, from 0 to 1. The thumb,
 *   the fill's edge and the fill's fade all read it, so a frame is one style write.
 * - The fill is one gradient across the whole track (pink at the left, violet at the right),
 *   clipped at the thumb, with a mask that fades it in from the left over the filled length. So
 *   the further it goes, the more violet its bright end.
 * - The level's name changes letter by letter: the old one rises and blurs away while the new one
 *   comes up into focus, each letter a beat after the one before.
 * - The last step draws on two canvases (galaxy.ts): the mosaic in the track, and the rays, sparks
 *   and flying ring around the thumb. The flash and the glow are CSS gradients.
 * - It is a real slider: the thumb has role="slider" and takes arrows, Page Up/Down, Home and End;
 *   the track takes a click or a drag, which the thumb follows and then snaps to the nearest stop.
 * - While on screen and untouched, a demo climbs the steps one by one, rests on the last, and
 *   starts again from the bottom. The reader's first input (a press, a key, focus) ends it for
 *   good, and the slider goes back to its own step: the value, defaultValue or the reader's pick.
 * - The help button's bubble follows the tooltip pattern: it opens on hover or focus, and on a tap
 *   with a finger or pen; the pointer can rest on it; Escape, leaving or blurring closes it.
 * - Light or dark: every colour is a light-dark() token in the CSS, so the scheme is the page's
 *   color-scheme, or the one the colorScheme prop sets. The night sky is the same on both.
 * - Themes (themes.ts): the brain is the default; the galaxy, formula, missile and jet themes swap
 *   the thumb's drawing (one that changes step by step), the fill (themes.module.css) and the last
 *   step's payoff (a painter for the same two canvases), and name the steps to suit. Their looping
 *   animations run faster with each step: the slider sets their playback rate.
 */

const LEVELS = ['Low', 'Medium', 'High', 'Extra', 'Max', 'Galaxy'];

/** The thumb's ease: each frame closes the gap by 1 - e^(-dt / TAU). */
const TAU = 56;
/** The thumb is 16 px wide and stays inside the 196 px track: its middle runs 8 px to 188 px. */
const RAIL = TRACK_WIDTH - 16;

/** The demo: how long it rests at the bottom, between steps, and on the last. */
const DEMO_FIRST = 700;
const DEMO_STEP = 525;
const DEMO_REST = 3400;
const DEMO_AGAIN = 1100;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Whether the card is drawn dark, for the themes whose canvases or words differ by scheme. The
 * themes' stylesheet sets the card's caret colour to light-dark(black, white): read it back when
 * the system's scheme, the page's theme or scheme attributes, or the colorScheme prop change.
 */
function useDark(card: RefObject<HTMLElement | null>, active: boolean, colorScheme?: string) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const element = card.current;
    if (!active || !element) return;
    const read = () => setDark(getComputedStyle(element).caretColor === 'rgb(255, 255, 255)');
    read();
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', read);
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      subtree: true,
      attributeFilter: ['data-theme', 'data-color-scheme'],
    });
    return () => {
      media.removeEventListener('change', read);
      observer.disconnect();
    };
  }, [card, active, colorScheme]);
  return active && dark;
}

/** The level's name, changed letter by letter. */
function LevelName({ text, special }: { text: string; special: boolean }) {
  type Entry = { id: number; text: string; special: boolean; out: boolean };
  const [entries, setEntries] = useState<Entry[]>([{ id: 0, text, special, out: false }]);
  const [shown, setShown] = useState(text);
  if (text !== shown) {
    // A new name: the current one leaves, the new one arrives (state adjusted while rendering).
    setShown(text);
    setEntries((now) => {
      const id = now[now.length - 1].id + 1;
      const leaving = now.filter((entry) => !entry.out).map((entry) => ({ ...entry, out: true }));
      return [...leaving, { id, text, special, out: false }];
    });
  }
  return (
    <span className={styles.level} data-part="level" aria-hidden="true">
      {entries.map((entry) => (
        <span
          key={entry.id}
          className={entry.out ? styles.levelOut : styles.levelIn}
          data-special={entry.special || undefined}
          onAnimationEnd={
            entry.out
              ? (event) => {
                  // The last letter has gone: drop the old name.
                  if (event.target === event.currentTarget.lastElementChild)
                    setEntries((now) => now.filter((item) => item.id !== entry.id));
                }
              : undefined
          }
        >
          {[...entry.text].map((letter, index) => (
            <span key={index} className={styles.letter} style={{ '--i': index } as CSSProperties}>
              {letter === ' ' ? ' ' : letter}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

export function EffortSlider({
  theme = 'brain',
  levels: levelsProp,
  value,
  defaultValue = 0,
  onChange,
  recommended = 1,
  label = 'Effort',
  minLabel = 'Faster',
  maxLabel = 'Smarter',
  recommendedLabel = 'Recommended',
  help = 'How long the model thinks before it answers. Higher is slower, and smarter.',
  galaxy = true,
  autoplay = true,
  colorScheme,
  className = '',
}: {
  /** The look: the brain, or a galaxy, a racing car, a missile or a jet. */
  theme?: Theme;
  /** The steps' names, from the fastest to the smartest (each theme has its own). */
  levels?: string[];
  /** The chosen step's index, for a controlled slider; leave it out and use defaultValue. */
  value?: number;
  /** The step chosen at first, for an uncontrolled slider. */
  defaultValue?: number;
  /** Called with the new step's index and name when the reader picks one. */
  onChange?: (index: number, level: string) => void;
  /** The step marked as recommended (a taller tick and a label under it); -1 for none. */
  recommended?: number;
  /** The slider's name, before the step's name. */
  label?: string;
  /** The words at either end. */
  minLabel?: string;
  maxLabel?: string;
  /** The words under the recommended tick. */
  recommendedLabel?: string;
  /** What the help button explains; empty for no button. */
  help?: string;
  /** The last step is the theme's payoff (the brain's night sky). */
  galaxy?: boolean;
  /** While on screen and untouched, a demo climbs the steps and rests on the last. */
  autoplay?: boolean;
  /** Light or dark colours, or the reader's ('system'); without it, the page's color-scheme. */
  colorScheme?: 'light' | 'dark' | 'system';
  className?: string;
}) {
  const look = theme === 'brain' ? null : LOOKS[theme];
  const card = useRef<HTMLDivElement>(null);
  const dark = useDark(card, look !== null, colorScheme);
  const levels =
    levelsProp ??
    (look
      ? [
          ...look.levels.slice(0, -1),
          (dark && look.darkLast) || look.levels[look.levels.length - 1],
        ]
      : LEVELS);
  const count = Math.max(levels.length, 2);
  const last = count - 1;
  const [inner, setInner] = useState(() => clamp(Math.round(defaultValue), 0, last));
  const index = clamp(Math.round(value ?? inner), 0, last);
  const { ref: root, playing, take } = useAutoplay<HTMLDivElement>();
  const [demoIndex, setDemoIndex] = useState<number | null>(null);
  const shown = demoIndex ?? index;
  const sky = galaxy && shown === last;

  // Each arrival on the last step plays the burst once (state adjusted while rendering).
  const [arrivals, setArrivals] = useState(0);
  const [wasSky, setWasSky] = useState(sky);
  if (sky !== wasSky) {
    setWasSky(sky);
    if (sky) setArrivals((now) => now + 1);
  }

  const id = useId();
  const track = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLSpanElement>(null);
  const mosaic = useRef<HTMLCanvasElement>(null);
  const burst = useRef<HTMLCanvasElement>(null);
  const sky2d = useRef<Engine>(null);

  /** The thumb's place, 0 to 1, where it is and where it is going. */
  const [startPos] = useState(() => shown / last);
  const pos = useRef(startPos);
  const target = useRef(startPos);
  const frame = useRef(0);
  const dragging = useRef(false);
  /** The step a drag or a key last picked, before React has rendered it. */
  const picked = useRef(index);
  const latest = useRef({ index, controlled: value !== undefined });

  // Synced when the step really changes, so a render still on its way never undoes a pick.
  const controlled = value !== undefined;
  useEffect(() => {
    latest.current = { index, controlled };
  }, [index, controlled]);

  const glide = () => {
    if (frame.current) return;
    const element = card.current;
    if (!element) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let before = performance.now();
    const step = (now: number) => {
      const gap = target.current - pos.current;
      // A frame's time can be a little before the glide began: never step backwards.
      const share = reduced ? 1 : 1 - Math.exp(-Math.min(64, Math.max(0, now - before)) / TAU);
      before = now;
      pos.current = Math.abs(gap) < 0.0004 ? target.current : pos.current + gap * share;
      element.style.setProperty('--pos', pos.current.toFixed(4));
      frame.current = pos.current === target.current ? 0 : requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
  };
  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    },
    [],
  );

  // A new step, from a key, a prop or the demo: the thumb glides there (a drag leads it itself).
  useEffect(() => {
    if (dragging.current) return;
    target.current = shown / last;
    glide();
  }, [shown, last]);

  const pick = (next: number) => {
    next = clamp(next, 0, last);
    picked.current = next;
    if (next === latest.current.index) return;
    if (!latest.current.controlled) {
      latest.current.index = next;
      setInner(next);
    }
    onChange?.(next, levels[next]);
  };

  /** The pointer's place along the rail, 0 to 1. */
  const along = (clientX: number) => {
    const element = track.current!;
    const rect = element.getBoundingClientRect();
    const unit = element.offsetWidth / TRACK_WIDTH || 1;
    const scale = rect.width / element.offsetWidth || 1;
    return clamp(((clientX - rect.left) / scale / unit - 8) / RAIL, 0, 1);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    thumb.current?.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    dragging.current = true;
    const at = along(event.clientX);
    target.current = at;
    glide();
    pick(Math.round(at * last));
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const at = along(event.clientX);
    target.current = at;
    glide();
    pick(Math.round(at * last));
  };
  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    // Snap to the step picked, or back to the one a controlling parent kept.
    const { index: now, controlled } = latest.current;
    target.current = (controlled ? now : picked.current) / last;
    glide();
  };

  const onKeyDown = (event: ReactKeyboardEvent) => {
    const from = latest.current.index;
    const moves: Record<string, number> = {
      ArrowRight: from + 1,
      ArrowUp: from + 1,
      PageUp: from + 1,
      ArrowLeft: from - 1,
      ArrowDown: from - 1,
      PageDown: from - 1,
      Home: 0,
      End: last,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    pick(moves[event.key]);
  };

  // The payoff's canvases, made once per theme; told when the last step is reached or left.
  useEffect(() => {
    if (!mosaic.current || !burst.current || !track.current) return;
    const Painter = theme === 'brain' ? Galaxy : LOOKS[theme].Payoff;
    const instance = new Painter(mosaic.current, burst.current, track.current);
    sky2d.current = instance;
    return () => {
      instance.destroy();
      sky2d.current = null;
    };
  }, [theme]);
  useEffect(() => {
    sky2d.current?.scheme?.(dark);
  }, [dark, theme]);
  useEffect(() => {
    sky2d.current?.set(sky, arrivals > 0);
  }, [sky, arrivals, theme]);

  // A theme's loops (named pace…) speed up step by step: from 1 at the bottom to 4 at the top.
  useEffect(() => {
    if (!look || !card.current) return;
    const rate = 1 + (3 * shown) / last;
    for (const animation of card.current.getAnimations({ subtree: true }))
      if (animation instanceof CSSAnimation && animation.animationName.includes('pace'))
        animation.updatePlaybackRate(rate);
  }, [look, shown, last, sky]);

  // The demo: one step up every beat from wherever the thumb is, a rest on the last, and again
  // from the bottom. When it stops, the thumb goes back to the slider's own step.
  const demo = autoplay && playing && count > 1;
  useEffect(() => {
    if (!demo) return;
    let at = latest.current.index;
    let timer = 0;
    const show = (next: number) => {
      at = next;
      setDemoIndex(next);
    };
    const next = () => {
      if (at >= last) {
        timer = window.setTimeout(() => {
          show(0);
          timer = window.setTimeout(next, DEMO_AGAIN);
        }, DEMO_REST);
        return;
      }
      timer = window.setTimeout(() => {
        show(at + 1);
        next();
      }, DEMO_STEP);
    };
    show(at);
    timer = window.setTimeout(next, at >= last ? 0 : DEMO_FIRST - DEMO_STEP);
    return () => {
      window.clearTimeout(timer);
      setDemoIndex(null);
    };
  }, [demo, last]);

  // The help bubble: open on hover or focus, toggled by a finger or pen tap, closed by Escape.
  const [tip, setTip] = useState(false);
  const tapped = useRef(false);
  const helpButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!tip) return;
    // A tap elsewhere closes it (a tap doesn't always move focus, so blur alone can't).
    const away = (event: PointerEvent) => {
      if (!helpButton.current?.contains(event.target as Node)) setTip(false);
    };
    // Escape closes it wherever focus is, even while the pointer rests on it.
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setTip(false);
    };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', escape);
    };
  }, [tip]);

  const tick = recommended >= 0 && recommended <= last ? recommended : -1;
  const stop = (step: number) => ({ '--stop': step / last }) as CSSProperties;
  const name = levels[shown] ?? '';

  return (
    <div
      ref={root}
      className={`${styles.root} ${className}`}
      data-color-scheme={colorScheme}
      onPointerDownCapture={take}
      onKeyDownCapture={take}
      onFocusCapture={take}
    >
      <div
        ref={card}
        className={look ? `${styles.card} ${looks.themed}` : styles.card}
        data-part="card"
        data-sky={sky || undefined}
        data-theme={look ? theme : undefined}
        data-dark={dark || undefined}
        style={{ '--pos': startPos } as CSSProperties}
      >
        <div className={styles.header}>
          <span id={`${id}-label`} className={styles.name} data-part="label">
            {label}
          </span>
          <LevelName text={name} special={sky} />
          {help && (
            <button
              ref={helpButton}
              type="button"
              className={styles.help}
              data-part="help"
              data-open={tip || undefined}
              aria-label={`About ${label.toLowerCase()}`}
              aria-describedby={`${id}-help`}
              onPointerEnter={(event) => {
                if (event.pointerType === 'mouse') setTip(true);
              }}
              onPointerLeave={(event) => {
                if (event.pointerType === 'mouse') setTip(false);
              }}
              onPointerDown={(event) => {
                tapped.current = event.pointerType !== 'mouse';
              }}
              onFocus={() => {
                if (!tapped.current) setTip(true);
              }}
              onBlur={() => {
                tapped.current = false;
                setTip(false);
              }}
              onClick={() => {
                if (tapped.current) setTip((open) => !open);
                else setTip(true);
                tapped.current = false;
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.2 9.3a2.9 2.9 0 0 1 5.6 0.9c0 1.9-2.8 2.5-2.8 4.1" />
                <path d="M12 17.6h0.01" />
              </svg>
              <span id={`${id}-help`} role="tooltip" className={styles.tip}>
                {help}
              </span>
            </button>
          )}
        </div>

        <div className={styles.ends} data-part="ends" aria-hidden="true">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>

        <div
          ref={track}
          className={styles.control}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className={styles.track} data-part="track" aria-hidden="true">
            {look ? (
              <div className={`${styles.fill} ${looks.warp}`}>
                <span className={looks.texture} />
                <span className={looks.lines} />
              </div>
            ) : (
              <div className={styles.fill} data-part="fill" />
            )}
            <div className={look ? `${styles.sky} ${looks.sky} ${looks.warp}` : styles.sky}>
              <canvas ref={mosaic} className={styles.mosaic} />
            </div>
            {levels.map((_, step) =>
              step === tick ? (
                <span key={step} className={styles.tick} data-part="tick" style={stop(step)} />
              ) : (
                <span key={step} className={styles.dot} data-part="stop" style={stop(step)} />
              ),
            )}
          </div>
          <div className={styles.rail}>
            <span
              ref={thumb}
              className={styles.thumb}
              data-part="thumb"
              role="slider"
              tabIndex={0}
              aria-labelledby={`${id}-label`}
              aria-valuemin={0}
              aria-valuemax={last}
              aria-valuenow={shown}
              aria-valuetext={`${name}${shown === tick ? `, ${recommendedLabel.toLowerCase()}` : ''}`}
              aria-orientation="horizontal"
              onKeyDown={onKeyDown}
            >
              <span
                className={look ? `${styles.halo} ${looks.glow}` : styles.halo}
                aria-hidden="true"
              />
              {look ? (
                <look.Icon id={`${id}-${theme}`} />
              ) : (
                <Brain
                  className={styles.brain}
                  pinkClass={styles.pink}
                  galaxyClass={styles.galaxy}
                  gradient={`${id}-sky`}
                />
              )}
              {sky && arrivals > 0 && (
                <span
                  key={arrivals}
                  className={look ? `${styles.flash} ${looks.flash}` : styles.flash}
                  aria-hidden="true"
                />
              )}
              <canvas
                ref={burst}
                className={look ? `${styles.burst} ${looks.box}` : styles.burst}
                style={
                  look
                    ? ({ '--rx': look.reach[0], '--ry': look.reach[1] } as CSSProperties)
                    : undefined
                }
                aria-hidden="true"
              />
            </span>
          </div>
        </div>

        <div className={styles.under} aria-hidden="true">
          {tick >= 0 && (
            <span
              className={styles.recommended}
              data-part="recommended"
              data-edge={tick === 0 ? 'start' : tick === last ? 'end' : undefined}
              style={stop(tick)}
            >
              {recommendedLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
