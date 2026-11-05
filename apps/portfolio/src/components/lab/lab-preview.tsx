"use client";

import { BotAvatar } from "@/components/lab/bot-avatars/bot-avatar";
import { EffortSlider } from "@/components/lab/effort-slider/effort-slider";

/**
 * The live thumbnail each experiment shows on its card. Decorative and inert: the card is a link,
 * so nothing inside it takes focus or a press, and the card names the experiment.
 */
export function LabPreview({ slug }: { slug: string }) {
  if (slug === "bot-avatars") {
    return (
      <div className="flex items-end gap-5 pt-4" aria-hidden="true">
        <BotAvatar type="clover" size={56} seed={3} interactive={false} />
        <BotAvatar type="flower" size={56} seed={4} state="working" interactive={false} />
        <BotAvatar type="ghost" size={56} seed={5} state="sleeping" interactive={false} />
      </div>
    );
  }
  if (slug === "effort-slider") {
    return (
      <div className="pointer-events-none h-full w-full" aria-hidden="true" inert>
        {/* The stage's own frame is dropped: the card around it is the frame. */}
        <EffortSlider
          help=""
          className="h-full! min-h-0! rounded-none! bg-transparent! shadow-none! [aspect-ratio:auto]!"
        />
      </div>
    );
  }
  return null;
}
