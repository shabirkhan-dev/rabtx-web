"use server";

export type ContactState =
	| { status: "idle" }
	| { status: "sent" }
	| {
			status: "error";
			message: string;
			fields?: Partial<Record<"name" | "email" | "message", string>>;
			/** What they typed, so the form can refill itself after React resets it. */
			values: Record<"name" | "email" | "company" | "budget" | "message", string>;
	  };

const MAX = { name: 120, email: 200, company: 120, budget: 40, message: 5000 };

function field(form: FormData, name: keyof typeof MAX) {
	return String(form.get(name) ?? "")
		.trim()
		.slice(0, MAX[name]);
}

/**
 * Sends a project enquiry to RabtX's inbox through Resend's HTTP API. Needs RESEND_API_KEY;
 * CONTACT_TO and CONTACT_FROM override the inbox and the verified sender.
 */
export async function sendEnquiry(_prev: ContactState, form: FormData): Promise<ContactState> {
	// Bots fill every field; people never see this one.
	if (String(form.get("website") ?? "")) return { status: "sent" };

	const name = field(form, "name");
	const email = field(form, "email");
	const company = field(form, "company");
	const budget = field(form, "budget");
	const message = field(form, "message");

	const values = { name, email, company, budget, message };

	const fields: Partial<Record<"name" | "email" | "message", string>> = {};
	if (!name) fields.name = "Tell us your name.";
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fields.email = "Enter an email we can reply to.";
	if (message.length < 10) fields.message = "Tell us a little about what you’re building.";
	if (Object.keys(fields).length) return { status: "error", message: "Check the highlighted fields.", fields, values };

	const key = process.env.RESEND_API_KEY;
	if (!key) {
		console.error("Contact form: RESEND_API_KEY is not set");
		return { status: "error", message: "The form isn’t set up yet. Please email shabir@rabtx.dev instead.", values };
	}

	const text = [
		`Name: ${name}`,
		`Email: ${email}`,
		company && `Company: ${company}`,
		budget && `Budget: ${budget}`,
		"",
		message,
	]
		.filter((line) => line !== "")
		.join("\n");

	const res = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
		body: JSON.stringify({
			from: process.env.CONTACT_FROM ?? "RabtX website <onboarding@resend.dev>",
			to: [process.env.CONTACT_TO ?? "shabir@rabtx.dev"],
			reply_to: email,
			subject: `New project enquiry from ${name}`,
			text,
		}),
	});
	if (!res.ok) {
		console.error("Contact form: Resend returned", res.status, await res.text());
		return { status: "error", message: "Something went wrong sending that. Please email shabir@rabtx.dev instead.", values };
	}
	return { status: "sent" };
}
