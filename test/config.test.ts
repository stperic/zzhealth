import { describe, expect, it } from "vitest";
import { MAX_TARGETS, readConfig } from "../src/lib/config";

const target = {
	id: "api",
	name: "Application API",
	url: "http://127.0.0.1:8080/health",
};
const configured = (targets: unknown) =>
	readConfig({ ZZHEALTH_TARGETS: JSON.stringify(targets) });

describe("target configuration", () => {
	it("uses three local demo services when no targets are configured", () => {
		const config = readConfig({
			ZZHEALTH_DEMO_ORIGIN: "http://127.0.0.1:3100",
		});
		expect(config.mode).toBe("demo");
		expect(config.targets.map((entry) => entry.url)).toEqual([
			"http://127.0.0.1:3100/api/demo/healthy",
			"http://127.0.0.1:3100/api/demo/slow",
			"http://127.0.0.1:3100/api/demo/down",
		]);
	});

	it("loads operator targets without substituting demo data", () => {
		expect(configured([target])).toEqual({
			mode: "configured",
			targets: [target],
		});
	});

	it("rejects malformed and empty configuration", () => {
		expect(() => readConfig({ ZZHEALTH_TARGETS: "{" })).toThrow("JSON array");
		for (const value of [[], {}, null, [null], [false]]) {
			expect(() => configured(value)).toThrow();
		}
	});

	it("bounds target count and rejects duplicate identities", () => {
		expect(() => configured([target, target])).toThrow("unique");
		expect(() =>
			configured(
				Array.from({ length: MAX_TARGETS + 1 }, (_, index) => ({
					...target,
					id: `api-${index}`,
				})),
			),
		).toThrow("between");
	});

	it("rejects unsupported URLs and credentials without echoing secrets", () => {
		for (const url of [
			"file:///etc/passwd",
			"/health",
			"https://user:secret@example.com",
			"http://localhost/#secret",
			"invalid",
		]) {
			expect(() => configured([{ ...target, url }])).toThrow();
			try {
				configured([{ ...target, url }]);
			} catch (error) {
				expect(String(error)).not.toContain("secret");
			}
		}
	});

	it("rejects misspelled fields and missing names", () => {
		expect(() => configured([{ ...target, timout: 2000 }])).toThrow("fields");
		expect(() => configured([{ ...target, name: " " }])).toThrow("names");
		expect(() => configured([{ ...target, id: "../api" }])).toThrow("IDs");
	});

	it("requires a bare demo origin", () => {
		for (const origin of [
			"http://localhost:3000/path",
			"http://localhost:3000/?key=secret",
		]) {
			expect(() => readConfig({ ZZHEALTH_DEMO_ORIGIN: origin })).toThrow(
				"ZZHEALTH_DEMO_ORIGIN",
			);
		}
	});
});
