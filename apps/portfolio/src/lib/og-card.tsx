import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { profile, siteUrl } from "@/data/profile";

export const ogSize = { width: 1200, height: 630 };

/** The link-preview card: the site's dark colours, the avatar, a headline and a footer line. */
export async function ogCard({ title, subtitle }: { title: string; subtitle: string }) {
  const avatar = await readFile(path.join(process.cwd(), "public", "avatar.png"));
  const avatarSrc = `data:image/png;base64,${avatar.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#0d0d0c",
          color: "#f0efeb",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- rendered by ImageResponse */}
          <img src={avatarSrc} width={96} height={96} alt="" style={{ borderRadius: 18 }} />
          <div style={{ display: "flex", flexDirection: "column", fontSize: 30 }}>
            <span>{profile.name}</span>
            <span style={{ color: "#8e8d89" }}>{profile.role}</span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: title.length > 50 ? 60 : 72,
            fontWeight: 600,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#8e8d89" }}>
          <span>{subtitle}</span>
          <span>{new URL(siteUrl).host}</span>
        </div>
      </div>
    ),
    ogSize,
  );
}
