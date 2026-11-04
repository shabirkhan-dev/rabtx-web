/**
 * The Lab: small, self-contained experiments — interface studies, rendering tricks and components
 * built to learn something. Each one has its own page at /lab/<slug>, and a live preview on the
 * home page and the Lab index (`src/components/lab/lab-preview.tsx`).
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
};

export const experiments: Experiment[] = [
  {
    slug: "effort-slider",
    name: "Effort slider",
    summary: "A stepped slider for how hard a model thinks, whose last step becomes a night sky",
    description:
      "A small card for choosing effort, from Faster to Smarter in named steps. The thumb is a pink brain that glides from stop to stop while the track fills pink to violet, and the step's name changes letter by letter. On the last step the brain flashes blue-violet, rays of specks shoot out and the track becomes a twinkling mosaic. Four more themes swap the picture: a galaxy that collapses into a black hole, a race car, a rocket and a jet.",
    tags: ["React", "SVG", "Canvas 2D", "Accessibility"],
    date: "Nov 2026",
    credit: {
      name: "Bruno Delorence",
      href: "https://brunodelorence.com/components/effort-slider",
      license: "MIT",
    },
    hint: "Drag the track or use the arrow keys; each demo hands over at your first touch.",
  },
  {
    slug: "bot-avatars",
    name: "Bot avatars",
    summary: "Plush 3D faces for AI agents, drawn by a tiny software renderer on a 2D canvas",
    description:
      "Eighteen soft bodies, each inflated from a flat outline, furred, lit and given two painted eyes. They look around and follow the pointer, blink, hop on a beat while they work and doze off when they sleep, with no WebGL: a depth buffer, a few thousand fur strands and a spring for every motion, all on a plain canvas.",
    tags: ["Canvas 2D", "Rendering", "React", "Motion"],
    date: "Nov 2026",
    credit: {
      name: "Bruno Delorence",
      href: "https://brunodelorence.com/components/bot-avatars",
      license: "MIT",
    },
    hint: "Poke one, or move the pointer around them.",
  },
];

export function getExperiment(slug: string) {
  return experiments.find((e) => e.slug === slug);
}
