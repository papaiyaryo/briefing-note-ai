import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  oxc: {
    jsx: {
      runtime: "automatic",
    },
  },
  test: {
    environment: "node",
    exclude: [
      ...configDefaults.exclude,
      ".worktrees/**",
      ".codex/**",
      "aidlc/**",
    ],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}", "app/**/*.{ts,tsx}"],
      exclude: ["**/*.test.{ts,tsx}"],
      thresholds: { lines: 80 },
      reporter: ["text", "json-summary", "html"],
    },
  },
});
