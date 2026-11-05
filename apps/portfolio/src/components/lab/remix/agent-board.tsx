"use client";

import { useEffect, useRef, useState } from "react";
import { BotAvatar } from "@/components/lab/bot-avatars/bot-avatar";
import type { State } from "@/components/lab/bot-avatars/brain";
import type { ShapeName } from "@/components/lab/bot-avatars/shapes";

/*
 * My take on Bot avatars: the agents on a Grid project, each with its own body, working through
 * a queue of tasks. Assign hands the next task to an idle agent (it hops while it works and
 * settles when it's done); a sleeping one can be woken. The avatar's mood only echoes the state:
 * the words beside it and the activity log say what is going on.
 */

type Agent = {
  id: string;
  name: string;
  role: string;
  type: ShapeName;
  state: State;
  task?: string;
  /** How long the current task takes, in ms, so its progress bar can run. */
  took?: number;
};

const START: Agent[] = [
  { id: "builder", name: "Builder", role: "Writes the code", type: "mech", state: "working", task: "Implementing #214 token refresh", took: 6500 },
  { id: "reviewer", name: "Reviewer", role: "Reads every pull request", type: "droid", state: "idle" },
  { id: "docs", name: "Docs writer", role: "Keeps the guides current", type: "cloud", state: "idle" },
  { id: "ci", name: "Night CI", role: "Runs the long suites", type: "ghost", state: "sleeping" },
];

const TASKS = [
  "Reviewing PR #212",
  "Writing docs for /api/agents",
  "Fixing the flaky sync test",
  "Splitting the board columns",
  "Triaging 6 new issues",
  "Running the e2e suite",
];

const label = (state: State) => (state === "working" ? "Working" : state === "sleeping" ? "Asleep" : "Idle");

export function AgentBoard() {
  const [agents, setAgents] = useState(START);
  const [queue, setQueue] = useState(TASKS);
  const [log, setLog] = useState<string[]>(["Builder picked up #214"]);
  const timers = useRef(new Map<string, number>());
  /** The agents as they are now, for the timers that finish their tasks. */
  const current = useRef(agents);
  useEffect(() => {
    current.current = agents;
  }, [agents]);

  const finish = (id: string, after: number) => {
    window.clearTimeout(timers.current.get(id));
    timers.current.set(
      id,
      window.setTimeout(() => {
        const agent = current.current.find((a) => a.id === id);
        if (!agent) return;
        setLog((lines) => [`${agent.name} finished: ${agent.task?.toLowerCase()}`, ...lines].slice(0, 4));
        setAgents((now) =>
          now.map((a) => (a.id === id ? { ...a, state: "idle", task: undefined, took: undefined } : a)),
        );
      }, after),
    );
  };

  // The Builder starts the board already at work.
  useEffect(() => {
    const pending = timers.current;
    pending.set(
      "builder",
      window.setTimeout(() => {
        setLog((lines) => ["Builder finished: implementing #214 token refresh", ...lines].slice(0, 4));
        setAgents((now) =>
          now.map((a) => (a.id === "builder" ? { ...a, state: "idle", task: undefined, took: undefined } : a)),
        );
      }, 6500),
    );
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const assign = (id: string) => {
    const task = queue[0];
    if (!task) return;
    const took = 3500 + Math.round(Math.random() * 3000);
    setQueue((now) => [...now.slice(1), task]);
    setAgents((now) => now.map((agent) => (agent.id === id ? { ...agent, state: "working", task, took } : agent)));
    const name = agents.find((agent) => agent.id === id)?.name;
    setLog((lines) => [`${name} picked up: ${task.toLowerCase()}`, ...lines].slice(0, 4));
    finish(id, took);
  };

  const wake = (id: string) => {
    setAgents((now) => now.map((agent) => (agent.id === id ? { ...agent, state: "idle" } : agent)));
    const name = agents.find((agent) => agent.id === id)?.name;
    setLog((lines) => [`${name} woke up`, ...lines].slice(0, 4));
  };

  const idle = agents.find((agent) => agent.state === "idle");

  return (
    <div className="grid gap-3 rounded-2xl bg-surface p-3 md:grid-cols-[minmax(0,1fr)_240px] md:p-4">
      <div className="rounded-xl bg-background p-2 shadow-[inset_0_0_0_1px_var(--line)]">
        <div className="flex items-center justify-between px-2.5 pt-1.5 pb-2">
          <p className="text-xs leading-4 font-medium text-muted">Grid · rabtx-web · Agents</p>
          <button
            type="button"
            disabled={!idle}
            onClick={() => idle && assign(idle.id)}
            className="h-7 cursor-pointer rounded-full bg-foreground px-3 text-xs font-medium text-background transition-opacity disabled:cursor-default disabled:opacity-40"
          >
            {idle ? "Assign next task" : "Everyone is busy"}
          </button>
        </div>
        <ul>
          {agents.map((agent, i) => (
            <li key={agent.id} className="flex items-center gap-3 rounded-lg px-2.5 py-2.5">
              <BotAvatar type={agent.type} state={agent.state} size={36} seed={i + 31} />
              <div className="flex min-w-0 flex-1 flex-col gap-1 text-sm leading-4">
                <p className="flex items-baseline gap-2">
                  <span className="font-medium text-foreground">{agent.name}</span>
                  <span
                    className={`text-[11px] ${agent.state === "working" ? "text-new" : "text-faint"}`}
                  >
                    {label(agent.state)}
                  </span>
                </p>
                <p className="truncate text-xs text-muted">{agent.task ?? agent.role}</p>
                {agent.state === "working" && agent.took ? (
                  <span className="relative h-0.5 overflow-hidden rounded-full bg-raised" aria-hidden="true">
                    <span
                      key={agent.task}
                      className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-new motion-safe:animate-[grow_var(--took)_linear_both]"
                      style={{ "--took": `${agent.took}ms` } as React.CSSProperties}
                    />
                  </span>
                ) : null}
              </div>
              {agent.state === "idle" ? (
                <button
                  type="button"
                  onClick={() => assign(agent.id)}
                  className="h-7 cursor-pointer rounded-full bg-surface px-2.5 text-xs text-muted transition-colors hover-capable:hover:bg-raised hover-capable:hover:text-foreground"
                >
                  Assign
                </button>
              ) : agent.state === "sleeping" ? (
                <button
                  type="button"
                  onClick={() => wake(agent.id)}
                  className="h-7 cursor-pointer rounded-full bg-surface px-2.5 text-xs text-muted transition-colors hover-capable:hover:bg-raised hover-capable:hover:text-foreground"
                >
                  Wake
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-2 rounded-xl p-2">
        <p className="text-xs leading-4 font-medium text-muted">Activity</p>
        <ol className="flex flex-col gap-2 text-xs leading-4 text-muted" aria-live="polite">
          {log.map((line, i) => (
            <li key={`${line}-${log.length - i}`} className={i === 0 ? "text-foreground" : ""}>
              {line}
            </li>
          ))}
        </ol>
        <p className="mt-auto pt-3 text-[11px] leading-4 text-faint">
          Next up: {queue[0]?.toLowerCase()}
        </p>
      </div>
    </div>
  );
}
