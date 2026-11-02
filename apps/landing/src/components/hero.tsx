import Link from "next/link";
import { LogoTile, Mark } from "./logo";
import { PRODUCTS } from "@/lib/products";
import { ProductLogo } from "./product-logo";
import { ThemeToggle } from "./theme-toggle";
import { Pill } from "./ui";

/** Floating nav: logo tile, a links pill and the call-to-action pill. */
export function Nav() {
	return (
		<header className="fixed inset-x-0 top-[15px] z-50 flex justify-center px-4">
			{/* soft fade so content scrolling under the floating nav doesn't fight with it */}
			<span
				aria-hidden
				className="pointer-events-none absolute inset-x-0 -top-[15px] h-[104px] bg-gradient-to-b from-bg from-55% to-transparent"
			/>
			<nav className="relative flex items-center gap-2" aria-label="Main">
				<Link href="/" aria-label="RabtX home">
					<LogoTile />
				</Link>
				<div className="flex h-[42px] items-center gap-3 whitespace-nowrap rounded-full bg-surface/85 px-3 backdrop-blur-md text-[13px] font-medium text-muted sm:gap-4 sm:px-4">
					<Link href="/#products" className="hover:text-ink">
						Products
					</Link>
					<Link href="/#how" className="hidden hover:text-ink sm:inline">
						How we work
					</Link>
				</div>
				<Pill href="/contact" variant="secondary" size="sm">
					Start a project
				</Pill>
				<ThemeToggle />
			</nav>
		</header>
	);
}

export function Hero() {
	return (
		<section className="flex flex-col items-center px-4 pb-14 pt-[120px] text-center">
			<Mark className="w-[120px] text-faded" />
			<p className="relative -mt-[29px] inline-flex items-center gap-2.5 rounded-full bg-surface py-2 pl-3 pr-3.5 text-[13px] font-medium text-muted">
				<span className="size-2 rounded-full bg-live" />
				Product studio · Islamabad
			</p>
			<h1 className="mt-3.5 text-[40px] font-bold leading-none tracking-[-0.04em] sm:text-[56px]">
				A studio building
				<br />
				AI-native products,
				<br />
				full-stack.
			</h1>
			<p className="mt-[18px] max-w-[420px] text-[17px] leading-6 text-muted">
				We build our own products and run them,<br className="hidden sm:inline" /> from the interface to the model calls.
			</p>
			<div className="mt-[38px] flex flex-wrap justify-center gap-1.5">
				<Pill href="/contact">Start a project</Pill>
				<Pill href="#products" variant="secondary">
					See our products
				</Pill>
			</div>

			<h2 className="mt-24 text-base font-semibold tracking-[-0.01em] sm:mt-[158px]">
				Our products
			</h2>
			<ul className="mt-8 flex max-w-[765px] flex-wrap items-center justify-center sm:mt-14">
				{PRODUCTS.map((p) => (
					<li key={p.slug} className="flex h-11 w-[153px] items-center justify-center">
						<Link
							href={`/products/${p.slug}`}
							className="flex items-center gap-2 text-[22px] font-bold tracking-[-0.03em] text-word transition-colors hover:text-ink"
						>
							<ProductLogo name={p.name} className="size-[22px]" />
							{p.name}
						</Link>
					</li>
				))}
				<li className="flex h-11 w-[153px] items-center justify-center">
					<span className="rounded-full bg-surface px-[15px] py-[13px] text-sm font-semibold">
						More soon
					</span>
				</li>
			</ul>
		</section>
	);
}
