"use client";

import { useEffect, useRef, useState } from "react";
import { EffortSlider } from "@/components/lab/effort-slider/effort-slider";

/*
 * My take on the Effort slider: the run settings of a Grid task. The slider is controlled, and
 * what each step costs is written next to it: a thinking budget, a rough time and a relative
 * cost. Run plays the task out, sped up, so the trade the slider makes can be felt as well as
 * read.
 */

const LEVELS = ["Quick", "Balanced", "Careful", "Deep", "Max", "Galaxy"];
const BUDGET = ["1k", "4k", "12k", "32k", "64k", "128k"];
const SECONDS = [2, 5, 12, 30, 60, 180];
const COST = [1, 1, 2, 3, 4, 5];
/** The sped-up run: a second of the real time is this many ms on screen. */
const FAST = 14;

const time = (s: number) => (s < 60 ? `~${s} s` : `~${Math.round(s / 60)} min`);

export function RunSettings() {
  const [step, setStep] = useState(1);
  const [run, setRun] = useState<{ at: number; done: boolean } | null>(null);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const start = () => {
    window.clearTimeout(timer.current);
    const at = step;
    setRun({ at, done: false });
    timer.current = window.setTimeout(() => setRun({ at, done: true }), SECONDS[at] * FAST);
  };

  return (
    <div className="grid gap-3 rounded-2xl bg-surface p-3 md:grid-cols-[minmax(0,1fr)_240px] md:p-4">
      <EffortSlider
        levels={LEVELS}
        value={step}
        onChange={(index) => {
          setStep(index);
          setRun(null);
        }}
        recommended={1}
        label="Thinking"
        minLabel="Faster"
        maxLabel="Smarter"
        help="How long the agent thinks before it writes code. Higher is slower, and costs more."
        autoplay={false}
      />
      <div className="flex flex-col gap-4 rounded-xl p-2 text-sm leading-5 tracking-[-0.0064em]">
        <div>
          <p className="text-xs leading-4 font-medium text-muted">Grid · Run settings</p>
          <p className="mt-1.5 text-foreground">Split the board columns into a shared component</p>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13px]">
          <dt className="text-muted">Budget</dt>
          <dd className="font-mono text-foreground">{BUDGET[step]} tokens</dd>
          <dt className="text-muted">Time</dt>
          <dd className="font-mono text-foreground">{time(SECONDS[step])}</dd>
          <dt className="text-muted">Cost</dt>
          <dd className="flex items-center gap-1" aria-label={`${COST[step]} of 5`}>
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                aria-hidden="true"
                className={`size-1.5 rounded-full transition-colors ${i < COST[step] ? "bg-foreground" : "bg-chip"}`}
              />
            ))}
          </dd>
        </dl>
        <div className="mt-auto flex flex-col gap-2">
          <span className="relative h-1 overflow-hidden rounded-full bg-raised" aria-hidden="true">
            {run ? (
              <span
                key={`${run.at}-${String(run.done)}`}
                className={`absolute inset-0 origin-left rounded-full bg-new ${run.done ? "" : "motion-safe:animate-[grow_var(--took)_linear_both]"}`}
                style={{ "--took": `${SECONDS[run.at] * FAST}ms` } as React.CSSProperties}
              />
            ) : null}
          </span>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted" aria-live="polite">
              {!run
                ? "Not run yet"
                : run.done
                  ? `Done in ${time(SECONDS[run.at]).slice(1)} (sped up)`
                  : `Thinking at ${LEVELS[run.at]}…`}
            </p>
            <button
              type="button"
              onClick={start}
              disabled={Boolean(run && !run.done)}
              className="h-8 cursor-pointer rounded-full bg-foreground px-3.5 text-xs font-medium text-background transition-opacity disabled:cursor-default disabled:opacity-40"
            >
              Run
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
