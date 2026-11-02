import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { EMAIL, Footer } from "@/components/footer";
import { Nav } from "@/components/hero";
import { breadcrumbs, JsonLd } from "@/lib/schema";
import { SHARE_IMAGE } from "@/lib/share-image";

const TITLE = "Start a project — RabtX";
const DESCRIPTION =
	"Tell RabtX what you're building. We design, build and run AI-native products, from the interface to the model calls.";

export const metadata: Metadata = {
	title: TITLE,
	description: DESCRIPTION,
	alternates: { canonical: "/contact" },
	openGraph: { title: TITLE, description: DESCRIPTION, url: "/contact", siteName: "RabtX", type: "website", images: SHARE_IMAGE },
	twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: SHARE_IMAGE },
};

export default function ContactPage() {
	const trail = breadcrumbs([
		["Home", "/"],
		["Start a project", "/contact"],
	]);
	return (
		<>
			<Nav />
			<main className="mx-auto max-w-[680px] px-4 pb-24 pt-[120px] sm:pt-[150px]">
				<JsonLd nodes={[trail]} />
				<h1 className="text-[32px] font-bold leading-[1.1] tracking-[-0.035em] sm:text-[44px]">Start a project</h1>
				<p className="mt-4 text-lg leading-7 text-muted">
					Tell us what you&rsquo;re building. Shabir reads every message and replies himself.
				</p>
				<div className="mt-10">
					<ContactForm />
				</div>
				<p className="mt-8 text-sm text-muted">
					Prefer email?{" "}
					<a href={EMAIL} className="font-semibold text-ink hover:text-accent-ink">
						shabir@rabtx.dev
					</a>
				</p>
			</main>
			<Footer />
		</>
	);
}
