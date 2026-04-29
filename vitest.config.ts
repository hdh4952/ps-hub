import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
    hookTimeout: 30_000,
    testTimeout: 30_000,
    // Integration tests share one Neon `pshub_test` DB and call truncateAll;
    // running test files in parallel causes truncate-vs-write races. Serialize.
    fileParallelism: false,
  },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
