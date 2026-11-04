"use client";

import { BotAvatar } from "@/components/lab/bot-avatars/bot-avatar";

/** The live thumbnail each experiment shows on its card. Decorative: the card names it. */
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
  return null;
}
