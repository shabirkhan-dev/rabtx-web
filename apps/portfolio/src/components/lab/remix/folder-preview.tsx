"use client";

import { useEffect, useState } from "react";
import { FolderArt } from "@/components/lab/file-library/folder-art";
import { FOLDERS, PEOPLE } from "@/components/lab/file-library/data";
import styles from "@/components/lab/file-library/file-library.module.css";

/*
 * The File library's card in the Lab: its folder pictures alone, the full window being too big
 * for a card. Every few seconds one folder lights and opens, as it does under a dragged file.
 * Decorative, and still under reduced motion.
 */

const SHOWN = FOLDERS.slice(0, 3);
const EMPTY = new Set<string>();

export function FolderPreview() {
  const [open, setOpen] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setOpen((now) => (now + 1) % SHOWN.length), 1800);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <div
      className={`${styles.root} grid! h-full w-full place-items-center rounded-none! bg-none! bg-transparent! p-0!`}
      aria-hidden="true"
    >
      <ul className="flex gap-3">
        {SHOWN.map((folder, i) => (
          <li
            key={folder.id}
            className={`${styles.tile} h-auto! w-[150px] bg-transparent! pt-0! border-0! shadow-none!`}
            data-over={i === open ? "move" : undefined}
          >
            <FolderArt folder={folder} people={PEOPLE} fresh={EMPTY} progress={null} done={false} />
            <span className={styles.tileName}>{folder.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
