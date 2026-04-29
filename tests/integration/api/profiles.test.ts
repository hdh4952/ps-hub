import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import { createTestDb, truncateAll } from "../../helpers/db";

vi.mock("@/lib/api/session", () => ({
  requireSession: async () => ({ userId: "u1", user: { id: "u1" } }),
}));

const adapterMock = { fetch: vi.fn() };
vi.mock("@/lib/adapters", async (orig) => {
  const real = await orig<typeof import("@/lib/adapters")>();
  return { ...real, getAdapter: () => adapterMock };
});

const { GET } = await import("@/app/api/profiles/[platform]/[handle]/route");

let testDb: Awaited<ReturnType<typeof createTestDb>>;
beforeAll(async () => { testDb = await createTestDb(); });
afterAll(async () => { await testDb.sql.end(); });
beforeEach(async () => {
  await truncateAll(testDb.sql);
  adapterMock.fetch.mockReset();
  const { _resetForTest } = await import("@/lib/rate-limit/force-refresh");
  _resetForTest();
});

const sample = {
  displayName: "x", currentRating: 1, maxRating: 1,
  rankLabel: "Newbie", rankColor: "#808080", lastContests: [],
};

describe("GET /api/profiles/[platform]/[handle]", () => {
  it("returns 200 with normalized payload", async () => {
    adapterMock.fetch.mockResolvedValueOnce(sample);
    const req = new Request("http://x/api/profiles/codeforces/tourist");
    const res = await GET(req, { params: Promise.resolve({ platform: "codeforces", handle: "tourist" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.platform).toBe("codeforces");
    expect(body.handle).toBe("tourist");
    expect(body.fetchStatus).toBe("ok");
  });

  it("returns 422 when not_found", async () => {
    adapterMock.fetch.mockResolvedValueOnce({ kind: "not_found" });
    const req = new Request("http://x/api/profiles/codeforces/ghost");
    const res = await GET(req, { params: Promise.resolve({ platform: "codeforces", handle: "ghost" }) });
    expect(res.status).toBe(422);
  });

  it("rejects ?force=1 when called twice within 5s", async () => {
    adapterMock.fetch.mockResolvedValue(sample);
    const url = "http://x/api/profiles/codeforces/tourist?force=1";
    const params = { params: Promise.resolve({ platform: "codeforces", handle: "tourist" }) };
    expect((await GET(new Request(url), params)).status).toBe(200);
    expect((await GET(new Request(url), params)).status).toBe(429);
  });

  it("returns 400 on invalid platform", async () => {
    const res = await GET(
      new Request("http://x"),
      { params: Promise.resolve({ platform: "bogus", handle: "x" }) },
    );
    expect(res.status).toBe(400);
  });
});
