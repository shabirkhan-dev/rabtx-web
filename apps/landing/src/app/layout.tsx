import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Geist_Mono, Inter } from "next/font/google";
import { ThemeScript } from "@/components/theme-script";
import { FOUNDER, JsonLd, ORGANIZATION } from "@/lib/schema";
import "./globals.css";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const TITLE = "RabtX — AI-native products, built full-stack";
const DESCRIPTION =
	"RabtX is a product studio in Islamabad. We build our own AI-native products and run them, from the interface to the model calls.";

export const metadata: Metadata = {
	metadataBase: new URL("https://rabtx.dev"),
	title: TITLE,
	description: DESCRIPTION,
	openGraph: { title: TITLE, description: DESCRIPTION, url: "/", siteName: "RabtX", type: "website" },
	twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export const viewport: Viewport = {
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#efefef" },
		{ media: "(prefers-color-scheme: dark)", color: "#111111" },
	],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		// The theme script sets data-theme before React loads, so the attribute can differ from the server render.
		<html lang="en" suppressHydrationWarning className={`${inter.variable} ${geistMono.variable} antialiased`}>
			<head>
				<ThemeScript />
				{/* Tells search engines who runs the site and where else RabtX lives. */}
				<JsonLd nodes={[ORGANIZATION, FOUNDER]} />
				{/* Lets feed readers find the writing feed from any page. A page's own `alternates` (its canonical) would replace one set in metadata. */}
				<link rel="alternate" type="application/rss+xml" title="RabtX — Writing" href="/writing/feed.xml" />
			</head>
			<body className="min-h-dvh font-sans">
				{children}
				<Analytics />
			</body>
		</html>
	);
}
