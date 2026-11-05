// Copyright (c) 2026 Bruno Delorence. MIT License.
// Changed for rabtx: on narrow screens the playground's options open as a sidebar over the
// stage (Customize), instead of a long column under it.

'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { BotAvatar, type BotAvatarProps } from './bot-avatar';
import type { State } from './brain';
import type { Glasses, Hat, Shading } from './render';
import { SHAPE_NAMES, type ShapeName } from './shapes';
import { useAutoplay } from './use-autoplay';
import styles from './bot-avatars.module.css';

/*
 * Bot avatars: plush, furry 3D faces for AI agents, drawn on a plain 2D canvas (no WebGL). This
 * file is the showcase around the avatar itself (bot-avatar.tsx):
 *
 * - A row of four, living on their own: looking around, blinking, hopping and spinning now and
 *   then, and following the pointer while it moves. Poke one and it leaps.
 * - Two scenes from an agent app: a list of bots, one idle, one at work, one asleep; and a chat,
 *   where the bot works while it thinks, then settles as its answer streams in word by word.
 * - A playground with every option (eighteen bodies, three states, three sizes, five finishes,
 *   hats, glasses, fur, colour, ink and light), and the code for what it shows.
 *
 * Colours are light-dark() tokens on the root, so the showcase follows the page's color-scheme or
 * the colorScheme prop; the avatars look the same on both.
 */

const TITLE = (s: string) => s[0].toUpperCase() + s.slice(1);

const STATES: State[] = ['idle', 'working', 'sleeping'];
const SIZES = [96, 64, 32];
const SHADINGS: Shading[] = ['fabric', 'plastic', 'crisp', 'smooth', 'flat'];
const HATS: Hat[] = ['none', 'beret', 'beanie', 'party', 'crown'];
const GLASSES: Glasses[] = ['none', 'round', 'square'];
/**
 * Body colours: the swatch shows the colour as it reads on the lit face; the value is the colour
 * before light and tuning, which is what the avatar takes.
 */
const COLORS = [
  { name: 'Sky', swatch: '#41c4ff', value: '#68badf' },
  { name: 'Mint', swatch: '#2fcb7a', value: '#5abb88' },
  { name: 'Orchid', swatch: '#dc48ff', value: '#b458ca' },
  { name: 'Ocean', swatch: '#35b8ff', value: '#5caeda' },
  { name: 'Snow', swatch: '#f4f2fa', value: '#f2f0f5' },
];
/** Eye colours, used as they are. */
const INKS = [
  { name: 'Night', swatch: '#1f1b2e', value: '#1f1b2e' },
  { name: 'Chalk', swatch: '#f6f4f0', value: '#f6f4f0' },
  { name: 'Ocean', swatch: '#35b8ff', value: '#35b8ff' },
  { name: 'Orchid', swatch: '#dc48ff', value: '#dc48ff' },
];

const REPLY =
  'Three things stood out: the pilot starts in May, legal wants the data terms by Friday, and the budget stays where it was.';
const QUESTION = 'Could you sum up the notes from Tuesday’s call?';

type Settings = {
  type: ShapeName;
  state: State;
  size: number;
  shading: Shading;
  hat: Hat;
  glasses: Glasses;
  furLength: number;
  color: string | undefined;
  brightness: number;
  saturation: number;
  ink: string;
  shadow: number;
  backLight: number;
  sheen: number;
  depth: number;
  edgeFuzz: number;
  speed: number;
};

const DEFAULTS: Settings = {
  type: 'clover',
  state: 'idle',
  size: 96,
  shading: 'fabric',
  hat: 'none',
  glasses: 'none',
  furLength: 100,
  color: undefined,
  brightness: 120,
  saturation: 159,
  ink: '#1f1b2e',
  shadow: 115,
  backLight: 60,
  sheen: 0,
  depth: 65,
  edgeFuzz: 90,
  speed: 1,
};

export function BotAvatars({
  autoplay = true,
  colorScheme,
  className = '',
}: {
  /** The showcase's avatars live on their own and the chat plays while on screen; false holds them still. */
  autoplay?: boolean;
  /** Light or dark colours, or the reader's ('system'); without it, the page's color-scheme. */
  colorScheme?: 'light' | 'dark' | 'system';
  className?: string;
}) {
  const still = !autoplay;
  return (
    <div className={`${styles.root} ${className}`} data-color-scheme={colorScheme}>
      <section className={styles.preview} aria-label="Avatars" data-part="preview">
        <div className={styles.team}>
          {(
            [
              ['clover', undefined],
              ['flower', undefined],
              ['ghost', undefined],
              ['square', '#b15da8'],
            ] as [ShapeName, string | undefined][]
          ).map(([type, color], i) => (
            <figure key={type} className={styles.seat}>
              <BotAvatar type={type} color={color} size={96} seed={i + 3} paused={still} />
              <figcaption className={styles.caption}>{TITLE(type)}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <div className={styles.split}>
        <section className={styles.cell} aria-label="Bots list" data-part="list">
          <BotsList still={still} />
        </section>
        <section className={styles.cell} aria-label="Chat" data-part="chat">
          <Chat still={still} />
        </section>
      </div>

      <Playground />
    </div>
  );
}

function BotsList({ still }: { still: boolean }) {
  const bots: {
    name: string;
    status: string;
    type: ShapeName;
    state: State;
  }[] = [
    {
      name: 'Mail sorter',
      status: '12 threads triaged, 4 replies queued',
      type: 'star',
      state: 'idle',
    },
    {
      name: 'Research aide',
      status: 'Reading 3 reports on churn',
      type: 'flower',
      state: 'working',
    },
    { name: 'Night watch', status: 'Asleep until 8:30', type: 'ghost', state: 'sleeping' },
  ];
  return (
    <div className={styles.bots}>
      <h3 className={styles.botsHead}>Bots</h3>
      <ul className={styles.botsList}>
        {bots.map((bot, i) => (
          <li key={bot.name} className={styles.botRow}>
            <BotAvatar type={bot.type} state={bot.state} size={36} seed={i + 11} paused={still} />
            <span className={styles.botText}>
              <span className={styles.botName}>{bot.name}</span>
              <span className={styles.botStatus}>
                <span className={styles.srOnly}>{TITLE(bot.state)}: </span>
                {bot.status}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** How long the bot thinks, then how long each word takes to come in, then how long it rests. */
const THINK = 2600;
const WORD = 70;
const HOLD = 1700;

function Chat({ still }: { still: boolean }) {
  const { ref, playing } = useAutoplay<HTMLDivElement>(6000);
  const words = REPLY.split(' ');
  // -1 while thinking, then how many words are in.
  const [shown, setShown] = useState(words.length);
  const run = playing && !still;

  useEffect(() => {
    let timer = 0;
    if (!run) {
      timer = window.setTimeout(() => setShown(words.length), 0);
      return () => window.clearTimeout(timer);
    }
    let n = -1;
    const next = () => {
      if (n < 0) {
        setShown(-1);
        n = 0;
        timer = window.setTimeout(next, THINK);
      } else if (n < words.length) {
        n++;
        setShown(n);
        timer = window.setTimeout(next, n === words.length ? HOLD + words.length * 6 : WORD);
      } else {
        n = -1;
        next();
      }
    };
    timer = window.setTimeout(next, 0);
    return () => window.clearTimeout(timer);
  }, [run, words.length]);

  const thinking = shown < 0;
  return (
    <div ref={ref} className={styles.thread}>
      <p className={styles.bubble}>{QUESTION}</p>
      <div className={styles.botLine}>
        <BotAvatar
          type="flower"
          size={32}
          seed={21}
          state={thinking ? 'working' : 'idle'}
          paused={still}
        />
        <div className={styles.reply}>
          {/* The full answer keeps the space, so nothing below jumps as it streams. */}
          <p className={styles.replyGhost} aria-hidden="true">
            {REPLY}
          </p>
          <p
            className={styles.replyLive}
            aria-live="polite"
            aria-busy={thinking || shown < words.length}
          >
            {thinking ? (
              <span className={styles.thinking}>Thinking…</span>
            ) : (
              words.slice(0, shown).map((w, i) => (
                <span key={i} className={styles.word}>
                  {w}{' '}
                </span>
              ))
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function Playground() {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [playing, setPlaying] = useState(false);
  // On narrow screens the options are a sidebar over the stage, opened by Customize.
  const [panel, setPanel] = useState(false);
  const panelId = useId();
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setS((now) => ({ ...now, [key]: value }));

  const props: BotAvatarProps = {
    type: s.type,
    state: s.state,
    size: s.size,
    shading: s.shading,
    hat: s.hat,
    glasses: s.glasses,
    furLength: s.furLength / 100,
    color: s.color,
    brightness: s.brightness,
    saturation: s.saturation,
    ink: s.ink,
    shadow: s.shadow,
    backLight: s.backLight,
    sheen: s.sheen,
    depth: s.depth,
    edgeFuzz: s.edgeFuzz,
    speed: s.speed,
  };

  return (
    <section
      className={styles.playground}
      aria-labelledby="bot-avatars-playground"
      data-part="playground"
    >
      <h3 id="bot-avatars-playground" className={styles.pgTitle}>
        Playground
      </h3>
      <div
        className={styles.pg}
        data-panel={panel || undefined}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && panel) setPanel(false);
        }}
      >
        <div className={styles.stage} data-part="stage">
          <BotAvatar
            {...props}
            paused={!playing}
            seed={5}
            label={`${TITLE(s.type)} avatar, ${s.state}`}
          />
          <button
            type="button"
            className={styles.play}
            aria-pressed={playing}
            onClick={() => setPlaying((p) => !p)}
          >
            {playing ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            className={styles.customize}
            aria-expanded={panel}
            aria-controls={panelId}
            onClick={() => setPanel((open) => !open)}
          >
            {panel ? 'Done' : 'Customize'}
          </button>
        </div>
        <div id={panelId} className={styles.controls} data-part="controls">
          <div className={styles.panelHead}>
            <span className={styles.panelTitle}>Customize</span>
            <button
              type="button"
              className={styles.panelClose}
              aria-label="Close options"
              onClick={() => setPanel(false)}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>
          <Chips
            label="Type"
            options={SHAPE_NAMES}
            value={s.type}
            onChange={(v) => set('type', v)}
          />
          <Chips label="State" options={STATES} value={s.state} onChange={(v) => set('state', v)} />
          <Chips
            label="Size"
            options={SIZES}
            value={s.size}
            format={(v) => `${v}px`}
            onChange={(v) => set('size', v)}
          />
          <Chips
            label="Shading"
            options={SHADINGS}
            value={s.shading}
            onChange={(v) => set('shading', v)}
          />
          <Chips label="Hat" options={HATS} value={s.hat} onChange={(v) => set('hat', v)} />
          <Chips
            label="Glasses"
            options={GLASSES}
            value={s.glasses}
            onChange={(v) => set('glasses', v)}
          />
          <div className={styles.tuning}>
            <Slider
              label="Fur length"
              min={0}
              max={200}
              value={s.furLength}
              unit="%"
              onChange={(v) => set('furLength', v)}
            />
            <Swatches
              label="Color"
              options={COLORS}
              value={s.color}
              onChange={(v) => set('color', v)}
            />
            <Slider
              label="Brightness"
              min={40}
              max={200}
              value={s.brightness}
              unit="%"
              onChange={(v) => set('brightness', v)}
            />
            <Slider
              label="Saturation"
              min={0}
              max={250}
              value={s.saturation}
              unit="%"
              onChange={(v) => set('saturation', v)}
            />
            <Swatches
              label="Ink"
              options={INKS}
              value={s.ink}
              onChange={(v) => set('ink', v ?? DEFAULTS.ink)}
            />
            <Slider
              label="Shadow"
              min={0}
              max={200}
              value={s.shadow}
              unit="%"
              onChange={(v) => set('shadow', v)}
            />
            <Slider
              label="Back light"
              min={0}
              max={100}
              value={s.backLight}
              unit="%"
              onChange={(v) => set('backLight', v)}
            />
            <Slider
              label="Sheen"
              min={0}
              max={100}
              value={s.sheen}
              unit="%"
              onChange={(v) => set('sheen', v)}
            />
            <Slider
              label="Depth"
              min={0}
              max={100}
              value={s.depth}
              unit="%"
              onChange={(v) => set('depth', v)}
            />
            <Slider
              label="Edge fuzz"
              min={0}
              max={100}
              value={s.edgeFuzz}
              unit="%"
              onChange={(v) => set('edgeFuzz', v)}
            />
            <Slider
              label="Speed"
              min={0.25}
              max={3}
              step={0.25}
              value={s.speed}
              unit="×"
              onChange={(v) => set('speed', v)}
            />
          </div>
        </div>
      </div>
      <Code settings={s} />
    </section>
  );
}

/** A row of chips: one radio group, arrow keys move the choice. */
function Chips<T extends string | number>({
  label,
  options,
  value,
  onChange,
  format = (v) => TITLE(String(v)),
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  format?: (value: T) => string;
}) {
  const id = useId();
  const group = useRef<HTMLDivElement>(null);
  const onKey = (e: KeyboardEvent) => {
    const step =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? -1
          : 0;
    const jump = e.key === 'Home' ? 'first' : e.key === 'End' ? 'last' : null;
    if (!step && !jump) return;
    e.preventDefault();
    const at = options.indexOf(value);
    const next =
      jump === 'first'
        ? 0
        : jump === 'last'
          ? options.length - 1
          : (at + step + options.length) % options.length;
    onChange(options[next]);
    const buttons = group.current?.querySelectorAll<HTMLButtonElement>('button');
    buttons?.[next]?.focus();
  };
  return (
    <div className={styles.field}>
      <span id={id} className={styles.fieldLabel}>
        {label}
      </span>
      <div
        ref={group}
        role="radiogroup"
        aria-labelledby={id}
        className={styles.chips}
        onKeyDown={onKey}
      >
        {options.map((o) => (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={o === value}
            tabIndex={o === value ? 0 : -1}
            className={styles.chip}
            onClick={() => onChange(o)}
          >
            {format(o)}
          </button>
        ))}
      </div>
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  step = 1,
  value,
  unit,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  const shown = unit === '×' ? `${value}×` : `${value}%`;
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel} aria-hidden="true">
        {label}
      </span>
      <label className={styles.slider}>
        <span className={styles.sliderFill} style={{ width: `${fill}%` }} aria-hidden="true" />
        <span className={styles.sliderName} aria-hidden="true">
          {label}
        </span>
        <span className={styles.sliderValue} aria-hidden="true">
          {shown}
        </span>
        <input
          type="range"
          className={styles.range}
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={label}
          aria-valuetext={shown}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </label>
    </div>
  );
}

function Swatches({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { name: string; swatch: string; value: string }[];
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}) {
  const id = useId();
  return (
    <div className={styles.field}>
      <span id={id} className={styles.fieldLabel}>
        {label}
      </span>
      <div role="group" aria-labelledby={id} className={styles.swatches}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            className={styles.swatch}
            style={{ background: o.swatch }}
            aria-label={o.name}
            aria-pressed={o.value === value}
            onClick={() => onChange(o.value === value && label === 'Color' ? undefined : o.value)}
          />
        ))}
      </div>
    </div>
  );
}

function Code({ settings: s }: { settings: Settings }) {
  const [copied, setCopied] = useState(false);
  const attrs: string[] = [`type="${s.type}"`, `size={${s.size}}`];
  const keys: (keyof Settings)[] = [
    'state',
    'shading',
    'hat',
    'glasses',
    'color',
    'ink',
    'brightness',
    'saturation',
    'shadow',
    'backLight',
    'sheen',
    'depth',
    'edgeFuzz',
    'speed',
  ];
  for (const k of keys) {
    const v = s[k];
    if (v === DEFAULTS[k] || v === undefined) continue;
    attrs.push(typeof v === 'string' ? `${k}="${v}"` : `${k}={${v}}`);
  }
  if (s.furLength !== DEFAULTS.furLength) attrs.push(`furLength={${s.furLength / 100}}`);
  const code = `import { BotAvatar } from './bot-avatar';\n\n<BotAvatar ${attrs.join(' ')} />`;
  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(t);
  }, [copied]);
  return (
    <div className={styles.code} data-part="code">
      <pre className={styles.pre}>
        <code>{code}</code>
      </pre>
      <button
        type="button"
        className={styles.copy}
        aria-label={copied ? 'Copied' : 'Copy code'}
        onClick={() => {
          navigator.clipboard?.writeText(code).then(
            () => setCopied(true),
            () => {},
          );
        }}
      >
        <svg viewBox="0 0 16 16" className={styles.copyIcon} aria-hidden="true">
          {copied ? (
            <path
              d="M3.5 8.5l3 3 6-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <>
              <rect
                x="5.5"
                y="5.5"
                width="8"
                height="8"
                rx="2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
              />
              <path
                d="M10.5 3.5v-.5a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
              />
            </>
          )}
        </svg>
        <span className={styles.tooltip} aria-hidden="true">
          {copied ? 'Copied' : 'Copy code'}
        </span>
      </button>
      <span className={styles.srOnly} aria-live="polite">
        {copied ? 'Code copied' : ''}
      </span>
    </div>
  );
}
