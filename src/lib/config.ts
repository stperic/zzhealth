export interface Target {
	id: string;
	name: string;
	url: string;
}

export interface MonitorConfig {
	mode: "demo" | "configured";
	targets: Target[];
}

export const MAX_TARGETS = 12;

function targetUrl(value: unknown): string {
	if (typeof value !== "string" || value.length > 2048) {
		throw new Error("Each target needs an HTTP or HTTPS URL.");
	}
	let url: URL;
	try {
		url = new URL(value);
	} catch {
		throw new Error("Each target needs an absolute HTTP or HTTPS URL.");
	}
	if (
		!["http:", "https:"].includes(url.protocol) ||
		url.username ||
		url.password ||
		url.hash
	) {
		throw new Error(
			"Target URLs must use HTTP or HTTPS without credentials or fragments.",
		);
	}
	return url.href;
}

export function readConfig(
	env: Record<string, string | undefined> = process.env,
): MonitorConfig {
	if (!env.ZZHEALTH_TARGETS?.trim()) {
		const origin = new URL(
			targetUrl(env.ZZHEALTH_DEMO_ORIGIN ?? "http://127.0.0.1:3000"),
		);
		if (origin.pathname !== "/" || origin.search) {
			throw new Error(
				"ZZHEALTH_DEMO_ORIGIN must contain only a scheme, hostname and optional port.",
			);
		}
		return {
			mode: "demo",
			targets: [
				{
					id: "api",
					name: "Application API",
					url: `${origin.origin}/api/demo/healthy`,
				},
				{
					id: "search",
					name: "Search service",
					url: `${origin.origin}/api/demo/slow`,
				},
				{
					id: "worker",
					name: "Background worker",
					url: `${origin.origin}/api/demo/down`,
				},
			],
		};
	}

	let input: unknown;
	try {
		input = JSON.parse(env.ZZHEALTH_TARGETS);
	} catch {
		throw new Error("ZZHEALTH_TARGETS must be a JSON array.");
	}
	if (!Array.isArray(input) || input.length < 1 || input.length > MAX_TARGETS) {
		throw new Error(`Configure between 1 and ${MAX_TARGETS} targets.`);
	}

	const ids = new Set<string>();
	const targets = input.map((entry: unknown): Target => {
		if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
			throw new Error("Each target must be an object with id, name and url.");
		}
		const value = entry as Record<string, unknown>;
		if (
			Object.keys(value).some((key) => !["id", "name", "url"].includes(key))
		) {
			throw new Error("Target fields are id, name and url.");
		}
		if (
			typeof value.id !== "string" ||
			!/^[a-z][a-z0-9-]{0,39}$/.test(value.id) ||
			ids.has(value.id)
		) {
			throw new Error(
				"Target IDs must be unique lowercase names, up to 40 characters.",
			);
		}
		if (
			typeof value.name !== "string" ||
			!value.name.trim() ||
			value.name.length > 80
		) {
			throw new Error("Target names must contain between 1 and 80 characters.");
		}
		ids.add(value.id);
		return { id: value.id, name: value.name.trim(), url: targetUrl(value.url) };
	});
	return { mode: "configured", targets };
}
