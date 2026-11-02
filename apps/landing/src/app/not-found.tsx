import Link from "next/link";
import { Mark } from "@/components/logo";

export default function NotFound() {
	return (
		<main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
			<Mark className="w-[96px] text-faded" />
			<p className="mt-6 font-mono text-xs text-subtle">404</p>
			<h1 className="mt-3 text-[32px] font-bold leading-none tracking-[-0.04em] sm:text-[44px]">This page doesn’t exist.</h1>
			<p className="mt-4 text-[17px] text-muted">The link may be old, or the page has moved.</p>
			<Link
				href="/"
				className="mt-8 inline-flex h-[48px] items-center rounded-full bg-ink px-6 text-[15px] font-semibold text-inv transition-opacity hover:opacity-85"
			>
				Back to RabtX
			</Link>
		</main>
	);
}
