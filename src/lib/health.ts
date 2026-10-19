import type { MonitorConfig, Target } from "./config";

export const TIMEOUT_MS = 2000;
export const SLOW_MS = 200;

export type HealthStatus = "healthy" | "slow" | "down";

export interface CheckResult {
	id: string;
	name: string;
	origin: string;
	status: HealthStatus;
	latencyMs: number;
	httpStatus: number | null;
	detail: string;
}

export interface HealthReport {
	mode: MonitorConfig["mode"];
	checkedAt: string;
	timeoutMs: number;
	slowMs: number;
	services: CheckResult[];
}

export async function checkTarget(target: Target): Promise<CheckResult> {
	const start = performance.now();
	const base = {
		id: target.id,
		name: target.name,
		origin: new URL(target.url).origin,
	};
	const signal = AbortSignal.timeout(TIMEOUT_MS);
	try {
		const response = await fetch(target.url, {
			method: "GET",
			redirect: "manual",
			cache: "no-store",
			signal,
			headers: { "User-Agent": "zzhealth/0.1" },
		});
		const latencyMs = Math.round(performance.now() - start);
		// Health is measured at the response headers; never download an arbitrary body.
		await response.body?.cancel();
		const status = response.ok
			? latencyMs >= SLOW_MS
				? "slow"
				: "healthy"
			: "down";
		return {
			...base,
			status,
			latencyMs,
			httpStatus: response.status,
			detail: response.ok
				? status === "slow"
					? "Slow response"
					: "Responding normally"
				: `HTTP ${response.status}`,
		};
	} catch {
		return {
			...base,
			status: "down",
			latencyMs: Math.round(performance.now() - start),
			httpStatus: null,
			detail: signal.aborted ? "Request timed out" : "Could not connect",
		};
	}
}

export async function checkServices(
	config: MonitorConfig,
): Promise<HealthReport> {
	const services = await Promise.all(config.targets.map(checkTarget));
	return {
		mode: config.mode,
		checkedAt: new Date().toISOString(),
		timeoutMs: TIMEOUT_MS,
		slowMs: SLOW_MS,
		services,
	};
}
