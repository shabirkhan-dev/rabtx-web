// Copyright (c) 2026 Bruno Delorence. MIT License.
// Changed for rabtx: the contents are one `Library` value the component takes as a prop, with
// this demo library as its default; people can carry their own colour; and sizes can be read
// back as bytes, for sorting.

/*
 * The library's starting contents: the people, the folders under General with the papers that
 * peek out of each, and the nine files loose in General. Counts add up: General's 34 is its four
 * folders (12 + 8 + 0 + 5) and its nine files, so a move between them leaves it unchanged.
 */

export type PersonId = string;
/** `color`, a CSS colour, paints the face; without it the stylesheet picks one by id. */
export type Person = { id: PersonId; name: string; initials: string; color?: string };

export const PEOPLE: Record<PersonId, Person> = {
  mc: { id: 'mc', name: 'Maya Chen', initials: 'MC' },
  aw: { id: 'aw', name: 'Arno Weiss', initials: 'AW' },
  kd: { id: 'kd', name: 'Kai Doyle', initials: 'KD' },
  sl: { id: 'sl', name: 'Sara Lind', initials: 'SL' },
  you: { id: 'you', name: 'You', initials: 'YO' },
};

/** A file's type: its badge colour in the table and the square on its paper in a folder. */
export type Kind = 'pdf' | 'doc' | 'sheet' | 'slides' | 'image';

export type FileItem = {
  id: string;
  name: string;
  kind: Kind;
  owner: PersonId;
  size: string;
};

/**
 * A sheet that peeks out of a folder: a white page with a coloured square for a document, a
 * gradient card for a picture (its two hues).
 */
export type Paper = { id: string; kind: Kind; hues?: [number, number] };

export type Folder = {
  id: string;
  name: string;
  count: number;
  members: PersonId[];
  private?: boolean;
  /** Back to front: the last one is the cover, in front of the others. */
  papers: Paper[];
};

export const FOLDERS: Folder[] = [
  {
    id: 'onboarding',
    name: 'Onboarding',
    count: 12,
    members: ['mc', 'aw', 'kd'],
    papers: [
      { id: 'on-1', kind: 'doc' },
      { id: 'on-2', kind: 'pdf' },
      { id: 'on-3', kind: 'doc' },
    ],
  },
  {
    id: 'brand',
    name: 'Brand Assets',
    count: 8,
    members: ['sl', 'mc'],
    papers: [
      { id: 'br-1', kind: 'image', hues: [221, 232] },
      { id: 'br-2', kind: 'image', hues: [18, 34] },
    ],
  },
  { id: 'contracts', name: 'Contracts', count: 0, members: [], private: true, papers: [] },
  {
    id: 'research',
    name: 'Research',
    count: 5,
    members: ['kd', 'sl'],
    papers: [
      { id: 're-1', kind: 'sheet' },
      { id: 're-2', kind: 'doc' },
    ],
  },
];

/** The folders that sit beside General in the tree, outside this view. */
export const OTHER_FOLDERS = ['Design Reviews', 'Team Interviews'];
/** What the Shared tab lists: folders other teams shared with this one. */
export const SHARED_FOLDERS = [
  { name: 'Client Handoff', count: 6 },
  { name: 'Press Kit', count: 14 },
];

export const FILES: FileItem[] = [
  { id: 'f1', name: 'Pitch-Deck-v4.pdf', kind: 'pdf', owner: 'mc', size: '4.2 MB' },
  { id: 'f2', name: 'NDA-Halden.pdf', kind: 'pdf', owner: 'aw', size: '380 KB' },
  { id: 'f3', name: 'Vendor-Agreement.docx', kind: 'doc', owner: 'kd', size: '96 KB' },
  { id: 'f4', name: 'SOW-Q4-Final.pdf', kind: 'pdf', owner: 'mc', size: '1.1 MB' },
  { id: 'f5', name: 'Hiring-Plan-2027.xlsx', kind: 'sheet', owner: 'sl', size: '220 KB' },
  { id: 'f6', name: 'Offsite-Agenda.pptx', kind: 'slides', owner: 'aw', size: '12 MB' },
  { id: 'f7', name: 'Logo-Usage.pdf', kind: 'pdf', owner: 'kd', size: '2.8 MB' },
  { id: 'f8', name: 'Roadmap-H1.pdf', kind: 'pdf', owner: 'sl', size: '640 KB' },
  { id: 'f9', name: 'Interview-Notes.docx', kind: 'doc', owner: 'mc', size: '54 KB' },
];

/** Everything a library shows: its workspace, its people, General's folders and loose files. */
export type Library = {
  workspace: string;
  people: Record<PersonId, Person>;
  /** Who shows in the header beside Share: the first three people unless set. */
  members?: PersonId[];
  folders: Folder[];
  files: FileItem[];
  /** The folders beside General in the tree, and what the Shared tab lists. */
  others?: string[];
  shared?: { name: string; count: number }[];
};

/** The demo library: Halden Studio's General folder. The autoplay demo plays only on this one. */
export const DEFAULT_LIBRARY: Library = {
  workspace: 'Halden Studio',
  people: PEOPLE,
  members: ['mc', 'aw', 'kd'],
  folders: FOLDERS,
  files: FILES,
  others: OTHER_FOLDERS,
  shared: SHARED_FOLDERS,
};

/** The picture the demo drops in from outside, onto Brand Assets. */
export const DEMO_UPLOAD = { name: 'moodboard-07.png', size: '2.4 MB', hues: [268, 322] } as const;

/** A file's type from its name, for files the reader drops or picks. */
export function kindOf(name: string): Kind {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'heic', 'svg'].includes(ext)) return 'image';
  if (['xls', 'xlsx', 'csv', 'numbers'].includes(ext)) return 'sheet';
  if (['ppt', 'pptx', 'key'].includes(ext)) return 'slides';
  if (ext === 'pdf') return 'pdf';
  return 'doc';
}

/** Two hues for a picture's card, from its name, so the same file always looks the same. */
export function huesOf(name: string): [number, number] {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const first = hash % 360;
  return [first, (first + 40 + (hash % 50)) % 360];
}

/** Bytes in the units the table uses. */
export function formatSize(bytes: number) {
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1e3))} KB`;
}

/** The table's size back as bytes, for sorting: "4.2 MB" → 4 200 000. */
export function bytesOf(size: string) {
  const match = size.trim().match(/^([\d.]+)\s*(KB|MB|GB|B)?$/i);
  if (!match) return 0;
  const scale = { b: 1, kb: 1e3, mb: 1e6, gb: 1e9 }[(match[2] ?? 'b').toLowerCase()] ?? 1;
  return Number(match[1]) * scale;
}
