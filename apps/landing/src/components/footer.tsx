import Link from "next/link";
import { LogoTile, Mark, Wordmark } from "./logo";
import { Pill } from "./ui";

export const EMAIL = "mailto:shabir@rabtx.dev";

const LINKS = [
	["Products", "/#products"],
	["How we work", "/#how"],
	["Writing", "/#writing"],
	["About", "/#about"],
	["LinkedIn", "https://www.linkedin.com/company/rabtx/"],
	["GitHub", "https://github.com/shabirkhan-dev"],
	["Email", EMAIL],
];

export function Footer() {
	return (
		<footer id="contact" className="mx-4 border-t border-line sm:mx-20">
			<div className="flex flex-col items-center pb-[130px] pt-16 text-center">
				<Mark className="w-[120px] text-faded" />
				<h2 className="mt-5 text-[40px] font-bold leading-none tracking-[-0.04em] sm:text-[56px]">
					Let&rsquo;s build something
					<br />
					AI-native.
				</h2>
				<p className="mt-[18px] text-[17px] leading-6 text-muted">Tell us what you&rsquo;re building.</p>
				<div className="mt-[38px] flex flex-wrap justify-center gap-1.5">
					<Pill href={EMAIL}>Start a project</Pill>
					<Pill href="/#products" variant="secondary">
						See our products
					</Pill>
				</div>
			</div>
			<div className="flex flex-col items-center gap-5 border-t border-line py-8 sm:flex-row sm:justify-between sm:py-[34px]">
				<Link href="/" className="flex items-center gap-2 text-ink" aria-label="RabtX home">
					<LogoTile className="size-7 rounded-lg" />
					<Wordmark className="h-4" />
				</Link>
				<nav className="flex flex-wrap justify-center gap-6 text-sm font-medium text-muted" aria-label="Footer">
					{LINKS.map(([label, href]) =>
						href.startsWith("/") ? (
							<Link key={label} href={href} className="hover:text-ink">
								{label}
							</Link>
						) : (
							<a
								key={label}
								href={href}
								{...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
								className="hover:text-ink"
							>
								{label}
							</a>
						),
					)}
				</nav>
				<p className="text-sm text-muted">© 2026 RabtX</p>
			</div>
		</footer>
	);
}
