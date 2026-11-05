"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

export type SourceFile = { name: string; code: string };

/** A copy button that says so when it has copied. */
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard?.writeText(text).then(() => setCopied(true), () => {})}
      className="flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-raised px-2.5 text-xs text-muted transition-colors hover-capable:hover:text-foreground"
    >
      {copied ? <Check className="size-3.5" strokeWidth={1.75} /> : <Copy className="size-3.5" strokeWidth={1.5} />}
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </button>
  );
}

/** A command or a short snippet, with its copy button. */
export function Snippet({ title, code }: { title: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-xl bg-surface">
      <div className="flex items-center justify-between gap-3 py-2 pr-2 pl-4">
        <p className="text-xs leading-4 font-medium text-muted">{title}</p>
        <CopyButton text={code} label="Copy" />
      </div>
      <pre className="overflow-x-auto px-4 pb-4 font-mono text-[12.5px] leading-5 text-foreground">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/**
 * Every file of an experiment, one tab each: read with arrow keys, copied one at a time. Long
 * files scroll inside their own box.
 */
export function SourceViewer({ files }: { files: SourceFile[] }) {
  const [active, setActive] = useState(0);
  const id = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const file = files[active];
  const lines = file.code.replace(/\n$/, "").split("\n");

  const onKey = (event: React.KeyboardEvent) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    const jump = event.key === "Home" ? 0 : event.key === "End" ? files.length - 1 : null;
    if (!step && jump === null) return;
    event.preventDefault();
    const next = jump ?? (active + step + files.length) % files.length;
    setActive(next);
    tabs.current[next]?.focus();
  };

  return (
    <div className="overflow-hidden rounded-xl bg-surface">
      <div className="flex items-center gap-2 border-b border-line py-2 pr-2 pl-2">
        <div
          role="tablist"
          aria-label="Source files"
          className="flex flex-1 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onKeyDown={onKey}
        >
          {files.map((f, i) => (
            <button
              key={f.name}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${id}-tab-${i}`}
              aria-selected={i === active}
              aria-controls={`${id}-panel`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              className={`h-7 shrink-0 cursor-pointer rounded-full px-2.5 font-mono text-[11.5px] transition-colors ${
                i === active ? "bg-raised text-foreground" : "text-muted hover-capable:hover:text-foreground"
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
        <CopyButton text={file.code} label="Copy file" />
      </div>
      <div
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${active}`}
        tabIndex={0}
        className="max-h-[520px] overflow-auto focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#387bff]"
      >
        <pre className="py-3 font-mono text-[12px] leading-5 text-foreground">
          <code className="grid grid-cols-[auto_1fr]">
            {lines.map((line, i) => (
              <span key={i} className="contents">
                <span className="pr-4 pl-4 text-right text-faint select-none" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="pr-4 whitespace-pre">{line || " "}</span>
              </span>
            ))}
          </code>
        </pre>
      </div>
      <p className="border-t border-line px-4 py-2.5 text-[11px] leading-4 text-faint">
        {files.length} files · put them in one folder · needs React 19 and CSS Modules
      </p>
    </div>
  );
}
