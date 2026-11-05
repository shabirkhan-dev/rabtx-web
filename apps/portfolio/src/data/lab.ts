/**
 * The Lab: small, self-contained experiments — interface studies, rendering tricks and components
 * built to learn something. Each one has its own page at /lab/<slug>, and a live preview on the
 * home page and the Lab index (`src/components/lab/lab-preview.tsx`).
 *
 * Each page shows the demo, my own take on it (`remix`), and every source file, read from
 * `src/components/lab/<slug>/` at build time so visitors can copy them.
 *
 * To add one: put its code in `src/components/lab/<slug>/`, its page in `src/app/lab/<slug>/`,
 * a preview in `lab-preview.tsx`, and an entry here (newest first).
 */
export type Experiment = {
  slug: string;
  name: string;
  /** One line for the card. */
  summary: string;
  /** A short paragraph for the experiment's page. */
  description: string;
  tags: string[];
  /** Month and year, as shown on the card. */
  date: string;
  /** Where the idea or the original code comes from, when it isn't mine alone. */
  credit?: { name: string; href: string; license: string };
  /** One short line on how to play with the demo. */
  hint?: string;
  /** The source files, in reading order, from `src/components/lab/<slug>/`. */
  files: string[];
  /** A command that installs the original. */
  install?: string;
  /** The smallest use of it. */
  usage: string;
  /** What this site's copy changes from the original. */
  changes?: string[];
  /** My own piece built on it, shown under the demo. */
  remix?: { title: string; note: string };
};

const BRUNO = "Bruno Delorence";

export const experiments: Experiment[] = [
  {
    slug: "file-library",
    name: "File library",
    summary: "Drag a file row onto a folder, and the folder opens to take it",
    description:
      "A team's file library: a folder tree, a row of folder tiles and a table of loose files. Drag a row onto a folder and a tilted chip follows the pointer; the folder lights up, its frosted front tips forward and the papers inside rise. Drop it and the chip shrinks into the folder, a new paper drops in as its cover, the row folds away and a toast says what moved, with Undo. Tick rows to drag a stack, or use Move to; files from the desktop upload with a bar on the folder's front.",
    tags: ["React", "Drag and drop", "Motion", "Accessibility"],
    date: "Nov 2026",
    credit: { name: BRUNO, href: "https://brunodelorence.com/components/file-library", license: "MIT" },
    hint: "Drag a row onto a folder, tick a few to move a stack, or drop a file from your desktop.",
    files: [
      "file-library.tsx",
      "file-library.module.css",
      "folder-art.tsx",
      "data.ts",
      "icons.tsx",
      "demo-pointer.tsx",
      "use-autoplay.ts",
    ],
    install: "npx shadcn@latest add https://brunodelorence.com/r/file-library.json",
    usage: `import { FileLibrary } from './file-library';
import type { Library } from './data';

const library: Library = {
  workspace: 'Acme',
  people: { ana: { id: 'ana', name: 'Ana Ruiz', initials: 'AR', color: '#f6d47e' } },
  folders: [{ id: 'specs', name: 'Specs', count: 0, members: ['ana'], papers: [] }],
  files: [{ id: 'a1', name: 'Brief.pdf', kind: 'pdf', owner: 'ana', size: '1.2 MB' }],
};

export function TeamFiles() {
  return (
    <FileLibrary
      library={library}
      onMove={(files, folder) => console.log(\`\${files.length} → \${folder}\`)}
    />
  );
}`,
    changes: [
      "A library prop: the workspace, people, folders and files are data you pass in, not constants in the code (the demo's Halden Studio stays the default)",
      "Sortable Name and Size columns: A to Z, Z to A, then back to as added, with aria-sort and an announcement",
      "General's count is counted from the files and folders, so uploads raise it (it was a fixed 34)",
      "People can carry their own colour, so a library can draw any team, agents included",
    ],
    remix: {
      title: "What a Grid project leaves behind",
      note: "The same component with Grid's data, through the library prop I added: people and AI agents both add files, sorted into specs, PR diffs, agent runs and releases. Try sorting by size, then drag the run logs into Agent runs.",
    },
  },
  {
    slug: "burn-delete",
    name: "Burn delete",
    summary: "Hold to delete your account, and the page burns away from the button",
    description:
      "A white page asks to delete your account over a dark pill. Held down, the pill fills with heat; let go early and it drains back. Held to the end, the page catches fire from the pill: a hole with a white-hot rim spreads out, flames climb its lower edge and charred flakes fly off, until a black sign-in screen with drifting embers is left. Restore my account burns it the other way.",
    tags: ["WebGL", "Shaders", "Canvas 2D", "Accessibility"],
    date: "Nov 2026",
    credit: { name: BRUNO, href: "https://brunodelorence.com/components/burn-delete", license: "MIT" },
    hint: "Hold the pill, or Space, until it burns; Restore my account brings it back.",
    files: [
      "burn-delete.tsx",
      "burn-delete.module.css",
      "burn-gl.ts",
      "flakes.ts",
      "demo-pointer.tsx",
      "use-autoplay.ts",
    ],
    install: "npx shadcn@latest add https://brunodelorence.com/r/burn-delete.json",
    usage: `import { BurnDelete } from './burn-delete';

export function DeleteAccount() {
  return (
    <BurnDelete
      name="Ines Navarro"
      onDelete={() => scheduleDeletion()}
      onRestore={() => cancelDeletion()}
      autoplay={false}
    />
  );
}`,
    changes: [
      "title and lead props, so the page can ask about any account, not only the demo's",
      "A flame prop: the original pink and indigo fire, or ember, a classic orange one I added to the shader",
    ],
    remix: {
      title: "Delete a Grid workspace",
      note: "The same hold, asking about a workspace in Grid, with numbers that say what goes, and an orange fire I mixed into the shader for a warmer, more literal burn.",
    },
  },
  {
    slug: "effort-slider",
    name: "Effort slider",
    summary: "A stepped slider for how hard a model thinks, whose last step becomes a night sky",
    description:
      "A small card for choosing effort, from Faster to Smarter in named steps. The thumb is a pink brain that glides from stop to stop while the track fills pink to violet, and the step's name changes letter by letter. On the last step the brain flashes blue-violet, rays of specks shoot out and the track becomes a twinkling mosaic. Four more themes swap the picture: a galaxy that collapses into a black hole, a race car, a rocket and a jet.",
    tags: ["React", "SVG", "Canvas 2D", "Accessibility"],
    date: "Nov 2026",
    credit: { name: BRUNO, href: "https://brunodelorence.com/components/effort-slider", license: "MIT" },
    hint: "Drag the track or use the arrow keys; each demo hands over at your first touch.",
    files: [
      "effort-slider.tsx",
      "effort-slider.module.css",
      "brain.tsx",
      "galaxy.ts",
      "themes.ts",
      "themes.module.css",
      "payoff.ts",
      "spiral.tsx",
      "hole.ts",
      "car.tsx",
      "overtake.ts",
      "missile.tsx",
      "launch.ts",
      "jet.tsx",
      "sonic.ts",
      "use-autoplay.ts",
    ],
    install: "npx shadcn@latest add https://brunodelorence.com/r/effort-slider.json",
    usage: `import { useState } from 'react';
import { EffortSlider } from './effort-slider';

export function ModelSettings() {
  const [effort, setEffort] = useState(1);
  return (
    <EffortSlider
      value={effort}
      onChange={(index) => setEffort(index)}
      recommended={1}
      autoplay={false}
    />
  );
}`,
    changes: ["Step names with a space (White hole, Mach 1) keep it: the letters' spaces are non-breaking"],
    remix: {
      title: "Run settings for a Grid agent",
      note: "The slider as a real control: each step's thinking budget, time and cost are written beside it, and Run plays the task out, sped up, so the trade is felt as well as read.",
    },
  },
  {
    slug: "bot-avatars",
    name: "Bot avatars",
    summary: "Plush 3D faces for AI agents, drawn by a tiny software renderer on a 2D canvas",
    description:
      "Eighteen soft bodies, each inflated from a flat outline, furred, lit and given two painted eyes. They look around and follow the pointer, blink, hop on a beat while they work and doze off when they sleep, with no WebGL: a depth buffer, a few thousand fur strands and a spring for every motion, all on a plain canvas.",
    tags: ["Canvas 2D", "Rendering", "React", "Motion"],
    date: "Nov 2026",
    credit: { name: BRUNO, href: "https://brunodelorence.com/components/bot-avatars", license: "MIT" },
    hint: "Poke one, or move the pointer around them.",
    files: [
      "bot-avatar.tsx",
      "bot-avatars.tsx",
      "bot-avatars.module.css",
      "brain.ts",
      "render.ts",
      "mesh.ts",
      "shapes.ts",
      "use-autoplay.ts",
    ],
    install: "npx shadcn@latest add https://brunodelorence.com/r/bot-avatars.json",
    usage: `import { BotAvatar } from './bot-avatar';

export function AgentRow({ busy }: { busy: boolean }) {
  return (
    <li>
      <BotAvatar type="flower" size={36} state={busy ? 'working' : 'idle'} label="Research aide" />
      Research aide
    </li>
  );
}`,
    changes: [
      "On narrow screens the playground's options open as a sidebar over the stage (Customize), instead of a long column under it",
    ],
    remix: {
      title: "Agents on a Grid project",
      note: "Four agents, each with a body of its own, working through a task queue: assign one, wake the night runner, and watch each mood follow its real state, said in words beside it and in the activity log.",
    },
  },
];

export function getExperiment(slug: string) {
  return experiments.find((e) => e.slug === slug);
}
