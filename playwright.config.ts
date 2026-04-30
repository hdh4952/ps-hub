import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000" },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    // CAVEAT: locally a pre-existing `npm run dev` started without E2E_TEST=1
    // will be silently reused, breaking the test (redirects to /login).
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { ...process.env, E2E_TEST: "1" },
  },
});
