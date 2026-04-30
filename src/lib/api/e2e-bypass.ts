// Single source of truth for the E2E bypass switch + production guardrail.
// If E2E_TEST=1 ever leaks into a production build, fail loudly at module
// load rather than silently authenticate every visitor as `e2e-user`.
if (process.env.E2E_TEST === "1" && process.env.NODE_ENV === "production") {
  throw new Error("E2E_TEST=1 is forbidden in production builds");
}

export const isE2E = (): boolean => process.env.E2E_TEST === "1";

export const E2E_USER = {
  userId: "e2e-user",
  user: { id: "e2e-user", email: "e2e@example.test" },
} as const;
