import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { createTestDb, truncateAll } from "../../helpers/db";

const userId = "u1";
vi.mock("@/lib/api/session", () => ({
  requireSession: async () => ({ userId, user: { id: userId } }),
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
  adapterMock.fetch.mockReset();
  await testDb.sql`INSERT INTO users (id, email) VALUES (${userId}, 'u1@example.com')`;
});

const sample = {
  displayName: "tourist", currentRating: 3700, maxRating: 3979,
  rankLabel: "lgm", rankColor: "#FF0000", lastContests: [],
};

describe("/api/favorites", () => {
  it("POST validates handle by calling adapter; persists row", async () => {
    adapterMock.fetch.mockResolvedValueOnce(sample);
    const { POST, GET } = await import("@/app/api/favorites/route");
    const create = await POST(
      new Request("http://x", { method: "POST", body: JSON.stringify({ platform: "codeforces", handle: "tourist" }) }),
      {} as never,
    );
    expect(create.status).toBe(201);
    const body = await create.json();
    expect(body.id).toBeTruthy();
    expect(body.profile.fetchStatus).toBe("ok");
    const list = await GET(new Request("http://x"), {} as never);
    expect((await list.json()).favorites.length).toBe(1);
  });

  it("POST returns 422 if adapter says not_found", async () => {
    adapterMock.fetch.mockResolvedValueOnce({ kind: "not_found" });
    const { POST } = await import("@/app/api/favorites/route");
    const r = await POST(
      new Request("http://x", { method: "POST", body: JSON.stringify({ platform: "codeforces", handle: "ghost" }) }),
      {} as never,
    );
    expect(r.status).toBe(422);
  });

  it("POST duplicate handle (case-insensitive) → 409", async () => {
    adapterMock.fetch.mockResolvedValue(sample);
    const { POST } = await import("@/app/api/favorites/route");
    await POST(
      new Request("http://x", { method: "POST", body: JSON.stringify({ platform: "codeforces", handle: "tourist" }) }),
      {} as never,
    );
    const r = await POST(
      new Request("http://x", { method: "POST", body: JSON.stringify({ platform: "codeforces", handle: "TOURIST" }) }),
      {} as never,
    );
    expect(r.status).toBe(409);
  });

  it("PATCH updates alias/note; DELETE removes", async () => {
    adapterMock.fetch.mockResolvedValue(sample);
    const { POST } = await import("@/app/api/favorites/route");
    const c = await POST(
      new Request("http://x", { method: "POST", body: JSON.stringify({ platform: "codeforces", handle: "tourist" }) }),
      {} as never,
    );
    const { id } = await c.json();
    const { PATCH, DELETE } = await import("@/app/api/favorites/[id]/route");
    const patch = await PATCH(
      new Request("http://x", { method: "PATCH", body: JSON.stringify({ alias: "GM", note: "🐐" }) }),
      { params: Promise.resolve({ id }) },
    );
    expect(patch.status).toBe(200);
    const del = await DELETE(
      new Request("http://x", { method: "DELETE" }),
      { params: Promise.resolve({ id }) },
    );
    expect(del.status).toBe(204);
  });
});
