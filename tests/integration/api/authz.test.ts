import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { createTestDb, truncateAll } from "../../helpers/db";

let currentUser = "userA";
vi.mock("@/lib/api/session", () => ({
  requireSession: async () => ({ userId: currentUser, user: {} }),
}));

const adapterMock = { fetch: vi.fn() };
vi.mock("@/lib/adapters", async (orig) => {
  const real = await orig<typeof import("@/lib/adapters")>();
  return { ...real, getAdapter: () => adapterMock };
});

let testDb: Awaited<ReturnType<typeof createTestDb>>;
beforeAll(async () => {
  testDb = await createTestDb();
  vi.doMock("@/lib/db/client", () => ({ db: testDb.db, sql: testDb.sql }));
});
afterAll(async () => { await testDb.sql.end(); });
beforeEach(async () => {
  await truncateAll(testDb.sql);
  await testDb.sql`INSERT INTO users (id, email) VALUES ('userA','a@a.com'),('userB','b@b.com')`;
  adapterMock.fetch.mockResolvedValue({ displayName: "x", currentRating: 1, maxRating: 1, rankLabel: "n", rankColor: "#808080", lastContests: [] });
  const { _resetForTest } = await import("@/lib/rate-limit/favorite-add");
  _resetForTest();
});

describe("authorization", () => {
  it("user A cannot DELETE user B's favorite", async () => {
    currentUser = "userB";
    const { POST } = await import("@/app/api/favorites/route");
    const c = await POST(new Request("http://x", { method: "POST", body: JSON.stringify({ platform: "codeforces", handle: "x" }) }), {} as never);
    const { id } = await c.json();

    currentUser = "userA";
    const { DELETE } = await import("@/app/api/favorites/[id]/route");
    const r = await DELETE(new Request("http://x", { method: "DELETE" }), { params: Promise.resolve({ id }) });
    expect(r.status).toBe(404);
  });
});
