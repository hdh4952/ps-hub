import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { createTestDb, truncateAll } from "../../helpers/db";

const userId = "u1";
vi.mock("@/lib/api/session", () => ({
  requireSession: async () => ({ userId, user: { id: userId } }),
}));

let testDb: Awaited<ReturnType<typeof createTestDb>>;
beforeAll(async () => {
  testDb = await createTestDb();
  vi.doMock("@/lib/db/client", () => ({ db: testDb.db, sql: testDb.sql }));
});
afterAll(async () => { await testDb.sql.end(); });
beforeEach(async () => {
  await truncateAll(testDb.sql);
  await testDb.sql`INSERT INTO users (id, email) VALUES (${userId}, 'u1@example.com')`;
});

describe("/api/groups", () => {
  it("POST creates a group; GET returns it", async () => {
    const { POST, GET } = await import("@/app/api/groups/route");
    const create = await POST(
      new Request("http://x", { method: "POST", body: JSON.stringify({ name: "친구", color: "#ff0000" }) }),
      {} as never,
    );
    expect(create.status).toBe(201);
    const list = await GET(new Request("http://x"), {} as never);
    const body = await list.json();
    expect(body.groups).toHaveLength(1);
    expect(body.groups[0].name).toBe("친구");
  });

  it("POST duplicate name → 409", async () => {
    const { POST } = await import("@/app/api/groups/route");
    await POST(
      new Request("http://x", { method: "POST", body: JSON.stringify({ name: "dup" }) }),
      {} as never,
    );
    const r = await POST(
      new Request("http://x", { method: "POST", body: JSON.stringify({ name: "dup" }) }),
      {} as never,
    );
    expect(r.status).toBe(409);
  });

  it("PATCH on non-UUID id returns 400 invalid_params (not 500)", async () => {
    const { PATCH } = await import("@/app/api/groups/[id]/route");
    const res = await PATCH(
      new Request("http://x", { method: "PATCH", body: JSON.stringify({ name: "x" }) }),
      { params: Promise.resolve({ id: "not-a-uuid" }) },
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("invalid_params");
  });

  it("DELETE on non-UUID id returns 400 invalid_params (not 500)", async () => {
    const { DELETE } = await import("@/app/api/groups/[id]/route");
    const res = await DELETE(
      new Request("http://x", { method: "DELETE" }),
      { params: Promise.resolve({ id: "not-a-uuid" }) },
    );
    expect(res.status).toBe(400);
  });

  it("PATCH renames; DELETE removes", async () => {
    const { POST } = await import("@/app/api/groups/route");
    const create = await POST(
      new Request("http://x", { method: "POST", body: JSON.stringify({ name: "a" }) }),
      {} as never,
    );
    const { id } = await create.json();
    const { PATCH, DELETE } = await import("@/app/api/groups/[id]/route");
    const patch = await PATCH(
      new Request("http://x", { method: "PATCH", body: JSON.stringify({ name: "b" }) }),
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
