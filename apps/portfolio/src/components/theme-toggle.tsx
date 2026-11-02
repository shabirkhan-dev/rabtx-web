"use client";

import { Moon, Sun } from "lucide-react";
import { THEME_STORAGE_KEY, syncThemeColor } from "@/components/theme-script";
import { iconButton } from "@/lib/icon-button";

export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    syncThemeColor(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be blocked; the theme still switches for this visit.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch colour theme"
      className={iconButton}
    >
      <Moon className="hidden size-4 dark:block" strokeWidth={1.5} />
      <Sun className="size-4 dark:hidden" strokeWidth={1.5} />
    </button>
  );
}
