import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		include: ["test/**/*.test.ts"],
		reporters: ["default", ["junit", { addFileAttribute: true }]],
		outputFile: { junit: ".zztrace/unit.xml" },
	},
});
