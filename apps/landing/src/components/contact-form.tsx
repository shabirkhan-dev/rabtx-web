"use client";

import { track } from "@vercel/analytics";
import { useActionState, useEffect } from "react";
import { type ContactState, sendEnquiry } from "@/app/contact/actions";

const input =
	"w-full rounded-xl border border-line bg-surface px-4 py-3 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-subtle focus:border-ink/40 focus:ring-4 focus:ring-ink/[0.06] aria-invalid:border-red-600/60";
const label = "text-sm font-medium";

const BUDGETS = ["Not sure yet", "Under $5k", "$5k–$15k", "$15k–$50k", "$50k+"];

/** A project enquiry: name, email, optional company and budget, and what they're building. */
export function ContactForm() {
	const [state, action, pending] = useActionState<ContactState, FormData>(sendEnquiry, { status: "idle" });
	const errors = state.status === "error" ? (state.fields ?? {}) : {};
	const values = state.status === "error" ? state.values : undefined;

	useEffect(() => {
		if (state.status === "sent") track("Contact form sent");
	}, [state.status]);

	if (state.status === "sent") {
		return (
			<div role="status" className="rounded-[20px] border border-line bg-surface p-8 text-center">
				<p className="text-xl font-semibold tracking-[-0.02em]">Thanks, we&rsquo;ve got it.</p>
				<p className="mt-2 text-[15px] text-muted">Shabir will reply to you by email.</p>
			</div>
		);
	}

	return (
		<form key={JSON.stringify(values ?? {})} action={action} noValidate className="flex flex-col gap-5 text-left">
			{/* Hidden from people; bots fill it in. */}
			<div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
				<label>
					Website
					<input type="text" name="website" tabIndex={-1} autoComplete="off" />
				</label>
			</div>
			<div className="grid gap-5 sm:grid-cols-2">
				<label className="flex flex-col gap-2">
					<span className={label}>Name</span>
					<input
						name="name"
						defaultValue={values?.name}
						required
						autoComplete="name"
						aria-invalid={!!errors.name}
						aria-describedby={errors.name ? "name-error" : undefined}
						className={input}
					/>
					{errors.name && <span id="name-error" className="text-sm text-red-600">{errors.name}</span>}
				</label>
				<label className="flex flex-col gap-2">
					<span className={label}>Email</span>
					<input
						name="email"
						defaultValue={values?.email}
						type="email"
						required
						autoComplete="email"
						aria-invalid={!!errors.email}
						aria-describedby={errors.email ? "email-error" : undefined}
						className={input}
					/>
					{errors.email && <span id="email-error" className="text-sm text-red-600">{errors.email}</span>}
				</label>
				<label className="flex flex-col gap-2">
					<span className={label}>
						Company <span className="font-normal text-subtle">(optional)</span>
					</span>
					<input name="company" defaultValue={values?.company} autoComplete="organization" className={input} />
				</label>
				<label className="flex flex-col gap-2">
					<span className={label}>
						Budget <span className="font-normal text-subtle">(optional)</span>
					</span>
					<div className="relative">
						<select
							name="budget"
							defaultValue={values?.budget ?? ""}
							className={`${input} cursor-pointer appearance-none pr-11`}
						>
							<option value="">Choose one</option>
							{BUDGETS.map((b) => (
								<option key={b}>{b}</option>
							))}
						</select>
						<svg
							viewBox="0 0 16 16"
							aria-hidden
							className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
						>
							<path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
						</svg>
					</div>
				</label>
			</div>
			<label className="flex flex-col gap-2">
				<span className={label}>What are you building?</span>
				<textarea
					name="message"
					defaultValue={values?.message}
					required
					rows={5}
					aria-invalid={!!errors.message}
					aria-describedby={errors.message ? "message-error" : undefined}
					className={`${input} resize-none`}
				/>
				{errors.message && <span id="message-error" className="text-sm text-red-600">{errors.message}</span>}
			</label>
			{state.status === "error" && !Object.keys(errors).length && (
				<p role="alert" className="text-sm text-red-600">
					{state.message}
				</p>
			)}
			<button
				type="submit"
				disabled={pending}
				className="inline-flex h-[54px] items-center justify-center rounded-full bg-ink px-6 text-base font-semibold text-inv transition-opacity hover:opacity-85 disabled:opacity-60"
			>
				{pending ? "Sending…" : "Send"}
			</button>
		</form>
	);
}
