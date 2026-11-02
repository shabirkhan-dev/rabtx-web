"use client";

import { useSyncExternalStore } from "react";
import { THEME_KEY } from "./theme-script";

type Theme = "light" | "dark";

function resolved(): Theme {
	const set = document.documentElement.dataset.theme;
	if (set === "light" || set === "dark") return set;
	return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribe(onChange: () => void) {
	const media = matchMedia("(prefers-color-scheme: dark)");
	const observer = new MutationObserver(onChange);
	observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
	media.addEventListener("change", onChange);
	return () => {
		observer.disconnect();
		media.removeEventListener("change", onChange);
	};
}

/** Round header button that flips between light and dark and remembers the choice. */
export function ThemeToggle() {
	const theme = useSyncExternalStore<Theme | null>(subscribe, resolved, () => null);
	const next: Theme = theme === "dark" ? "light" : "dark";

	return (
		<button
			type="button"
			aria-label={theme ? `Switch to ${next} theme` : "Switch theme"}
			onClick={() => {
				document.documentElement.dataset.theme = next;
				try {
					localStorage.setItem(THEME_KEY, next);
				} catch {
					// Private mode or blocked storage: the switch still applies for this visit.
				}
			}}
			className="grid size-[42px] shrink-0 cursor-pointer place-items-center rounded-full bg-surface/85 text-ink backdrop-blur-md transition-opacity hover:opacity-80"
		>
			<svg viewBox="0 0 20 20" aria-hidden className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5">
				{theme === "dark" ? (
					<>
						<circle cx="10" cy="10" r="3.5" />
						<path
							strokeLinecap="round"
							d="M10 1.75v1.5M10 16.75v1.5M18.25 10h-1.5M3.25 10h-1.5M15.83 4.17l-1.06 1.06M5.23 14.77l-1.06 1.06M15.83 15.83l-1.06-1.06M5.23 5.23L4.17 4.17"
						/>
					</>
				) : (
					<path strokeLinejoin="round" d="M16.5 12.2A7 7 0 0 1 7.8 3.5a7 7 0 1 0 8.7 8.7Z" />
				)}
			</svg>
		</button>
	);
}
