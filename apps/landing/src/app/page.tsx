import { Engineering } from "@/components/engineering";
import { EveryLayer } from "@/components/every-layer";
import { Footer } from "@/components/footer";
import { Founder } from "@/components/founder";
import { Hero, Nav } from "@/components/hero";
import { Products } from "@/components/products";
import { Writing } from "@/components/writing";

export default function Home() {
	return (
		<>
			<Nav />
			<main>
				<Hero />
				<EveryLayer />
				<Products />
				<Engineering />
				<Founder />
				<Writing />
			</main>
			<Footer />
		</>
	);
}
