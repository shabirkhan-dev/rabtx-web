// Copyright (c) 2026 Bruno Delorence. MIT License.
// Changed for rabtx:
// - A `library` prop: the workspace, people, folders and files are data, not constants, so the
//   library can show any team's files (the demo's Halden Studio is the default).
// - The Name and Size headers sort the table (ascending, descending, then back to as added),
//   with aria-sort and an announcement; moves, Undo and uploads keep working under any order.
// - General's count is counted, not fixed: uploads into it or its folders raise it.

'use client';

import {
  useEffect,
  useEffectEvent,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import {
  DEFAULT_LIBRARY,
  DEMO_UPLOAD,
  bytesOf,
  formatSize,
  huesOf,
  kindOf,
  type FileItem,
  type Folder,
  type Kind,
  type Library,
  type Paper,
  type PersonId,
} from './data';
import { DemoPointer, runDemo, type Flight, type Point } from './demo-pointer';
import { Avatar, FolderArt, unknownPerson } from './folder-art';
import { Icon } from './icons';
import { useAutoplay } from './use-autoplay';
import styles from './file-library.module.css';

/*
 * File library: a workspace's General folder, its sub-folders as tiles over a table of the files
 * loose in it. Drag a file row onto a tile (or onto the folder in the sidebar's tree) to move it
 * there; tick several rows and drag any of them to move them all.
 *
 * - The drag is pointer events, not native drag and drop, so the ghost can be drawn: a chip with
 *   the file's icon, name and size, tilted 3°, that follows the pointer; several files make a
 *   stack of chips with their count. The row it came from fades to a third while it flies.
 * - A tile under the ghost lifts: a blue ring and glow, its front panel tips forward on its
 *   bottom edge and the papers inside rise, so the folder looks opened for the file.
 * - Dropped, the ghost shrinks into the folder (200 ms), a new paper drops in as the folder's
 *   cover, the row folds away (240 ms) and the rows under it slide up. The count changes, the
 *   folder's row in the tree flashes, and a toast says what moved, with Undo for 5 s.
 * - Files dragged in from the desktop go onto a tile the same way; an "Upload to" pill shows
 *   under it, and dropped, a progress bar fills the front before the new cover goes in.
 * - The keyboard way: tick rows with Space, then Move to in the bar that rises at the bottom
 *   opens a menu of the folders. A polite live region says every move, undo and upload.
 * - While on screen and untouched, a demo pointer plays the reference's story: one file into
 *   Contracts, three ticked and dragged together, then a picture from outside into Brand Assets.
 */

type Drag =
  | { kind: 'files'; ids: string[]; name: string; size: string; fileKind: Kind }
  | { kind: 'upload'; name: string; size: string; hues: [number, number] };

type Move = {
  folder: string;
  items: { file: FileItem; index: number }[];
  papers: string[];
};

type Toast = {
  id: number;
  lead: string;
  rest: string;
  undo?: Move;
};

type Upload = { progress: number; label: string };

/** How the table is sorted: by a column, either way, or as the files were added (null). */
type Sort = { by: 'name' | 'size'; dir: 'ascending' | 'descending' } | null;

/** How long things take, in ms, measured from the reference at 10 frames a second. */
const ROW_OUT = 240;
const ROW_IN = 300;
const INTO_FOLDER = 200;
const BACK_TO_ROW = 220;
const UPLOAD_TIME = 1100;
const TOAST_TIME = 5000;
const FLASH_TIME = 1100;
/** A mouse drag starts after this many px; a finger holds this long first. */
const SLOP = 4;
const HOLD = 320;
/** Where the ghost hangs from the pointer: the chip by its middle-left, a picture by a corner. */
const GRAB = { files: { x: 96, y: 20 }, upload: { x: 18, y: 16 } };

const isImage = (kind: Kind) => kind === 'image';

/** The folder a drop target stands for: a tile's is its id, a tree row's is `tree:` and the id. */
const folderOf = (drop: string | null) => drop?.replace(/^tree:/, '') ?? null;

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

function filesLabel(folder: Folder, uploading: Upload | undefined) {
  if (uploading) return `Uploading ${Math.round(uploading.progress)}%`;
  return folder.count === 0 ? 'No files' : plural(folder.count, 'file');
}

/** The files in the order the table shows them. */
function sortFiles(files: FileItem[], sort: Sort) {
  if (!sort) return files;
  const sign = sort.dir === 'ascending' ? 1 : -1;
  return [...files].sort((a, b) =>
    sort.by === 'name'
      ? sign * a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
      : sign * (bytesOf(a.size) - bytesOf(b.size)),
  );
}

/** A moment to start in, as a still for docs and screenshots. */
export type LibraryView = 'rest' | 'selected' | 'dragging' | 'moved' | 'uploading';

/** The library as a still view starts: which files, folders, ticks, toast and drag. */
function startOf(view: LibraryView, library: Library) {
  const moved = view === 'moved';
  const first = library.files[0];
  return {
    files: moved ? library.files.filter((file) => file.id !== 'f1') : library.files,
    folders: library.folders.map((folder) =>
      moved && folder.id === 'contracts'
        ? { ...folder, count: 1, papers: [{ id: 'still-paper', kind: 'pdf' as Kind }] }
        : folder,
    ),
    selected: new Set(view === 'selected' ? ['f2', 'f3', 'f4'] : []),
    toast: moved
      ? { id: 0, lead: 'Moved Pitch-Deck-v4.pdf', rest: ' to Contracts' }
      : (null as Toast | null),
    drag:
      view === 'dragging' && first
        ? ({
            kind: 'files',
            ids: [first.id],
            name: first.name,
            size: first.size,
            fileKind: first.kind,
          } as Drag)
        : null,
    over: view === 'dragging' ? (library.folders.find((f) => f.private)?.id ?? null) : null,
    uploads:
      view === 'uploading'
        ? ({ brand: { progress: 42, label: DEMO_UPLOAD.name } } as Record<string, Upload>)
        : {},
  };
}

export function FileLibrary({
  library: libraryProp,
  autoplay = true,
  defaultView = 'rest',
  onMove,
  colorScheme,
  className = '',
}: {
  /**
   * What the library holds: its workspace, people, folders and loose files. Read when it mounts;
   * from then on the library keeps its own state. Without it, the demo's Halden Studio, the only
   * one the autoplay demo plays on.
   */
  library?: Library;
  /** While on screen and untouched, a demo pointer drags files into folders. */
  autoplay?: boolean;
  /**
   * Starts at a moment of the story, as a still for docs and screenshots: rows ticked with the
   * bar up, a file mid-drag over a folder, a file just moved with its toast, or an upload under
   * way. Anything but 'rest' turns the autoplay demo off; the library works from there as usual.
   */
  defaultView?: LibraryView;
  /** Called after files move, with their names and the folder's (and again, reversed, on Undo). */
  onMove?: (files: string[], folder: string, undone: boolean) => void;
  /** Light or dark colours, or the reader's ('system'); without it, the page's color-scheme. */
  colorScheme?: 'light' | 'dark' | 'system';
  className?: string;
}) {
  const { ref: root, playing, take } = useAutoplay<HTMLDivElement>();
  const [lib] = useState(() => libraryProp ?? DEFAULT_LIBRARY);
  const [start] = useState(() => startOf(defaultView, lib));
  const [files, setFiles] = useState<FileItem[]>(start.files);
  const [folders, setFolders] = useState<Folder[]>(start.folders);
  const [leaving, setLeaving] = useState<ReadonlySet<string>>(new Set());
  const [entering, setEntering] = useState<ReadonlySet<string>>(new Set());
  const [fresh, setFresh] = useState<ReadonlySet<string>>(new Set());
  const [selected, setSelected] = useState<ReadonlySet<string>>(start.selected);
  const [barCount, setBarCount] = useState(start.selected.size);
  const [drag, setDrag] = useState<Drag | null>(start.drag);
  const [over, setOver] = useState<string | null>(start.over);
  /** Files from the desktop are over the library: the tiles take uploads. */
  const [native, setNative] = useState(false);
  const [toast, setToast] = useState<Toast | null>(start.toast);
  const [uploads, setUploads] = useState<Record<string, Upload>>(start.uploads);
  const [done, setDone] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>(null);
  const [tab, setTab] = useState<'folders' | 'shared'>('folders');
  const [generalOpen, setGeneralOpen] = useState(true);
  /** The sidebar: hidden by its button on a wide library, a drawer on a narrow one. */
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [message, setMessage] = useState('');

  const ids = useId();
  const pointer = useRef<HTMLSpanElement>(null);
  const ghost = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLUListElement>(null);
  const moveButton = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const rowsGroup = useRef<HTMLDivElement>(null);
  const toastSlot = useRef<HTMLDivElement>(null);
  const rows = useRef(new Map<string, HTMLDivElement>());
  const tiles = useRef(new Map<string, HTMLLIElement>());
  /** Where the ghost's top-left is, in the stage's px. */
  const ghostAt = useRef<Point>({ x: 0, y: 0 });
  const overRef = useRef<string | null>(start.over);
  const dragRef = useRef<Drag | null>(start.drag);
  /** Rows on their way out: Undo takes them back before they go. */
  const removing = useRef(new Set<string>());
  const timers = useRef(new Set<number>());
  const toastTimer = useRef(0);
  const toastId = useRef(0);
  const paperId = useRef(0);
  const press = useRef<{
    id: string;
    pointerId: number;
    x: number;
    y: number;
    touch: boolean;
    hold: number;
    started: boolean;
  } | null>(null);
  const reduced = useRef(false);

  const personOf = (id: PersonId) => lib.people[id] ?? unknownPerson(id);
  const headMembers = (lib.members ?? Object.keys(lib.people).filter((id) => id !== 'you')).slice(
    0,
    3,
  );

  /** Repeats are made to differ, so screen readers announce them again. */
  const announce = (text: string) => setMessage((now) => (now === text ? `${text} ` : text));

  const later = (fn: () => void, ms: number) => {
    const timer = window.setTimeout(() => {
      timers.current.delete(timer);
      fn();
    }, ms);
    timers.current.add(timer);
  };

  useEffect(() => {
    const all = timers.current;
    return () => {
      all.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const read = () => (reduced.current = motion.matches);
    read();
    motion.addEventListener('change', read);
    return () => motion.removeEventListener('change', read);
  }, []);

  // Narrow or wide, from the library's own width: the sidebar is a drawer under 720 px.
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const isNarrow = entry.contentRect.width < 720;
      setNarrow(isNarrow);
      if (!isNarrow) setDrawer(false);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [root]);

  // --- The toast ----------------------------------------------------------------------------

  const armToast = () => {
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), TOAST_TIME);
  };
  const showToast = (next: Omit<Toast, 'id'>) => {
    toastId.current += 1;
    setToast({ ...next, id: toastId.current });
    armToast();
  };

  // --- Moving files -------------------------------------------------------------------------

  const flashFolder = (id: string) => {
    setFlash(id);
    later(() => setFlash((now) => (now === id ? null : now)), FLASH_TIME);
  };

  const addPapers = (folderId: string, papers: Paper[], count: number) => {
    setFolders((all) =>
      all.map((folder) =>
        folder.id === folderId
          ? { ...folder, count: folder.count + count, papers: [...folder.papers, ...papers] }
          : folder,
      ),
    );
    const added = papers.map((paper) => paper.id);
    setFresh((now) => new Set([...now, ...added]));
    later(() => setFresh((now) => new Set([...now].filter((id) => !added.includes(id)))), 700);
    flashFolder(folderId);
  };

  const paperFor = (kind: Kind, name: string, hues?: readonly [number, number]): Paper => {
    paperId.current += 1;
    return {
      id: `paper-${paperId.current}`,
      kind,
      hues: isImage(kind) ? [...(hues ?? huesOf(name))] : undefined,
    };
  };

  /** Moves the files `wanted` (in table order) into a folder. */
  const moveFiles = (wanted: string[], folderId: string) => {
    const folder = folders.find((each) => each.id === folderId);
    const moving = files
      .map((file, index) => ({ file, index }))
      .filter(({ file }) => wanted.includes(file.id) && !removing.current.has(file.id));
    if (!folder || moving.length === 0) return;
    const papers = moving.map(({ file }) => paperFor(file.kind, file.name));
    addPapers(folderId, papers, moving.length);
    const gone = moving.map(({ file }) => file.id);
    gone.forEach((id) => removing.current.add(id));
    setLeaving((now) => new Set([...now, ...gone]));
    setSelected((now) => new Set([...now].filter((id) => !gone.includes(id))));
    later(
      () => {
        const still = gone.filter((id) => removing.current.has(id));
        still.forEach((id) => removing.current.delete(id));
        setFiles((all) => all.filter((file) => !still.includes(file.id)));
        setLeaving((now) => new Set([...now].filter((id) => !gone.includes(id))));
      },
      reduced.current ? 0 : ROW_OUT,
    );
    const lead = moving.length === 1 ? moving[0].file.name : plural(moving.length, 'file');
    showToast({
      lead: `Moved ${lead}`,
      rest: ` to ${folder.name}`,
      undo: { folder: folderId, items: moving, papers: papers.map((paper) => paper.id) },
    });
    announce(`Moved ${lead} to ${folder.name}.`);
    onMove?.(
      moving.map(({ file }) => file.name),
      folder.name,
      false,
    );
  };

  const undo = (move: Move) => {
    const folder = folders.find((each) => each.id === move.folder);
    setFolders((all) =>
      all.map((each) =>
        each.id === move.folder
          ? {
              ...each,
              count: each.count - move.items.length,
              papers: each.papers.filter((paper) => !move.papers.includes(paper.id)),
            }
          : each,
      ),
    );
    const back = move.items.map(({ file }) => file.id);
    back.forEach((id) => removing.current.delete(id));
    setLeaving((now) => new Set([...now].filter((id) => !back.includes(id))));
    setFiles((all) => {
      const next = [...all];
      for (const { file, index } of [...move.items].sort((a, b) => a.index - b.index)) {
        if (!next.some((each) => each.id === file.id))
          next.splice(Math.min(index, next.length), 0, file);
      }
      return next;
    });
    setEntering((now) => new Set([...now, ...back]));
    later(() => setEntering((now) => new Set([...now].filter((id) => !back.includes(id)))), ROW_IN);
    window.clearTimeout(toastTimer.current);
    setToast(null);
    const lead = move.items.length === 1 ? move.items[0].file.name : plural(back.length, 'files');
    announce(`${lead} back in General${folder ? `, out of ${folder.name}` : ''}.`);
    onMove?.(
      move.items.map(({ file }) => file.name),
      'General',
      true,
    );
  };

  // --- Uploads ------------------------------------------------------------------------------

  /** Plays an upload into a folder: the bar fills, then the new papers drop in. */
  const uploadInto = (
    folderId: string,
    items: { name: string; kind: Kind; hues?: readonly [number, number] }[],
  ) => {
    const folder = folders.find((each) => each.id === folderId);
    if (!folder || items.length === 0 || uploads[folderId]) return;
    const label = items.length === 1 ? items[0].name : plural(items.length, 'file');
    const started = performance.now();
    const time = reduced.current ? 300 : UPLOAD_TIME;
    announce(`Uploading ${label} to ${folder.name}.`);
    setUploads((all) => ({ ...all, [folderId]: { progress: 0, label } }));
    const tick = () => {
      const t = Math.min(1, (performance.now() - started) / time);
      // Fast at first, slowing near the end, as uploads look.
      const progress = 100 * (1 - (1 - t) ** 2);
      if (t < 1) {
        setUploads((all) => ({ ...all, [folderId]: { progress, label } }));
        later(tick, 50);
        return;
      }
      setUploads((all) => {
        const next = { ...all };
        delete next[folderId];
        return next;
      });
      addPapers(
        folderId,
        items.map((item) => paperFor(item.kind, item.name, item.hues)),
        items.length,
      );
      setDone(folderId);
      later(() => setDone((now) => (now === folderId ? null : now)), 1600);
      showToast({ lead: label, rest: ` added to ${folder.name}` });
      announce(`${label} added to ${folder.name}.`);
    };
    later(tick, 50);
  };

  /** Files picked with Upload land in General, at the top of the table. */
  const uploadHere = (picked: File[]) => {
    if (picked.length === 0) return;
    const added: FileItem[] = picked.map((file, index) => ({
      id: `up-${Date.now()}-${index}`,
      name: file.name,
      kind: kindOf(file.name),
      owner: 'you',
      size: formatSize(file.size),
    }));
    setFiles((all) => [...added, ...all]);
    const fresh = added.map((file) => file.id);
    setEntering((now) => new Set([...now, ...fresh]));
    later(
      () => setEntering((now) => new Set([...now].filter((id) => !fresh.includes(id)))),
      ROW_IN,
    );
    const label = added.length === 1 ? added[0].name : plural(added.length, 'file');
    showToast({ lead: label, rest: ' added to General' });
    announce(`${label} added to General.`);
  };

  // --- The drag -----------------------------------------------------------------------------

  /** A point on the page, in the stage's own px (the docs may draw it scaled). */
  const local = (clientX: number, clientY: number): Point => {
    const stage = root.current;
    if (!stage) return { x: clientX, y: clientY };
    const rect = stage.getBoundingClientRect();
    const scale = rect.width / stage.offsetWidth || 1;
    return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale };
  };
  const centreOf = (element: Element, dx = 0.5, dy = 0.5): Point => {
    const rect = element.getBoundingClientRect();
    return local(rect.left + rect.width * dx, rect.top + rect.height * dy);
  };

  const placeGhost = (at: Point, kind: Drag['kind']) => {
    const grab = GRAB[kind];
    ghostAt.current = { x: at.x - grab.x, y: at.y - grab.y };
    if (ghost.current)
      ghost.current.style.transform = `translate(${ghostAt.current.x}px, ${ghostAt.current.y}px)`;
  };

  const beginDrag = (next: Drag, at: Point) => {
    dragRef.current = next;
    setDrag(next);
    setMenu(false);
    placeGhost(at, next.kind);
    if (next.kind === 'files')
      announce(
        `Dragging ${next.ids.length === 1 ? next.name : plural(next.ids.length, 'file')}. Drop it on a folder, or press Escape.`,
      );
  };

  const setOverFolder = (id: string | null) => {
    if (overRef.current === id) return;
    overRef.current = id;
    setOver(id);
  };

  // The ghost mounts with the drag: put it where the drag starts before it paints. A still that
  // starts mid-drag hangs it over its folder.
  useLayoutEffect(() => {
    const tile = tiles.current.get(overRef.current ?? '');
    if (drag && tile && ghostAt.current.x === 0 && ghostAt.current.y === 0)
      placeGhost(centreOf(tile, 0.55, 0.42), drag.kind);
    if (drag && ghost.current)
      ghost.current.style.transform = `translate(${ghostAt.current.x}px, ${ghostAt.current.y}px)`;
    // centreOf and placeGhost only read refs and the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag]);

  const endDrag = () => {
    dragRef.current = null;
    overRef.current = null;
    setDrag(null);
    setOver(null);
  };

  /** The ghost flies to `to` and fades, then `then` runs. */
  const flyGhost = (to: Point, scale: number, ms: number, then: () => void) => {
    const element = ghost.current;
    if (!element || reduced.current) {
      then();
      return;
    }
    const from = ghostAt.current;
    const box = { w: element.offsetWidth, h: element.offsetHeight };
    const end = { x: to.x - box.w / 2, y: to.y - box.h / 2 };
    const animation = element.animate(
      [
        { transform: `translate(${from.x}px, ${from.y}px) scale(1)`, opacity: 1 },
        { transform: `translate(${end.x}px, ${end.y}px) scale(${scale})`, opacity: 0 },
      ],
      { duration: ms, easing: 'cubic-bezier(0.4, 0, 0.7, 1)', fill: 'forwards' },
    );
    animation.finished.then(
      () => {
        then();
        animation.cancel();
      },
      () => then(),
    );
  };

  const drop = () => {
    const current = dragRef.current;
    const target = folderOf(overRef.current);
    if (!current) return;
    if (!target) {
      cancelDrag();
      return;
    }
    // Onto a tile, the ghost flies into its picture; onto the tree, it fades where it is.
    const tile = overRef.current === target ? tiles.current.get(target) : null;
    const art = tile?.querySelector('[data-part="folder-art"]');
    const finish = () => {
      if (current.kind === 'files') moveFiles(current.ids, target);
      else uploadInto(target, [{ name: current.name, kind: 'image', hues: current.hues }]);
      endDrag();
    };
    if (art) flyGhost(centreOf(art, 0.5, 0.35), 0.35, INTO_FOLDER, finish);
    else {
      const from = ghostAt.current;
      const box = ghost.current;
      flyGhost(
        { x: from.x + (box?.offsetWidth ?? 0) / 2, y: from.y + (box?.offsetHeight ?? 0) / 2 },
        0.6,
        INTO_FOLDER,
        finish,
      );
    }
  };

  const cancelDrag = () => {
    const current = dragRef.current;
    if (!current) return;
    const row = current.kind === 'files' ? rows.current.get(current.ids[0]) : null;
    const name = row?.querySelector('[data-part="file-name"]');
    announce('Move cancelled.');
    if (name) {
      const rect = name.getBoundingClientRect();
      const box = ghost.current;
      const start = local(rect.left, rect.top + rect.height / 2);
      flyGhost(
        {
          x: start.x - 36 + (box?.offsetWidth ?? 0) / 2,
          y: start.y,
        },
        1,
        BACK_TO_ROW,
        endDrag,
      );
    } else endDrag();
  };

  const hitTest = (clientX: number, clientY: number) => {
    const element = document.elementFromPoint(clientX, clientY);
    const target = element?.closest<HTMLElement>('[data-drop]');
    return target && root.current?.contains(target) ? (target.dataset.drop ?? null) : null;
  };

  const release = () => {
    if (press.current) window.clearTimeout(press.current.hold);
    press.current = null;
  };

  // The reader's drag: pointer down on a row, then a few px of travel (or a held finger).
  const onWindowMove = useEffectEvent((event: PointerEvent) => {
    const pressed = press.current;
    if (!pressed || event.pointerId !== pressed.pointerId) return;
    if (!pressed.started) {
      const far = Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y);
      if (pressed.touch) {
        // A finger that moves before the hold is scrolling, not dragging.
        if (far > 8) release();
        return;
      }
      if (far < SLOP) return;
      startReaderDrag(event.clientX, event.clientY);
    }
    placeGhost(local(event.clientX, event.clientY), 'files');
    setOverFolder(hitTest(event.clientX, event.clientY));
  });
  const onWindowUp = useEffectEvent((event: PointerEvent) => {
    const pressed = press.current;
    if (!pressed || event.pointerId !== pressed.pointerId) return;
    const started = pressed.started;
    release();
    if (started) {
      if (event.type === 'pointercancel') cancelDrag();
      else drop();
    } else if (event.type === 'pointerup') toggle(pressed.id);
  });
  const onWindowKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === 'Escape' && dragRef.current) {
      event.preventDefault();
      release();
      cancelDrag();
    } else if (event.key === 'Escape' && narrow && drawer) {
      // Escape closes the drawer, wherever the focus is.
      setDrawer(false);
    }
  });
  // While dragging with a finger, the page must not scroll under it.
  const onTouchMove = useEffectEvent((event: TouchEvent) => {
    if (press.current?.started) event.preventDefault();
  });

  useEffect(() => {
    const move = (event: PointerEvent) => onWindowMove(event);
    const up = (event: PointerEvent) => onWindowUp(event);
    const key = (event: KeyboardEvent) => onWindowKey(event);
    const touch = (event: TouchEvent) => onTouchMove(event);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    window.addEventListener('keydown', key);
    window.addEventListener('touchmove', touch, { passive: false });
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      window.removeEventListener('keydown', key);
      window.removeEventListener('touchmove', touch);
    };
  }, []);

  const startReaderDrag = (clientX: number, clientY: number) => {
    const pressed = press.current;
    if (!pressed) return;
    const file = files.find((each) => each.id === pressed.id);
    if (!file) return;
    pressed.started = true;
    // A ticked row takes the other ticked rows with it.
    const group = selected.has(file.id)
      ? files.filter((each) => selected.has(each.id)).map((each) => each.id)
      : [file.id];
    beginDrag(
      { kind: 'files', ids: group, name: file.name, size: file.size, fileKind: file.kind },
      local(clientX, clientY),
    );
  };

  const onRowDown = useEffectEvent((event: PointerEvent) => {
    const row = (event.target as HTMLElement).closest<HTMLElement>('[data-file]');
    const id = row?.dataset.file;
    if (!id || event.button !== 0 || dragRef.current || removing.current.has(id)) return;
    if ((event.target as HTMLElement).closest('input, button')) return;
    const touch = event.pointerType === 'touch';
    release();
    press.current = {
      id,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      touch,
      hold: 0,
      started: false,
    };
    if (touch) {
      const { clientX, clientY } = event;
      press.current.hold = window.setTimeout(() => {
        startReaderDrag(clientX, clientY);
        if (press.current?.started) {
          placeGhost(local(clientX, clientY), 'files');
          navigator.vibrate?.(8);
        }
      }, HOLD);
    } else event.preventDefault();
  });

  // Files from the desktop: the tiles and the tree's folders take them as uploads.
  const onNativeOver = useEffectEvent((event: DragEvent) => {
    if (!event.dataTransfer?.types.includes('Files')) return;
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-drop]');
    setNative(true);
    if (target) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    } else event.dataTransfer.dropEffect = 'none';
    setOverFolder(target?.dataset.drop ?? null);
  });
  const onNativeLeave = useEffectEvent((event: DragEvent) => {
    if (!root.current?.contains(event.relatedTarget as Node | null)) {
      setNative(false);
      setOverFolder(null);
    }
  });
  const onNativeDrop = useEffectEvent((event: DragEvent) => {
    const target = folderOf(overRef.current);
    setNative(false);
    setOverFolder(null);
    if (!target || !event.dataTransfer?.files.length) return;
    event.preventDefault();
    take();
    uploadInto(
      target,
      [...event.dataTransfer.files].map((file) => ({ name: file.name, kind: kindOf(file.name) })),
    );
  });

  // Listened to natively: the rows' presses, files from the desktop, and the toast's hover and
  // focus (which hold it open).
  const onToastHold = useEffectEvent((hold: boolean) => {
    if (hold) window.clearTimeout(toastTimer.current);
    else if (toast) armToast();
  });
  useEffect(() => {
    const element = root.current;
    const list = rowsGroup.current;
    const slot = toastSlot.current;
    if (!element || !list || !slot) return;
    const down = (event: PointerEvent) => onRowDown(event);
    const over = (event: DragEvent) => onNativeOver(event);
    const leave = (event: DragEvent) => onNativeLeave(event);
    const dropped = (event: DragEvent) => onNativeDrop(event);
    const hold = () => onToastHold(true);
    const free = (event: Event) => {
      const next = (event as FocusEvent).relatedTarget as Node | null;
      if (event.type === 'focusout' && slot.contains(next)) return;
      onToastHold(false);
    };
    list.addEventListener('pointerdown', down);
    element.addEventListener('dragover', over);
    element.addEventListener('dragleave', leave);
    element.addEventListener('drop', dropped);
    slot.addEventListener('pointerenter', hold);
    slot.addEventListener('pointerleave', free);
    slot.addEventListener('focusin', hold);
    slot.addEventListener('focusout', free);
    return () => {
      list.removeEventListener('pointerdown', down);
      element.removeEventListener('dragover', over);
      element.removeEventListener('dragleave', leave);
      element.removeEventListener('drop', dropped);
      slot.removeEventListener('pointerenter', hold);
      slot.removeEventListener('pointerleave', free);
      slot.removeEventListener('focusin', hold);
      slot.removeEventListener('focusout', free);
    };
  }, [root]);

  // --- Selection and the bar ------------------------------------------------------------------

  /** Sets the ticks; the bar keeps the last count it showed while it slides away. */
  const choose = (next: ReadonlySet<string>) => {
    setSelected(next);
    if (next.size > 0) setBarCount(next.size);
  };
  const toggle = (id: string) => {
    if (removing.current.has(id)) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    choose(next);
  };
  const clearSelection = () => {
    setSelected(new Set());
    setMenu(false);
  };

  /** A header's press: that column ascending, then descending, then back to as added. */
  const sortBy = (by: 'name' | 'size') => {
    const next: Sort =
      sort?.by !== by
        ? { by, dir: 'ascending' }
        : sort.dir === 'ascending'
          ? { by, dir: 'descending' }
          : null;
    setSort(next);
    const column = by === 'name' ? 'name' : 'size';
    announce(
      next
        ? `Sorted by ${column}, ${next.dir === 'ascending' ? (by === 'name' ? 'A to Z' : 'smallest first') : by === 'name' ? 'Z to A' : 'largest first'}.`
        : 'Sorted as added.',
    );
  };
  const ariaSort = (by: 'name' | 'size') => (sort?.by === by ? sort.dir : 'none');

  const shown = sortFiles(
    files.filter((file) => file.name.toLowerCase().includes(query.trim().toLowerCase())),
    sort,
  );
  const selectedCount = files.filter((file) => selected.has(file.id)).length;
  const allShownSelected = shown.length > 0 && shown.every((file) => selected.has(file.id));
  /** General holds its loose files and everything in its folders. */
  const generalCount =
    files.length - leaving.size + folders.reduce((sum, folder) => sum + folder.count, 0);

  const menuOpen = menu && selectedCount > 0;

  // The menu closes on a press elsewhere, and takes the focus to its first folder as it opens.
  useEffect(() => {
    if (!menuOpen) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const onDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !moveButton.current?.contains(target))
        setMenu(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [menuOpen]);

  const onMenuKey = (event: ReactKeyboardEvent) => {
    const items = [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    const index = items.indexOf(document.activeElement as HTMLElement);
    const go = (next: number) => {
      event.preventDefault();
      items[(next + items.length) % items.length]?.focus();
    };
    if (event.key === 'ArrowDown') go(index + 1);
    else if (event.key === 'ArrowUp') go(index - 1);
    else if (event.key === 'Home') go(0);
    else if (event.key === 'End') go(items.length - 1);
    else if (event.key === 'Escape' || event.key === 'Tab') {
      if (event.key === 'Escape') event.preventDefault();
      setMenu(false);
      moveButton.current?.focus();
    }
  };

  const moveSelectedTo = (folderId: string) => {
    setMenu(false);
    const group = files.filter((file) => selected.has(file.id)).map((file) => file.id);
    moveFiles(group, folderId);
    // The bar goes with the selection: the focus waits on the table's select-all box.
    later(() => document.getElementById(`${ids}-all`)?.focus(), 0);
  };

  const copyLink = (what: string) => {
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
    showToast({ lead: `Link to ${what}`, rest: ' copied' });
    announce(`Link to ${what} copied.`);
  };

  // --- The demo -----------------------------------------------------------------------------

  const reset = () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current.clear();
    removing.current.clear();
    window.clearTimeout(toastTimer.current);
    endDrag();
    setFiles(lib.files);
    setFolders(lib.folders);
    setLeaving(new Set());
    setFresh(new Set());
    setSelected(new Set());
    setUploads({});
    setDone(null);
    setFlash(null);
    setToast(null);
    setMenu(false);
    setSort(null);
    setEntering(new Set(lib.files.map((file) => file.id)));
    later(() => setEntering(new Set()), ROW_IN);
  };

  const demoAct = useEffectEvent(
    (
      act:
        | { grab: string[]; at: Point }
        | { grabUpload: Point }
        | { flight: Flight; kind: Drag['kind'] }
        | { over: string | null }
        | { drop: true }
        | { toggle: string }
        | { reveal: string }
        | { reset: true }
        | { stop: true },
    ) => {
      if ('grab' in act) {
        const first = files.find((file) => file.id === act.grab[0]);
        if (!first) return;
        beginDrag(
          {
            kind: 'files',
            ids: act.grab,
            name: first.name,
            size: first.size,
            fileKind: first.kind,
          },
          act.at,
        );
      } else if ('grabUpload' in act) {
        beginDrag(
          {
            kind: 'upload',
            name: DEMO_UPLOAD.name,
            size: DEMO_UPLOAD.size,
            hues: [...DEMO_UPLOAD.hues],
          },
          act.grabUpload,
        );
      } else if ('flight' in act) {
        const element = ghost.current;
        const grab = GRAB[act.kind];
        const end = act.flight.points.at(-1);
        if (!element || !end) return;
        const at = (point: Point) => `translate(${point.x - grab.x}px, ${point.y - grab.y}px)`;
        placeGhost(end, act.kind);
        element.animate(
          act.flight.points.map((point) => ({ transform: at(point) })),
          act.flight.timing,
        );
      } else if ('over' in act) setOverFolder(act.over);
      else if ('drop' in act) drop();
      else if ('toggle' in act) toggle(act.toggle);
      else if ('reveal' in act) {
        // On a narrow library the tiles scroll sideways: bring the target into view.
        const tile = tiles.current.get(act.reveal);
        const list = strip.current;
        if (tile && list) {
          const left = tile.offsetLeft - list.offsetLeft;
          if (
            left < list.scrollLeft ||
            left + tile.offsetWidth > list.scrollLeft + list.clientWidth
          )
            list.scrollTo({ left: left - 16, behavior: 'smooth' });
        }
      } else if ('reset' in act) reset();
      else if (dragRef.current) endDrag();
    },
  );

  // The demo's script names the demo library's files and folders: it plays on that one only.
  const demo = autoplay && !libraryProp && defaultView === 'rest' && playing;
  useEffect(() => {
    const stage = root.current;
    const arrow = pointer.current;
    if (!demo || !stage || !arrow) return;
    const find = (selector: string) => stage.querySelector(selector);
    const local2 = (element: Element | null, dx = 0.5, dy = 0.5): Point => {
      if (!element) return { x: stage.offsetWidth / 2, y: stage.offsetHeight / 2 };
      const frame = stage.getBoundingClientRect();
      const scale = frame.width / stage.offsetWidth || 1;
      const rect = element.getBoundingClientRect();
      return {
        x: (rect.left + rect.width * dx - frame.left) / scale,
        y: (rect.top + rect.height * dy - frame.top) / scale,
      };
    };
    const nameOf = (id: string) => local2(find(`[data-file="${id}"] [data-part="file-name"]`), 0.6);
    const checkOf = (id: string) => local2(find(`[data-file="${id}"] [data-part="check"]`));
    const tileOf = (id: string) => local2(find(`[data-drop="${id}"] [data-part="folder-art"]`));
    const stop = runDemo(stage, arrow, async ({ wait, glide }) => {
      const carry = (to: Point, ms: number, kind: Drag['kind']) =>
        glide(to, ms, (flight) => demoAct({ flight, kind }));
      for (;;) {
        // One file into Contracts.
        await wait(700);
        await glide(nameOf('f1'), 900);
        await wait(300);
        demoAct({ grab: ['f1'], at: nameOf('f1') });
        await wait(200);
        demoAct({ reveal: 'contracts' });
        await wait(150);
        await carry(tileOf('contracts'), 1000, 'files');
        demoAct({ over: 'contracts' });
        await wait(650);
        demoAct({ drop: true });
        await wait(1500);
        // Three ticked, then dragged together.
        for (const id of ['f2', 'f3', 'f4']) {
          await glide(checkOf(id), id === 'f2' ? 700 : 320);
          await wait(140);
          demoAct({ toggle: id });
          await wait(260);
        }
        await wait(500);
        await glide(nameOf('f4'), 420);
        await wait(250);
        demoAct({ grab: ['f2', 'f3', 'f4'], at: nameOf('f4') });
        await wait(200);
        await carry(tileOf('contracts'), 1000, 'files');
        demoAct({ over: 'contracts' });
        await wait(600);
        demoAct({ drop: true });
        await wait(1500);
        // A picture from outside, into Brand Assets.
        demoAct({ reveal: 'brand' });
        const edge = { x: stage.offsetWidth + 30, y: tileOf('brand').y + 30 };
        await glide(edge, 700);
        demoAct({ grabUpload: edge });
        await carry(tileOf('brand'), 1100, 'upload');
        demoAct({ over: 'brand' });
        await wait(800);
        demoAct({ drop: true });
        await wait(3400);
        await glide({ x: stage.offsetWidth * 0.82, y: stage.offsetHeight * 0.85 }, 800);
        demoAct({ reset: true });
        await wait(1200);
      }
    });
    return () => {
      stop();
      demoAct({ stop: true });
    };
  }, [demo, root]);

  // --- Drawing ------------------------------------------------------------------------------

  const sidebarHidden = narrow ? !drawer : collapsed;
  const overDrop = drag?.kind === 'upload' || native ? 'upload' : 'move';
  const draggingIds = drag?.kind === 'files' ? drag.ids : [];

  const tree = (
    <ul className={styles.tree}>
      <li>
        <button
          type="button"
          className={styles.treeRow}
          data-current="true"
          aria-expanded={generalOpen}
          aria-controls={`${ids}-general`}
          onClick={() => setGeneralOpen((open) => !open)}
        >
          <Icon name={generalOpen ? 'folderOpen' : 'folder'} />
          <span className={styles.treeName}>General</span>
          <span className={styles.badge}>{generalCount}</span>
        </button>
        <ul id={`${ids}-general`} className={styles.subtree} hidden={!generalOpen}>
          {folders.map((folder) => (
            <li
              key={folder.id}
              className={styles.treeRow}
              data-sub="true"
              data-drop={`tree:${folder.id}`}
              data-over={over === `tree:${folder.id}` || undefined}
              data-flash={flash === folder.id || undefined}
            >
              <Icon name="folder" />
              <span className={styles.treeName}>{folder.name}</span>
              <span className={styles.badge}>{folder.count}</span>
            </li>
          ))}
        </ul>
      </li>
      {(lib.others ?? []).map((name) => (
        <li key={name} className={styles.treeRow}>
          <Icon name="folder" />
          <span className={styles.treeName}>{name}</span>
        </li>
      ))}
    </ul>
  );

  const sortHeader = (by: 'name' | 'size', label: string, className: string) => (
    <span className={className} role="columnheader" aria-sort={ariaSort(by)}>
      <button type="button" className={styles.sort} onClick={() => sortBy(by)}>
        {label}
        <Icon name="chevron" width="12" height="12" />
      </button>
    </span>
  );

  return (
    <div
      ref={root}
      className={`${styles.root} ${className}`}
      data-part="stage"
      data-color-scheme={colorScheme}
      data-dragging={drag ? drag.kind : undefined}
      data-selecting={selectedCount > 0 || undefined}
      onPointerDownCapture={take}
      onKeyDownCapture={take}
      onWheelCapture={take}
      onPointerMove={(event) => {
        if (event.pointerType !== 'touch') take();
      }}
    >
      <div className={styles.window} data-part="window">
        <header className={styles.topbar}>
          <span className={styles.logo} aria-hidden="true">
            <Icon name="mark" />
          </span>
          <span className={styles.workspace}>
            <i className={styles.workspaceSquare} aria-hidden="true" />
            {lib.workspace}
            <Icon name="updown" width="12" height="12" />
          </span>
        </header>

        <div className={styles.body}>
          <nav className={styles.rail} aria-label="Sections">
            {(['home', 'folder', 'clock', 'people', 'trash'] as const).map((name) => (
              <span
                key={name}
                className={styles.railIcon}
                data-current={name === 'folder' || undefined}
                aria-hidden="true"
              >
                <Icon name={name} />
              </span>
            ))}
          </nav>

          {narrow && drawer && (
            <button
              type="button"
              className={styles.scrim}
              aria-label="Close sidebar"
              onClick={() => setDrawer(false)}
            />
          )}
          <aside
            id={`${ids}-side`}
            className={styles.sidebar}
            data-part="sidebar"
            data-hidden={sidebarHidden || undefined}
            data-drawer={(narrow && drawer) || undefined}
            inert={sidebarHidden}
            aria-label="Library"
          >
            <div className={styles.sideHead}>
              <h2 className={styles.sideTitle}>Library</h2>
              <span className={styles.sideTools}>
                <span className={styles.ghostButton} aria-hidden="true">
                  <Icon name="plus" />
                </span>
                <button
                  type="button"
                  className={styles.ghostButton}
                  aria-label="Hide sidebar"
                  aria-controls={`${ids}-side`}
                  aria-expanded="true"
                  onClick={() => (narrow ? setDrawer(false) : setCollapsed(true))}
                >
                  <Icon name="panel" />
                </button>
              </span>
            </div>
            <label className={styles.search}>
              <Icon name="search" width="14" height="14" />
              <input
                type="search"
                placeholder="Search"
                aria-label="Search files"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <kbd aria-hidden="true">⌘K</kbd>
            </label>
            <div className={styles.segmented} role="tablist" aria-label="Show">
              {(['folders', 'shared'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={tab === value}
                  className={styles.segment}
                  onClick={() => setTab(value)}
                >
                  {value === 'folders' ? 'Folders' : 'Shared'}
                </button>
              ))}
            </div>
            {tab === 'folders' ? (
              tree
            ) : (
              <ul className={styles.tree}>
                {(lib.shared ?? []).map((folder) => (
                  <li key={folder.name} className={styles.treeRow}>
                    <Icon name="people" />
                    <span className={styles.treeName}>{folder.name}</span>
                    <span className={styles.badge}>{folder.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <main className={styles.main} data-part="main">
            <div className={styles.mainHead}>
              {sidebarHidden && (
                <button
                  type="button"
                  className={styles.ghostButton}
                  aria-label="Show sidebar"
                  aria-controls={`${ids}-side`}
                  aria-expanded="false"
                  onClick={() => (narrow ? setDrawer(true) : setCollapsed(false))}
                >
                  <Icon name="panel" />
                </button>
              )}
              <nav className={styles.crumbs} aria-label="Breadcrumb">
                <span className={styles.crumbRoot}>Library</span>
                <span className={styles.crumbSlash} aria-hidden="true">
                  /
                </span>
                <span aria-current="page" className={styles.crumbHere}>
                  General
                  <Icon name="chevron" width="12" height="12" />
                </span>
              </nav>
              <span className={styles.headTools}>
                <span
                  className={styles.people}
                  aria-label={plural(headMembers.length, 'member')}
                  role="img"
                >
                  {headMembers.map((id) => (
                    <Avatar key={id} person={personOf(id)} className={styles.headAvatar} />
                  ))}
                </span>
                <button type="button" className={styles.button} onClick={() => copyLink('General')}>
                  <Icon name="link" width="14" height="14" />
                  <span className={styles.buttonText}>Share</span>
                </button>
                <button
                  type="button"
                  className={styles.primary}
                  data-part="upload"
                  onClick={() => fileInput.current?.click()}
                >
                  <Icon name="upload" width="14" height="14" />
                  Upload
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  multiple
                  hidden
                  onChange={(event) => {
                    uploadHere([...(event.target.files ?? [])]);
                    event.target.value = '';
                  }}
                />
              </span>
            </div>

            <div
              ref={toastSlot}
              className={styles.toastSlot}
              aria-hidden={toast ? undefined : true}
            >
              {toast && (
                <div key={toast.id} className={styles.toast} data-part="toast">
                  <span className={styles.toastCheck} aria-hidden="true">
                    <Icon name="check" width="10" height="10" strokeWidth="2.2" />
                  </span>
                  <span className={styles.toastText}>
                    <b>{toast.lead}</b>
                    {toast.rest}
                  </span>
                  {toast.undo && (
                    <button
                      type="button"
                      className={styles.toastUndo}
                      onClick={() => toast.undo && undo(toast.undo)}
                    >
                      Undo
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className={styles.scroll}>
              <section className={styles.section} aria-labelledby={`${ids}-folders`}>
                <h3 id={`${ids}-folders`} className={styles.heading}>
                  Folders <span className={styles.headingCount}>{folders.length}</span>
                </h3>
                <ul ref={strip} className={styles.tiles} data-part="folders">
                  {folders.map((folder) => {
                    const uploading = uploads[folder.id];
                    return (
                      <li
                        key={folder.id}
                        ref={(element) => {
                          if (element) tiles.current.set(folder.id, element);
                          else tiles.current.delete(folder.id);
                        }}
                        className={styles.tile}
                        data-part="folder"
                        data-drop={folder.id}
                        data-over={over === folder.id ? overDrop : undefined}
                        data-flash={flash === folder.id || undefined}
                        aria-label={`${folder.name}, ${filesLabel(folder, uploading)}${folder.private ? ', private' : ''}`}
                      >
                        <FolderArt
                          folder={folder}
                          people={lib.people}
                          fresh={fresh}
                          progress={uploading ? uploading.progress : null}
                          done={done === folder.id}
                        />
                        <span className={styles.tileName} aria-hidden="true">
                          {folder.name}
                        </span>
                        <span className={styles.tileCount} aria-hidden="true">
                          {filesLabel(folder, uploading)}
                        </span>
                        <span className={styles.uploadPill} aria-hidden="true">
                          <Icon name="upload" width="12" height="12" />
                          Upload to {folder.name}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section className={styles.section} aria-labelledby={`${ids}-files`}>
                <h3 id={`${ids}-files`} className={styles.heading}>
                  Files <span className={styles.headingCount}>{files.length - leaving.size}</span>
                </h3>
                <div className={styles.table} role="table" aria-labelledby={`${ids}-files`}>
                  <div className={styles.tableHead} role="rowgroup">
                    <div className={styles.row} role="row">
                      <span className={styles.cellCheck} role="columnheader">
                        <input
                          id={`${ids}-all`}
                          type="checkbox"
                          className={styles.check}
                          aria-label="Select all files"
                          checked={allShownSelected}
                          disabled={shown.length === 0}
                          onChange={() =>
                            choose(
                              allShownSelected ? new Set() : new Set(shown.map((file) => file.id)),
                            )
                          }
                        />
                      </span>
                      {sortHeader('name', 'Name', styles.cellName)}
                      <span className={styles.cellOwner} role="columnheader">
                        Added by
                      </span>
                      {sortHeader('size', 'Size', styles.cellSize)}
                    </div>
                  </div>
                  <div ref={rowsGroup} role="rowgroup" data-part="files">
                    {shown.map((file) => (
                      <div
                        key={file.id}
                        ref={(element) => {
                          if (element) rows.current.set(file.id, element);
                          else rows.current.delete(file.id);
                        }}
                        className={styles.rowWrap}
                        data-file={file.id}
                        data-leaving={leaving.has(file.id) || undefined}
                        data-entering={entering.has(file.id) || undefined}
                      >
                        <div
                          className={styles.row}
                          role="row"
                          data-part="file-row"
                          data-selected={selected.has(file.id) || undefined}
                          data-dragged={draggingIds.includes(file.id) || undefined}
                        >
                          <span className={styles.cellCheck} role="cell">
                            <input
                              type="checkbox"
                              className={styles.check}
                              data-part="check"
                              aria-label={`Select ${file.name}`}
                              checked={selected.has(file.id)}
                              onChange={() => toggle(file.id)}
                            />
                          </span>
                          <span className={styles.cellName} role="cell">
                            <span
                              className={styles.fileIcon}
                              data-kind={file.kind}
                              aria-hidden="true"
                            >
                              <Icon name="file" width="13" height="13" />
                              <i />
                            </span>
                            <span className={styles.fileName} data-part="file-name">
                              {file.name}
                            </span>
                          </span>
                          <span className={styles.cellOwner} role="cell">
                            <Avatar person={personOf(file.owner)} className={styles.ownerAvatar} />
                            <span className={styles.ownerName}>{personOf(file.owner).name}</span>
                          </span>
                          <span className={styles.cellSize} role="cell">
                            {file.size}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {shown.length === 0 && (
                  <p className={styles.empty}>
                    {query
                      ? `No files match “${query.trim()}”.`
                      : 'Every file here is in a folder.'}
                  </p>
                )}
              </section>

              <div className={styles.barSlot}>
                <div
                  className={styles.bar}
                  data-part="selection-bar"
                  data-shown={selectedCount > 0 || undefined}
                  inert={selectedCount === 0}
                  role="toolbar"
                  aria-label="Selected files"
                >
                  <span className={styles.barCount} aria-live="polite">
                    {barCount} selected
                  </span>
                  <span className={styles.barMenuWrap}>
                    <button
                      ref={moveButton}
                      type="button"
                      className={styles.primary}
                      aria-haspopup="menu"
                      aria-expanded={menuOpen}
                      aria-controls={`${ids}-menu`}
                      onClick={() => setMenu((open) => !open)}
                    >
                      <Icon name="move" width="14" height="14" />
                      Move to
                    </button>
                    {menuOpen && (
                      <div
                        ref={menuRef}
                        id={`${ids}-menu`}
                        className={styles.menu}
                        role="menu"
                        tabIndex={-1}
                        aria-label="Move to folder"
                        onKeyDown={onMenuKey}
                      >
                        {folders.map((folder) => (
                          <button
                            key={folder.id}
                            type="button"
                            role="menuitem"
                            tabIndex={-1}
                            className={styles.menuItem}
                            onClick={() => moveSelectedTo(folder.id)}
                          >
                            <Icon name="folder" width="14" height="14" />
                            <span>{folder.name}</span>
                            <span className={styles.menuCount}>{folder.count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </span>
                  <button
                    type="button"
                    className={styles.barButton}
                    onClick={() => copyLink(plural(selectedCount, 'file'))}
                  >
                    <Icon name="link" width="14" height="14" />
                    Share
                  </button>
                  <i className={styles.barDivider} aria-hidden="true" />
                  <button
                    type="button"
                    className={styles.barClose}
                    aria-label="Clear selection"
                    onClick={clearSelection}
                  >
                    <Icon name="close" width="14" height="14" />
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <div className={styles.ghostLayer} aria-hidden="true">
        {drag && (
          <div ref={ghost} className={styles.ghost} data-kind={drag.kind} data-part="ghost">
            {drag.kind === 'files' ? (
              <span
                className={styles.ghostTilt}
                data-stack={Math.min(drag.ids.length, 3)}
                style={{ '--count': drag.ids.length } as CSSProperties}
              >
                {drag.ids.length > 1 && <i className={styles.ghostBehind} />}
                {drag.ids.length > 2 && <i className={styles.ghostBehind} />}
                <span className={styles.ghostChip}>
                  <span className={styles.fileIcon} data-kind={drag.fileKind}>
                    <Icon name="file" width="13" height="13" />
                    <i />
                  </span>
                  <span className={styles.ghostName}>{drag.name}</span>
                  <span className={styles.ghostSize}>{drag.size}</span>
                </span>
                {drag.ids.length > 1 && (
                  <span className={styles.ghostCount}>{drag.ids.length}</span>
                )}
              </span>
            ) : (
              <span className={styles.ghostTilt}>
                <span
                  className={styles.ghostPicture}
                  style={{ '--h1': drag.hues[0], '--h2': drag.hues[1] } as CSSProperties}
                >
                  <span className={styles.ghostPlus}>
                    <Icon name="plus" width="10" height="10" strokeWidth="2.2" />
                  </span>
                  <i />
                  <span className={styles.ghostCaption}>
                    <span>{drag.name}</span>
                    <span>{drag.size}</span>
                  </span>
                </span>
              </span>
            )}
          </div>
        )}
      </div>

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
