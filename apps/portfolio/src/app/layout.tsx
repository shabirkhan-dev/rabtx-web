import type { Metadata, Viewport } from "next";
import { Caveat, IBM_Plex_Mono, Inter } from "next/font/google";
import { profile, siteUrl } from "@/data/profile";
import { THEME_COLORS, ThemeScript } from "@/components/theme-script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${profile.name} — ${profile.role}`,
    template: `%s — ${profile.name}`,
  },
  description: profile.description,
  authors: [{ name: profile.name }],
  openGraph: {
    title: `${profile.name} — ${profile.role}`,
    description: profile.description,
    type: "website",
    url: "/",
    siteName: profile.name,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  // One colour; ThemeScript and the toggle switch it to the page's theme.
  themeColor: THEME_COLORS.dark,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${inter.variable} ${caveat.variable} ${plexMono.variable}`}
    >
      <head>
        <ThemeScript />
      </head>
      <body>{children}</body>
    </html>
  );
}
