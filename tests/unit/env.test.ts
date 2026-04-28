import { describe, it, expect, beforeEach } from "vitest";

describe("loadEnv", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgres://x";
    process.env.GOOGLE_CLIENT_ID = "id";
    process.env.GOOGLE_CLIENT_SECRET = "secret";
    process.env.NEXTAUTH_SECRET = "s";
    process.env.NEXTAUTH_URL = "http://localhost:3000";
  });

  it("returns parsed env when valid", async () => {
    const { loadEnv } = await import("@/env");
    expect(loadEnv().DATABASE_URL).toBe("postgres://x");
  });

  it("throws when DATABASE_URL missing", async () => {
    delete process.env.DATABASE_URL;
    const { loadEnv } = await import("@/env");
    expect(() => loadEnv()).toThrow(/DATABASE_URL/);
  });
});
