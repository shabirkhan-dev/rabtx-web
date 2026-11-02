import { profile } from "@/data/profile";
import { ogCard, ogSize } from "@/lib/og-card";

export const alt = `${profile.name}, ${profile.role}`;
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    title: "Building web and mobile products end to end",
    subtitle: profile.location,
  });
}
