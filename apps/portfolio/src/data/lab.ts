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
};

export const experiments: Experiment[] = [
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
  },
];

export function getExperiment(slug: string) {
  return experiments.find((e) => e.slug === slug);
}
