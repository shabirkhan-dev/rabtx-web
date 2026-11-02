import { FOUNDER_LINKS, GITHUB_URL, LINKEDIN_URL, SITE_URL } from "./site";

/**
 * schema.org data shared across pages. The organization and founder carry an @id, so a page can
 * point at them ({ "@id": ... }) instead of repeating them.
 */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const FOUNDER_ID = `${SITE_URL}/#founder`;

export const FOUNDER = {
	"@type": "Person",
	"@id": FOUNDER_ID,
	name: "Shabir Khan",
	jobTitle: "Founder and lead engineer",
	url: FOUNDER_LINKS.site,
	image: `${SITE_URL}/avatar.png`,
	worksFor: { "@id": ORGANIZATION_ID },
	sameAs: [FOUNDER_LINKS.linkedin, FOUNDER_LINKS.github],
};

export const ORGANIZATION = {
	"@type": "Organization",
	"@id": ORGANIZATION_ID,
	name: "RabtX",
	url: SITE_URL,
	logo: `${SITE_URL}/apple-icon.png`,
	email: "shabir@rabtx.dev",
	founder: { "@id": FOUNDER_ID },
	address: { "@type": "PostalAddress", addressLocality: "Islamabad", addressCountry: "PK" },
	sameAs: [LINKEDIN_URL, GITHUB_URL],
};

/** Home › … › this page, as [name, path] pairs from the root. */
export function breadcrumbs(trail: [string, string][]) {
	return {
		"@type": "BreadcrumbList",
		itemListElement: trail.map(([name, path], i) => ({
			"@type": "ListItem",
			position: i + 1,
			name,
			item: `${SITE_URL}${path}`,
		})),
	};
}

/** One <script type="application/ld+json"> holding every node the page describes. */
export function JsonLd({ nodes }: { nodes: object[] }) {
	const graph = { "@context": "https://schema.org", "@graph": nodes };
	return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />;
}
