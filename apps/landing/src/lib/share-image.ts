/**
 * The site-wide share image. A page that sets its own `openGraph` or `twitter` replaces the root
 * layout's, which drops the image from app/opengraph-image.png, so those pages pass this back in.
 */
export const SHARE_IMAGE = {
	url: "/opengraph-image.png",
	width: 1200,
	height: 630,
	alt: "RabtX: a studio building AI-native products, full-stack.",
};
