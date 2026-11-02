"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { type Product, PRODUCTS, STATUS_TONE } from "@/lib/products";
import { ArrowIcon, GithubIcon } from "./icons";
import { ProductLogo } from "./product-logo";
import { ProjectDialog } from "./project-dialog";
import { SectionHeader } from "./ui";

function ProductCard({ p, onOpen }: { p: Product; onOpen: () => void }) {
	return (
		<article className="group relative flex flex-col overflow-hidden rounded-[20px] border border-line bg-surface transition-colors hover:border-ink/20">
			{/* The whole card links to the product page; a plain click opens the details dialog instead.
			    The GitHub and Live links sit above this link. */}
			<Link
				href={`/products/${p.slug}`}
				onClick={(event) => {
					if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
					event.preventDefault();
					onOpen();
				}}
				aria-label={`${p.name} details`}
				className="absolute inset-0 z-0 rounded-[20px]"
			/>
			{/* screenshot peeks in from the top-left of its own frame, so text can never run into it */}
			<div className="pointer-events-none relative aspect-[16/10] overflow-hidden border-b border-line bg-surface-2">
				<Image
					src={p.screens[0]}
					alt=""
					width={1440}
					height={900}
					sizes="(min-width: 1024px) 560px, 90vw"
					className="absolute left-6 top-6 w-[150%] max-w-none rounded-tl-xl border-l border-t border-line transition-transform duration-300 ease-out group-hover:-translate-x-1 group-hover:-translate-y-1 motion-reduce:transition-none"
				/>
			</div>
			<div className="pointer-events-none relative flex flex-1 flex-col p-6">
				<div className="flex h-8 items-center justify-between gap-3">
					<h3 className="flex items-center gap-2.5 text-lg font-semibold tracking-[-0.03em]">
						<ProductLogo name={p.name} className="size-[22px]" />
						{p.name}
					</h3>
					<div className="pointer-events-auto relative z-10 flex items-center gap-1.5">
						{p.github && (
							<a
								href={p.github}
								target="_blank"
								rel="noreferrer"
								aria-label={`${p.name} on GitHub`}
								className="grid size-8 place-items-center rounded-full border border-line bg-surface-2 transition-opacity hover:opacity-75"
							>
								<GithubIcon />
							</a>
						)}
						{p.live && (
							<a
								href={p.live}
								target="_blank"
								rel="noreferrer"
								className="flex h-8 items-center gap-1 rounded-full bg-ink pl-3 pr-2.5 text-xs font-semibold text-inv transition-opacity hover:opacity-85"
							>
								Live
								<ArrowIcon />
							</a>
						)}
					</div>
				</div>
				<span
					className={`mt-3 inline-flex w-fit items-center gap-1.5 rounded-full py-1 pl-2 pr-2.5 text-xs font-medium ${STATUS_TONE[p.status.tone]}`}
				>
					<span className="size-1.5 rounded-full bg-current" />
					{p.status.label}
				</span>
				<p className="mt-4 text-[15px] leading-[23px] text-muted">{p.desc}</p>
				<div className="mt-auto pt-6">
					<div className="flex items-center justify-between gap-4 border-t border-line pt-4">
						<p className="font-mono text-xs text-subtle">
							<span className="sr-only">Built with </span>
							{p.stack}
						</p>
						<span className="shrink-0 text-xs font-semibold text-ink transition-transform group-hover:translate-x-0.5">
							Details →
						</span>
					</div>
				</div>
			</div>
		</article>
	);
}

export function Products() {
	const dialog = useRef<HTMLDialogElement>(null);
	const [open, setOpen] = useState<Product | null>(null);

	return (
		<section id="products" className="scroll-mt-24 px-4 pt-20 sm:px-20">
			<SectionHeader chip="Products" title="What we’ve built." />
			<div className="mx-auto mt-[72px] grid max-w-[640px] gap-6 lg:max-w-[1280px] lg:grid-cols-3">
				{PRODUCTS.map((p) => (
					<ProductCard
						key={p.name}
						p={p}
						onOpen={() => {
							setOpen(p);
							dialog.current?.showModal();
						}}
					/>
				))}
			</div>
			<ProjectDialog ref={dialog} product={open} />
		</section>
	);
}
