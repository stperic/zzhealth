import { createServer, type Server } from "node:http";
import { setTimeout } from "node:timers/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { checkServices, checkTarget, TIMEOUT_MS } from "../src/lib/health";

let server: Server;
let origin: string;
let redirectDestinationRequests = 0;

beforeAll(async () => {
	server = createServer(async (request, response) => {
		if (request.url === "/timeout") return;
		if (request.url === "/stream") {
			response.writeHead(200).flushHeaders();
			return;
		}
		if (request.url === "/slow") await setTimeout(250);
		if (request.url === "/redirect") {
			response
				.writeHead(302, { Location: `${origin}/redirect-destination` })
				.end();
			return;
		}
		if (request.url === "/redirect-destination") redirectDestinationRequests++;
		response
			.writeHead(request.url === "/unavailable" ? 503 : 200)
			.end("health response");
	});
	await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
	const address = server.address();
	if (!address || typeof address === "string")
		throw new Error("Test server has no TCP address");
	origin = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
	server.closeAllConnections();
	await new Promise<void>((resolve, reject) =>
		server.close((error) => (error ? reject(error) : resolve())),
	);
});

const target = (path: string) => ({
	id: "api",
	name: "Application API",
	url: `${origin}${path}`,
});

describe("HTTP checks", () => {
	it("reports a successful response as healthy", async () => {
		expect(await checkTarget(target("/healthy"))).toMatchObject({
			status: "healthy",
			httpStatus: 200,
			detail: "Responding normally",
		});
	});

	it("reports a slow successful response separately from an outage", async () => {
		const result = await checkTarget(target("/slow"));
		expect(result).toMatchObject({
			status: "slow",
			httpStatus: 200,
			detail: "Slow response",
		});
		expect(result.latencyMs).toBeGreaterThanOrEqual(200);
	});

	it("reports failed HTTP responses as down", async () => {
		expect(await checkTarget(target("/unavailable"))).toMatchObject({
			status: "down",
			httpStatus: 503,
		});
	});

	it("classifies headers without waiting for response bodies", async () => {
		const start = performance.now();
		expect(await checkTarget(target("/stream"))).toMatchObject({
			status: "healthy",
			httpStatus: 200,
		});
		expect(performance.now() - start).toBeLessThan(1000);
	});

	it("does not follow redirects outside the configured endpoint", async () => {
		expect(await checkTarget(target("/redirect"))).toMatchObject({
			status: "down",
			httpStatus: 302,
		});
		expect(redirectDestinationRequests).toBe(0);
	});

	it("bounds unresponsive requests and retains other service results", async () => {
		const report = await checkServices({
			mode: "configured",
			targets: [target("/timeout"), { ...target("/healthy"), id: "other" }],
		});
		expect(report.services[0]).toMatchObject({
			status: "down",
			httpStatus: null,
			detail: "Request timed out",
		});
		expect(report.services[0].latencyMs).toBeGreaterThanOrEqual(
			TIMEOUT_MS - 10,
		);
		expect(report.services[0].latencyMs).toBeLessThan(TIMEOUT_MS + 1500);
		expect(report.services[1].status).toBe("healthy");
		expect(Number.isNaN(Date.parse(report.checkedAt))).toBe(false);
	});

	it("reports connection failures without exposing the target query", async () => {
		const result = await checkTarget({
			id: "api",
			name: "API",
			url: "http://127.0.0.1:1/health?key=secret",
		});
		expect(result).toMatchObject({
			status: "down",
			httpStatus: null,
			detail: "Could not connect",
		});
		expect(JSON.stringify(result)).not.toContain("secret");
	});
});
