"use client";

import { type ReactNode, useRef, useState } from "react";
import type { DialogProduct } from "@/lib/products";
import { ProjectDialog } from "./project-dialog";

/**
 * Opens a product's details dialog when its card is clicked. It listens in the capture phase so a
 * plain click is stopped before the card's link navigates; modified clicks still open the page.
 */
export function ProductGrid({
	products,
	className,
	children,
}: {
	products: DialogProduct[];
	className: string;
	children: ReactNode;
}) {
	const dialog = useRef<HTMLDialogElement>(null);
	const [open, setOpen] = useState<DialogProduct | null>(null);

	return (
		<>
			<div
				className={className}
				onClickCapture={(event) => {
					if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
					const slug = (event.target as Element).closest<HTMLElement>("a[data-product]")?.dataset.product;
					const product = products.find((p) => p.slug === slug);
					if (!product) return;
					event.preventDefault();
					setOpen(product);
					dialog.current?.showModal();
				}}
			>
				{children}
			</div>
			<ProjectDialog ref={dialog} product={open} />
		</>
	);
}
