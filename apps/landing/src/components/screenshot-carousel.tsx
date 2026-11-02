"use client";

import Image from "next/image";
import { useRef, useState } from "react";

const arrow =
	"absolute top-1/2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-line bg-surface/85 text-ink backdrop-blur-md transition-opacity disabled:pointer-events-none disabled:opacity-0 max-sm:hidden";

/** Product screens one at a time: swipe on touch, arrows with a mouse, dots for position. */
export function ScreenshotCarousel({ images, alt }: { images: string[]; alt: string }) {
	const track = useRef<HTMLDivElement>(null);
	const [index, setIndex] = useState(0);
	const many = images.length > 1;

	function go(to: number) {
		const el = track.current;
		if (el) el.scrollTo({ left: to * el.clientWidth, behavior: "smooth" });
	}

	return (
		<div className="flex w-full flex-col gap-2.5">
			<div className="relative">
				<div
					ref={track}
					onScroll={(event) => {
						const el = event.currentTarget;
						setIndex(Math.round(el.scrollLeft / el.clientWidth));
					}}
					className="flex snap-x snap-mandatory overflow-x-auto rounded-[14px] border border-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
				>
					{images.map((src, i) => (
						<Image
							key={src}
							src={src}
							alt={`${alt}, screen ${i + 1} of ${images.length}`}
							width={1440}
							height={900}
							sizes="(min-width: 640px) 560px, 100vw"
							className="aspect-[16/10] w-full shrink-0 snap-center object-cover object-left-top"
						/>
					))}
				</div>
				{many && (
					<>
						<button type="button" aria-label="Previous screen" disabled={index === 0} onClick={() => go(index - 1)} className={`${arrow} left-3`}>
							<svg viewBox="0 0 16 16" aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
								<path strokeLinecap="round" strokeLinejoin="round" d="M10 3.5L5.5 8l4.5 4.5" />
							</svg>
						</button>
						<button
							type="button"
							aria-label="Next screen"
							disabled={index === images.length - 1}
							onClick={() => go(index + 1)}
							className={`${arrow} right-3`}
						>
							<svg viewBox="0 0 16 16" aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
								<path strokeLinecap="round" strokeLinejoin="round" d="M6 3.5L10.5 8 6 12.5" />
							</svg>
						</button>
					</>
				)}
			</div>
			{many && (
				<div className="flex justify-center gap-1.5" role="tablist" aria-label="Screens">
					{images.map((src, i) => (
						<button
							key={src}
							type="button"
							role="tab"
							aria-selected={i === index}
							aria-label={`Screen ${i + 1}`}
							onClick={() => go(i)}
							className={`h-1.5 cursor-pointer rounded-full transition-[width,background-color] ${
								i === index ? "w-4 bg-ink" : "w-1.5 bg-ink/20"
							}`}
						/>
					))}
				</div>
			)}
		</div>
	);
}
