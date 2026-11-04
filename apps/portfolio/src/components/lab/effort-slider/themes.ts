// Copyright (c) 2026 Bruno Delorence. MIT License.

import type { ComponentType } from 'react';
import { Car } from './car';
import { Hole, HOLE_REACH } from './hole';
import { Jet } from './jet';
import { Launch, LAUNCH_REACH } from './launch';
import { Missile } from './missile';
import { Overtake, OVERTAKE_REACH } from './overtake';
import type { Payoff } from './payoff';
import { Sonic, SONIC_REACH } from './sonic';
import { Spiral } from './spiral';

/*
 * The slider's themes besides the brain: each a thumb that changes step by step (its own drawing),
 * a fill (themes.module.css) and a last-step payoff (its own canvases' painter).
 */

export type Theme = 'brain' | 'galaxy' | 'formula' | 'missile' | 'jet';

type Look = {
  /** The steps' names when none are given. */
  levels: string[];
  /** The last step's name on a dark page, where it differs. */
  darkLast?: string;
  Icon: ComponentType<{ id: string }>;
  Payoff: new (track: HTMLCanvasElement, box: HTMLCanvasElement, host: HTMLElement) => Payoff;
  /** Half the payoff's box around the thumb, in px. */
  reach: readonly [number, number];
};

export const LOOKS: Record<Exclude<Theme, 'brain'>, Look> = {
  galaxy: {
    levels: ['Nebula', 'Spiral', 'Cluster', 'Quasar', 'Supermassive', 'Event horizon'],
    darkLast: 'White hole',
    Icon: Spiral,
    Payoff: Hole,
    reach: HOLE_REACH,
  },
  formula: {
    levels: ['Pit lane', 'Formation', 'Race pace', 'Push', 'Qualifying', 'Overtake'],
    Icon: Car,
    Payoff: Overtake,
    reach: OVERTAKE_REACH,
  },
  missile: {
    levels: ['Armed', 'Fuelled', 'Ignition', 'Liftoff', 'Boost', 'Hypersonic'],
    Icon: Missile,
    Payoff: Launch,
    reach: LAUNCH_REACH,
  },
  jet: {
    levels: ['Taxi', 'Takeoff', 'Climb', 'Cruise', 'Afterburner', 'Mach 1'],
    Icon: Jet,
    Payoff: Sonic,
    reach: SONIC_REACH,
  },
};
