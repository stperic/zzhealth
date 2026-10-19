import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: 0,
	reporter: [["list"], ["junit", { outputFile: ".zztrace/browser.xml" }]],
	use: {
		baseURL: "http://127.0.0.1:3100",
		trace: "retain-on-failure",
	},
	projects: [
		{ name: "chromium", use: { ...devices["Desktop Chrome"] } },
		{
			name: "mobile",
			use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
		},
	],
	webServer: {
		command: "npm run start -- --port 3100",
		url: "http://127.0.0.1:3100/api/health",
		reuseExistingServer: false,
		env: {
			ZZHEALTH_DEMO_ORIGIN: "http://127.0.0.1:3100",
			ZZHEALTH_TARGETS: "",
		},
	},
});
