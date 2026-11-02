import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Geist_Mono, Inter } from "next/font/google";
import { ThemeScript } from "@/components/theme-script";
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

// Tells search engines who runs the site and where else RabtX lives.
const ORGANIZATION = {
	"@context": "https://schema.org",
	"@type": "Organization",
	name: "RabtX",
	url: "https://rabtx.dev",
	logo: "https://rabtx.dev/apple-icon.png",
	email: "shabir@rabtx.dev",
	founder: { "@type": "Person", name: "Shabir Khan", url: "https://shabirkhan.dev" },
	address: { "@type": "PostalAddress", addressLocality: "Islamabad", addressCountry: "PK" },
	sameAs: ["https://www.linkedin.com/company/rabtx/", "https://github.com/shabirkhan-dev"],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		// The theme script sets data-theme before React loads, so the attribute can differ from the server render.
		<html lang="en" suppressHydrationWarning className={`${inter.variable} ${geistMono.variable} antialiased`}>
			<head>
				<ThemeScript />
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION) }}
				/>
			</head>
			<body className="min-h-dvh font-sans">
				{children}
				<Analytics />
			</body>
		</html>
	);
}
