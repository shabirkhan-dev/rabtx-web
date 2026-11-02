"use client";

import type { Ref } from "react";
import { ProductLogo } from "./product-logo";
import { ArrowIcon, GithubIcon } from "./icons";
import type { Product } from "./products";
import { ScreenshotCarousel } from "./screenshot-carousel";

const pill =
	"flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 pl-4 pr-3.5 text-sm font-semibold transition-opacity hover:opacity-85 sm:flex-none";

/**
 * A product's details, the same pattern as the portfolio: a centred dialog on desktop and a bottom
 * sheet on phones. Built on <dialog>, so Escape, focus trapping and the backdrop come for free.
 */
export function ProjectDialog({ ref, product }: { ref: Ref<HTMLDialogElement>; product: Product | null }) {
	return (
		<dialog
			ref={ref}
			aria-labelledby="project-title"
			onClick={(event) => {
				// A click on the backdrop lands on the dialog element itself.
				if (event.target === event.currentTarget) event.currentTarget.close();
			}}
			className="m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-y-auto overscroll-contain rounded-t-[22px] border border-b-0 border-line bg-surface p-2 pb-4 text-ink backdrop:bg-black/60 backdrop:backdrop-blur-[2px] sm:m-auto sm:max-h-[calc(100dvh-48px)] sm:w-[600px] sm:rounded-[22px] sm:border-b sm:pb-2"
		>
			{product && (
				<div className="flex flex-col items-center gap-3">
					<span className="h-1 w-9 rounded-full bg-ink/15 sm:hidden" aria-hidden />
					<div className="relative w-full">
						<ScreenshotCarousel key={product.name} images={product.screens} alt={product.name} />
						<form method="dialog">
							<button
								type="submit"
								aria-label="Close"
								className="absolute right-3 top-3 grid size-8 cursor-pointer place-items-center rounded-full border border-line bg-surface/85 text-ink backdrop-blur-md"
							>
								<svg viewBox="0 0 16 16" aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
									<path strokeLinecap="round" d="M4 4l8 8M12 4l-8 8" />
								</svg>
							</button>
						</form>
					</div>

					<div className="flex w-full flex-col gap-5 px-3 pb-3 pt-1 sm:px-4">
						<div className="flex items-center gap-3">
							<ProductLogo name={product.name} className="size-7" />
							<div>
								<h2 id="project-title" className="text-xl font-semibold tracking-[-0.03em]">
									{product.name}
								</h2>
								<p className="text-sm text-muted">{product.label}</p>
							</div>
						</div>

						<div className="flex flex-col gap-3 text-[15px] leading-[24px] text-muted">
							{product.about.map((paragraph) => (
								<p key={paragraph}>{paragraph}</p>
							))}
						</div>

						<dl className="flex flex-col text-sm">
							{product.facts.map(([label, value]) => (
								<div key={label} className="flex gap-4 border-t border-line py-2.5 last:border-b">
									<dt className="w-20 shrink-0 text-subtle">{label}</dt>
									<dd>{value}</dd>
								</div>
							))}
						</dl>

						{(product.github || product.live) && (
							<div className="flex gap-2">
								{product.github && (
									<a href={product.github} target="_blank" rel="noreferrer" className={`${pill} bg-ink text-inv`}>
										<GithubIcon />
										View on GitHub
										<ArrowIcon />
									</a>
								)}
								{product.live && (
									<a href={product.live} target="_blank" rel="noreferrer" className={`${pill} border border-line`}>
										Live site
										<ArrowIcon />
									</a>
								)}
							</div>
						)}
					</div>
				</div>
			)}
		</dialog>
	);
}
