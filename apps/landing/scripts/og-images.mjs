// Builds a 1200×630 share image per product from its first screenshot: bun scripts/og-images.mjs
// Re-run it when a product's first screenshot changes.
import sharp from "sharp";

const SHOTS = { grid: "grid-board", "school-os": "school-os", starter: "starter" };
const [W, H, INSET] = [1200, 630, 64];

for (const [slug, shot] of Object.entries(SHOTS)) {
	// The screenshot peeks in from the top-left, like the product cards on the home page.
	const screen = await sharp(`public/projects/${shot}.webp`)
		.resize({ width: 1440 })
		.extract({ left: 0, top: 0, width: W - INSET, height: H - INSET })
		.composite([{ input: Buffer.from(`<svg width="${W - INSET}" height="${H - INSET}"><rect width="${W}" height="${H}" rx="20" fill="#fff"/></svg>`), blend: "dest-in" }])
		.png()
		.toBuffer();
	await sharp({ create: { width: W, height: H, channels: 3, background: "#efefef" } })
		.composite([{ input: screen, left: INSET, top: INSET }])
		.png({ compressionLevel: 9 })
		.toFile(`public/og/${slug}.png`);
	console.log(`public/og/${slug}.png`);
}
