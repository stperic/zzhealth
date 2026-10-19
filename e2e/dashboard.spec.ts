import { expect, test } from "@playwright/test";

test("shows actual demo results and refreshes them", async ({ page }) => {
	await page.goto("/");
	await expect(
		page.getByRole("heading", { name: "Service health", exact: true }),
	).toBeVisible();
	await expect(page.getByText("Local demo", { exact: true })).toBeVisible();
	await expect(
		page.getByRole("row", { name: /Application API/ }),
	).toContainText("Healthy");
	await expect(page.getByRole("row", { name: /Search service/ })).toContainText(
		"Slow",
	);
	await expect(
		page.getByRole("row", { name: /Background worker/ }),
	).toContainText("Down");
	const initial = await page.locator("time").getAttribute("datetime");
	if (!initial) throw new Error("The completed report needs a timestamp");
	const response = page.waitForResponse("**/api/checks");
	await page.getByRole("button", { name: "Refresh checks" }).click();
	expect((await response).status()).toBe(200);
	await expect(
		page.getByRole("button", { name: "Refresh checks" }),
	).toBeEnabled();
	await expect(page.locator("time")).not.toHaveAttribute("datetime", initial);
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= window.innerWidth,
		),
	).toBe(true);
});

test("keeps the previous result visibly stale when refresh fails", async ({
	page,
}) => {
	await page.goto("/");
	const initial = await page.locator("time").getAttribute("datetime");
	if (!initial) throw new Error("The completed report needs a timestamp");
	await page.route("**/api/checks", (route) =>
		route.fulfill({ status: 503, body: "Unavailable" }),
	);
	await page.getByRole("button", { name: "Refresh checks" }).click();
	await expect(
		page.getByRole("alert").filter({ hasText: "Could not refresh" }),
	).toContainText("Showing the last results");
	await expect(page.locator("time")).toHaveAttribute("datetime", initial);
	await expect(
		page.getByRole("row", { name: /Application API/ }),
	).toContainText("Healthy");
	await expect(
		page.getByRole("button", { name: "Refresh checks" }),
	).toBeEnabled();
});

test("API checks only configured services and does not cache observations", async ({
	request,
}) => {
	const response = await request.get(
		"/api/checks?url=https://example.com/private",
	);
	expect(response.headers()["cache-control"]).toBe("no-store");
	const report = await response.json();
	expect(report.services.map((service: { id: string }) => service.id)).toEqual([
		"api",
		"search",
		"worker",
	]);
	expect(
		report.services.every(
			(service: { origin: string }) =>
				service.origin === "http://127.0.0.1:3100",
		),
	).toBe(true);
	expect((await request.post("/api/checks")).status()).toBe(405);
});
