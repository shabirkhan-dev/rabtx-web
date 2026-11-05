// Copyright (c) 2026 Bruno Delorence. MIT License.
// Changed for rabtx: `title`, `lead` and `flame` props, so the page can ask about any account
// and burn pink (the original) or orange.

'use client';

import {
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { createBurn, fullRadius, unitOf, type BurnRenderer } from './burn-gl';
import { createFlakes, type Flakes } from './flakes';
import { DemoPointer, runDemo, type Point } from './demo-pointer';
import { useAutoplay } from './use-autoplay';
import styles from './burn-delete.module.css';

/*
 * Burn delete: a page asks “Delete your account?” over a dark pill, Hold to delete. Held down,
 * the pill fills from the left with heat; let go early and the heat drains back. Held to the
 * end, the page catches fire from the pill: a hole with a white-hot rim, flames and flying
 * flakes spreads out and eats the page, and leaves a black screen with drifting embers: Sign in,
 * your account is gone, and Restore my account, which burns the other way, back to the page.
 *
 * - The hold is 1.8 s, linear; released, the heat drains three times faster. Holding Space or
 *   Enter works the same. A press that comes with no hold at all (a screen reader's activation)
 *   arms the pill instead: a second press within 5 s deletes, so no one has to hold.
 * - The burn is a fragment shader (burn-gl.ts) over the page: a radius roughened by noise,
 *   grown from 0 to past the stage's corners in 5.2 s, slow at first and faster as it goes
 *   (t^1.6); a restore shrinks it back onto the pill in 2.4 s. The dark screen's words are masked
 *   to the hole's middle as it grows. Flakes and embers fly off the front on a 2D canvas.
 * - One requestAnimationFrame loop runs it all, only while something moves and the stage is on
 *   screen; it sleeps otherwise.
 * - Under reduced motion, or without WebGL, the two screens cross-fade in 0.4 s instead.
 * - While on screen and untouched, a demo pointer holds the pill, waits out the burn, and
 *   restores the account, in a loop. The reader's first input stops it for good.
 */

export type BurnPhase = 'idle' | 'burning' | 'gone' | 'restoring';

/** How long the pill is held, how much faster the heat drains, and how long each burn takes. */
const HOLD = 1800;
const DRAIN = 3;
const BURN = 5200;
const RESTORE = 2400;
/** How long the smoke lingers over the page after a restore. */
const SMOKE = 4200;
/** How long a press with no hold keeps the pill armed for a second one. */
const ARMED = 5000;

const burnEase = (t: number) => Math.pow(t, 1.6);
const restoreEase = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** An rgb() colour's grey, 0 to 1. */
const greyOf = (colour: string) => {
  const parts = colour
    .match(/[\d.]+/g)
    ?.slice(0, 3)
    .map(Number) ?? [140, 140, 140];
  return (parts[0] * 0.3 + parts[1] * 0.59 + parts[2] * 0.11) / 255;
};

export function BurnDelete({
  defaultPhase = 'idle',
  still,
  onDelete,
  onRestore,
  name = 'Ines Navarro',
  title = 'Delete your account?',
  lead = 'Your 412 links and 38 collections go with it.',
  flame = 'pink',
  autoplay = true,
  colorScheme,
  className = '',
}: {
  /** Where it starts: on the page ('idle') or on the screen the burn leaves ('gone'). */
  defaultPhase?: 'idle' | 'gone';
  /**
   * A still for docs and screenshots: the pill held to a share of the way (`hold`, 0 to 1), the
   * burn stopped part way (`burn`, 0 to 1), or the pill armed by a single press (`armed`). It
   * turns the autoplay demo off; the reader's first press lets it go.
   */
  still?: { hold: number } | { burn: number } | { armed: true };
  /** Called once the hold completes and the burn starts. */
  onDelete?: () => void;
  /** Called when Restore my account is pressed. */
  onRestore?: () => void;
  /** The byline over the question. */
  name?: string;
  /** The question, and what goes with the account, in numbers. */
  title?: string;
  lead?: string;
  /** The fire's colours: the original pink and indigo, or a classic orange. */
  flame?: 'pink' | 'ember';
  /** While on screen and untouched, a demo pointer deletes and restores, in a loop. */
  autoplay?: boolean;
  /** Light or dark colours, or the reader's ('system'); without it, the page's color-scheme. */
  colorScheme?: 'light' | 'dark' | 'system';
  className?: string;
}) {
  const { ref: root, playing, take } = useAutoplay<HTMLDivElement>();
  const startPhase: BurnPhase = still && 'burn' in still ? 'burning' : defaultPhase;
  const [phase, setPhase] = useState<BurnPhase>(startPhase);
  const [holding, setHolding] = useState(false);
  const [armed, setArmed] = useState(() => Boolean(still && 'armed' in still));
  const [plain, setPlain] = useState(false);
  const [message, setMessage] = useState('');
  const hintId = useId();
  const emailId = useId();

  const pill = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const gone = useRef<HTMLDivElement>(null);
  const burnCanvas = useRef<HTMLCanvasElement>(null);
  const flakeCanvas = useRef<HTMLCanvasElement>(null);
  const probe = useRef<HTMLSpanElement>(null);
  const pointer = useRef<HTMLSpanElement>(null);

  /** The loop's state, kept out of React: it changes every frame. */
  const run = useRef({
    phase: startPhase as BurnPhase,
    /** The still the stage is held in, until the reader's first press. */
    still: still && !('armed' in still) ? still : null,
    holding: false,
    /** The heat in the pill, 0 to 1. */
    fill: 0,
    /** Set by a key hold, so the click that follows its release isn't taken as an activation. */
    keyHeld: false,
    /** When a pointer last went down on the pill: its click is the end of a hold, not a press. */
    downAt: -Infinity,
    /** When the current burn or restore started, and the radius it started from. */
    start: 0,
    from: 0,
    radius: defaultPhase === 'gone' ? Infinity : 0,
    smoke: 0,
    smokeTone: 0.55,
    ember: flame === 'ember' ? 1 : 0,
    origin: { x: 0, y: 0 },
    plain: false,
    visible: false,
    frame: 0,
    last: 0,
    flakesAlive: 0,
    /** Starts the loop if it sleeps. */
    wake: () => {},
  });
  const armTimer = useRef(0);
  /** Set while the demo pointer holds the pill, so its delete isn't announced as the reader's. */
  const demoHolding = useRef(false);

  useEffect(() => {
    run.current.ember = flame === 'ember' ? 1 : 0;
  }, [flame]);

  /** Repeats are made to differ, so screen readers announce them again. */
  const announce = (text: string) => setMessage((now) => (now === text ? `${text} ` : text));

  /** The pill's middle, in the stage's px: where the burn starts and where it ends. */
  const readOrigin = () => {
    const stage = root.current;
    const button = pill.current;
    if (!stage || !button) return;
    const frame = stage.getBoundingClientRect();
    const rect = button.getBoundingClientRect();
    const scale = frame.width / stage.offsetWidth || 1;
    run.current.origin = {
      x: (rect.left + rect.width / 2 - frame.left) / scale,
      y: (rect.top + rect.height / 2 - frame.top) / scale,
    };
  };

  const setLoopPhase = (next: BurnPhase) => {
    run.current.phase = next;
    setPhase(next);
  };

  const ignite = (by: 'reader' | 'demo') => {
    const state = run.current;
    if (state.phase !== 'idle') return;
    state.holding = false;
    // The key that held it is let go on the next screen: no click of its own will follow.
    state.keyHeld = false;
    state.fill = 1;
    setHolding(false);
    setArmed(false);
    window.clearTimeout(armTimer.current);
    readOrigin();
    if (probe.current) state.smokeTone = greyOf(getComputedStyle(probe.current).color);
    state.start = performance.now();
    state.from = 0;
    state.smoke = 0;
    onDelete?.();
    if (state.plain) {
      state.radius = Infinity;
      state.fill = 0;
      setLoopPhase('gone');
    } else {
      setLoopPhase('burning');
    }
    if (by === 'reader') {
      announce('Account deleted. Restore my account brings it back.');
      // The page goes inert; the focus waits on the new screen's heading.
      requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));
    }
    state.wake();
  };

  const restore = (by: 'reader' | 'demo') => {
    const state = run.current;
    state.still = null;
    if (state.phase !== 'gone' && state.phase !== 'burning') return;
    onRestore?.();
    const stage = root.current;
    readOrigin();
    const full = stage ? fullRadius(stage.offsetWidth, stage.offsetHeight, state.origin) : 0;
    state.from = Math.min(state.radius, full);
    state.start = performance.now();
    if (state.plain) {
      state.radius = 0;
      setLoopPhase('idle');
    } else {
      setLoopPhase('restoring');
    }
    if (by === 'reader') {
      announce('Account restored.');
      requestAnimationFrame(() => pill.current?.focus({ preventScroll: true }));
    }
    state.wake();
  };

  const startHold = () => {
    const state = run.current;
    state.still = null;
    if (state.phase !== 'idle') return;
    state.holding = true;
    setHolding(true);
    state.wake();
  };
  const endHold = (by: 'reader' | 'demo') => {
    const state = run.current;
    if (!state.holding) return;
    state.holding = false;
    setHolding(false);
    if (by === 'reader' && state.phase === 'idle' && state.fill > 0.08) {
      announce('Delete cancelled. Hold to the end to delete.');
    }
    state.wake();
  };

  /** The hold reached the end: called from the loop, with this render's props. */
  const onFull = useEffectEvent(() => ignite(demoHolding.current ? 'demo' : 'reader'));

  // The loop: the heat in the pill, the burn's radius, the flakes and the smoke.
  useEffect(() => {
    const stage = root.current;
    const glCanvas = burnCanvas.current;
    const flakeLayer = flakeCanvas.current;
    const button = pill.current;
    const screen = gone.current;
    if (!stage || !glCanvas || !flakeLayer || !button || !screen) return;
    const state = run.current;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let burn: BurnRenderer | null = null;
    let flakes: Flakes | null = null;
    let drawn = false;
    let stillFlakes = false;

    let tried = false;

    const setup = () => {
      state.plain = motion.matches || (tried && !burn);
      setPlain(state.plain);
      if (state.plain && (state.phase === 'burning' || state.phase === 'restoring')) {
        // Mid-burn, a change to reduced motion lands on the burn's end at once.
        const next = state.phase === 'burning' ? 'gone' : 'idle';
        state.radius = next === 'gone' ? Infinity : 0;
        setLoopPhase(next);
      }
    };
    setup();

    // The shader's context is asked for only once a burn needs it: a docs page holds many of
    // these stages, and a browser keeps only about sixteen contexts alive at once.
    const ensureBurn = () => {
      if (burn || tried || state.plain) return;
      tried = true;
      burn = createBurn(glCanvas);
      flakes = createFlakes(flakeLayer);
      if (!burn) setup();
    };
    const onLost = (event: Event) => {
      event.preventDefault();
      burn = null;
      tried = true;
      setup();
    };
    glCanvas.addEventListener('webglcontextlost', onLost);

    const frame = (now: number) => {
      state.frame = 0;
      if (state.phase !== 'idle' || state.smoke > 0) ensureBurn();
      const dt = Math.min(0.05, (now - (state.last || now)) / 1000);
      state.last = now;
      const width = stage.offsetWidth;
      const height = stage.offsetHeight;
      const unit = unitOf(width, height);

      // The heat in the pill.
      const held = state.still;
      if (held && 'hold' in held) state.fill = held.hold;
      else if (state.phase === 'idle') {
        if (state.holding) state.fill = Math.min(1, state.fill + (dt * 1000) / HOLD);
        else state.fill = Math.max(0, state.fill - (dt * 1000 * DRAIN) / HOLD);
      }
      button.style.setProperty('--fill', state.fill.toFixed(4));
      if (state.phase === 'idle' && state.holding && state.fill >= 1) {
        onFull();
      }

      // The burn's radius.
      const full = fullRadius(width, height, state.origin);
      if (held && 'burn' in held) {
        state.radius = full * burnEase(held.burn);
        state.fill = 1;
      } else if (state.phase === 'burning') {
        const t = Math.min(1, (now - state.start) / BURN);
        state.radius = full * burnEase(t);
        if (t >= 1) {
          state.radius = Infinity;
          state.fill = 0;
          setLoopPhase('gone');
        }
      } else if (state.phase === 'restoring') {
        const span = RESTORE * Math.max(0.35, state.from / full);
        const t = Math.min(1, (now - state.start) / span);
        state.radius = state.from * (1 - restoreEase(t));
        state.smoke = Math.max(state.smoke, restoreEase(t));
        if (t >= 1) {
          state.radius = 0;
          // The pill comes back still hot, and cools.
          state.fill = 1;
          setLoopPhase('idle');
        }
      } else if (state.phase === 'idle') {
        state.smoke = Math.max(0, state.smoke - (dt * 1000) / SMOKE);
      }

      // The dark screen's words show through the hole's middle while it moves.
      const moving = state.phase === 'burning' || state.phase === 'restoring';
      if (moving) {
        const rx = Math.max(0, state.radius * 0.72 - unit * 4);
        const mask = `radial-gradient(ellipse ${rx}px ${rx / 1.14}px at ${state.origin.x}px ${state.origin.y}px, #000 75%, transparent 100%)`;
        screen.style.maskImage = mask;
        screen.style.webkitMaskImage = mask;
      } else {
        screen.style.maskImage = '';
        screen.style.webkitMaskImage = '';
      }

      // The shader, while there is anything to draw.
      if (burn && !state.plain) {
        if (state.radius > 0 || state.smoke > 0) {
          burn.draw({
            width,
            height,
            origin: state.origin,
            radius: Math.min(state.radius, full * 1.2),
            // A still is drawn at one fixed moment, so it looks the same every time.
            time: held ? 12.3 : now / 1000,
            smoke: state.smoke,
            smokeTone: state.smokeTone,
            scorch: state.phase === 'restoring' || state.phase === 'idle' ? 1 : 0,
            ember: state.ember,
          });
          drawn = true;
        } else if (drawn) {
          burn.clear();
          drawn = false;
        }
      }

      // The flakes, thrown from the front while it is on the stage.
      if (flakes && !state.plain) {
        if (moving && state.radius * 0.72 < full * 0.72 - unit * 10) {
          const rate = state.phase === 'burning' ? 220 : 160;
          const count = Math.floor(dt * rate + Math.random());
          if (state.radius > unit * 3) flakes.emit(count, state.origin, state.radius, unit);
        }
        if (held && 'burn' in held && !stillFlakes) {
          // A still's flakes: a second and a half of them, thrown and flown at once.
          stillFlakes = true;
          for (let i = 0; i < 90; i += 1) {
            flakes.emit(4, state.origin, state.radius, unit);
            flakes.step(1 / 60, width, height);
          }
        }
        state.flakesAlive = held ? 0 : flakes.step(dt, width, height);
      }

      const busy =
        (!held && state.fill > 0) ||
        state.holding ||
        (moving && !held) ||
        state.phase === 'gone' ||
        state.smoke > 0 ||
        state.flakesAlive > 0;
      if (busy && state.visible && !document.hidden) {
        state.frame = requestAnimationFrame(frame);
      } else {
        state.last = 0;
      }
    };

    state.wake = () => {
      if (state.frame) return;
      state.last = 0;
      state.frame = requestAnimationFrame(frame);
    };

    const observer = new IntersectionObserver(([entry]) => {
      state.visible = entry.isIntersecting;
      if (state.visible) state.wake();
    });
    observer.observe(stage);
    const resize = new ResizeObserver(() => {
      if (state.phase === 'idle' || state.phase === 'gone') readOrigin();
      state.wake();
    });
    resize.observe(stage);
    const onVisibility = () => state.wake();
    document.addEventListener('visibilitychange', onVisibility);
    const onMotion = () => {
      setup();
      state.wake();
    };
    motion.addEventListener('change', onMotion);
    readOrigin();

    return () => {
      observer.disconnect();
      resize.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      motion.removeEventListener('change', onMotion);
      glCanvas.removeEventListener('webglcontextlost', onLost);
      cancelAnimationFrame(state.frame);
      state.frame = 0;
      state.wake = () => {};
      burn?.dispose();
    };
    // The loop reads refs; ignite and setLoopPhase only touch refs and setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root]);

  useEffect(() => () => window.clearTimeout(armTimer.current), []);

  // Without the shader, the two screens cross-fade in 0.4 s instead.
  const shownPhase = useRef(phase);
  useEffect(() => {
    const screen = gone.current;
    const before = shownPhase.current;
    shownPhase.current = phase;
    if (!plain || !screen || before === phase) return;
    const show = phase === 'gone';
    if (show === (before === 'gone' || before === 'burning')) return;
    const fade = screen.animate(
      [
        { opacity: show ? 0 : 1, visibility: 'visible' },
        { opacity: show ? 1 : 0, visibility: 'visible' },
      ],
      { duration: 400, easing: 'ease' },
    );
    return () => fade.cancel();
  }, [phase, plain]);

  // The reader's hold: the pointer down on the pill, or Space or Enter held on it.
  const onPillDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    run.current.keyHeld = false;
    run.current.downAt = performance.now();
    startHold();
  };
  const onPillUp = () => endHold('reader');
  const onPillKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    if (event.repeat) return;
    run.current.keyHeld = true;
    startHold();
  };
  const onPillKeyUp = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    endHold('reader');
    // The click a released key may still send is not an activation of its own.
    window.setTimeout(() => {
      run.current.keyHeld = false;
    }, 0);
  };
  // A click with no hold before it (no pointer down on the pill, no key held): a screen reader or
  // a switch. The first one arms the pill, a second one within 5 s deletes.
  const onPillClick = () => {
    const state = run.current;
    if (state.keyHeld || performance.now() - state.downAt < 4000) {
      state.keyHeld = false;
      return;
    }
    if (armed) {
      ignite('reader');
      return;
    }
    setArmed(true);
    announce('Press again to delete your account.');
    window.clearTimeout(armTimer.current);
    armTimer.current = window.setTimeout(() => setArmed(false), ARMED);
  };

  const onContinue = (event: FormEvent) => {
    event.preventDefault();
    announce('There is no account to sign in to. Restore it first.');
  };

  // The demo: the pointer holds the pill to the end, waits out the burn, restores, and again.
  const demoAct = useEffectEvent((act: 'press' | 'release' | 'restore') => {
    if (act === 'press') {
      demoHolding.current = true;
      startHold();
    } else if (act === 'release') {
      if (!demoHolding.current) return;
      demoHolding.current = false;
      endHold('demo');
    } else restore('demo');
  });
  const demo = autoplay && !still && playing;
  useEffect(() => {
    const stage = root.current;
    const arrow = pointer.current;
    if (!demo || !stage || !arrow) return;
    const stop = runDemo(stage, arrow, async ({ wait, glide, glyph }) => {
      /** The middle of `element`, a little low and right, in the stage's px. */
      const on = (element: Element | null): Point => {
        const frame = stage.getBoundingClientRect();
        const scale = frame.width / stage.offsetWidth || 1;
        const rect = element?.getBoundingClientRect() ?? frame;
        return {
          x: (rect.left + rect.width * 0.56 - frame.left) / scale,
          y: (rect.top + rect.height * 0.62 - frame.top) / scale,
        };
      };
      const rest = () => ({ x: stage.offsetWidth * 0.62, y: stage.offsetHeight * 0.8 });
      await glide(rest(), 700);
      for (;;) {
        if (run.current.phase === 'idle') {
          await wait(1200);
          await glide(on(pill.current), 760);
          glyph('hand');
          await wait(260);
          demoAct('press');
          await wait(HOLD + 120);
          demoAct('release');
          await wait(400);
          glyph('arrow');
          await glide(rest(), 900);
          await wait(BURN + 2600);
        }
        await glide(on(stage.querySelector('[data-part="restore"]')), 900);
        glyph('hand');
        await wait(400);
        demoAct('restore');
        await wait(300);
        glyph('arrow');
        await glide(rest(), 900);
        await wait(RESTORE + 1200);
      }
    });
    return () => {
      stop();
      demoAct('release');
    };
  }, [demo, root]);

  const side = phase === 'burning' || phase === 'gone' ? 'gone' : 'page';

  return (
    <div
      ref={root}
      className={`${styles.root} ${className}`}
      data-part="stage"
      data-phase={phase}
      data-plain={plain}
      data-color-scheme={colorScheme}
      onPointerDownCapture={take}
      onKeyDownCapture={take}
      onPointerMove={(event) => {
        if (event.pointerType !== 'touch') take();
      }}
    >
      <div className={styles.page} data-part="page" inert={side !== 'page'}>
        <div className={styles.column}>
          <p className={styles.byline} data-part="byline">
            {name}
          </p>
          <h2 className={styles.title} data-part="title">
            {title}
          </h2>
          <p className={styles.lead}>{lead}</p>
          <button
            ref={pill}
            type="button"
            className={styles.hold}
            data-part="hold"
            data-holding={holding}
            aria-describedby={hintId}
            onPointerDown={onPillDown}
            onPointerUp={onPillUp}
            onPointerCancel={onPillUp}
            onLostPointerCapture={onPillUp}
            onKeyDown={onPillKeyDown}
            onKeyUp={onPillKeyUp}
            onBlur={() => endHold('reader')}
            onClick={onPillClick}
            onContextMenu={(event) => event.preventDefault()}
          >
            <span className={styles.holdText}>
              {armed ? 'Press again to delete' : 'Hold to delete'}
            </span>
            <span className={styles.heat} data-part="heat" aria-hidden="true">
              <span className={styles.holdText}>
                {armed ? 'Press again to delete' : 'Hold to delete'}
              </span>
            </span>
          </button>
          <span id={hintId} className={styles.hidden}>
            Hold for 2 seconds, or press twice, to delete your account.
          </span>
        </div>
      </div>

      <canvas ref={burnCanvas} className={styles.burn} aria-hidden="true" />

      <div ref={gone} className={styles.gone} data-part="gone" inert={side !== 'gone'}>
        <div className={styles.column}>
          <h2 ref={heading} className={styles.signIn} tabIndex={-1}>
            Sign in
          </h2>
          <p className={styles.goneLead}>Your account is gone.</p>
          <form className={styles.form} onSubmit={onContinue}>
            <label htmlFor={emailId} className={styles.hidden}>
              Email
            </label>
            <input
              id={emailId}
              className={styles.field}
              data-part="email"
              type="email"
              name="email"
              placeholder="Email"
              autoComplete="email"
            />
            <button type="submit" className={styles.cta} data-part="continue">
              Continue
            </button>
            <button
              type="button"
              className={styles.restore}
              data-part="restore"
              onClick={() => restore('reader')}
            >
              Restore my account
            </button>
          </form>
        </div>
      </div>

      <canvas ref={flakeCanvas} className={styles.flakes} aria-hidden="true" />
      <span
        ref={probe}
        className={styles.hidden}
        style={{ color: 'var(--smoke)' }}
        aria-hidden="true"
      />

      <p className={styles.hidden} aria-live="polite">
        {message}
      </p>
      <div className={styles.pointerLayer} aria-hidden="true">
        <DemoPointer
          ref={pointer}
          className={styles.pointer}
          arrowClass={styles.arrow}
          handClass={styles.hand}
        />
      </div>
    </div>
  );
}
