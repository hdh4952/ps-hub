import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { createTestDb, truncateAll } from "../../helpers/db";

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
beforeEach(async () => {
  await truncateAll(testDb.sql);
  adapterMock.fetch.mockReset();
  const { _resetNowForTest } = await import("@/lib/cache/profile-cache");
  _resetNowForTest();
});
afterAll(async () => { await testDb.sql.end(); });

const sample = {
  displayName: "tourist", currentRating: 3700, maxRating: 3979,
  rankLabel: "legendary grandmaster", rankColor: "#FF0000", lastContests: [],
};

describe("profile-cache", () => {
  it("populates cache on first call (miss)", async () => {
    adapterMock.fetch.mockResolvedValueOnce(sample);
    const { getProfile } = await import("@/lib/cache/profile-cache");
    const res = await getProfile("codeforces", "tourist");
    expect(res.fetchStatus).toBe("ok");
    expect(adapterMock.fetch).toHaveBeenCalledTimes(1);
  });

  it("returns cached on second call within TTL (hit)", async () => {
    adapterMock.fetch.mockResolvedValueOnce(sample);
    const { getProfile } = await import("@/lib/cache/profile-cache");
    await getProfile("codeforces", "tourist");
    await getProfile("codeforces", "tourist");
    expect(adapterMock.fetch).toHaveBeenCalledTimes(1);
  });

  it("refetches when TTL expired", async () => {
    adapterMock.fetch.mockResolvedValueOnce(sample).mockResolvedValueOnce({ ...sample, currentRating: 4000 });
    const { getProfile, _setNowForTest } = await import("@/lib/cache/profile-cache");
    _setNowForTest(new Date("2026-04-29T00:00:00Z"));
    await getProfile("codeforces", "tourist");
    _setNowForTest(new Date("2026-04-29T00:11:00Z")); // > 10 minutes
    const r = await getProfile("codeforces", "tourist");
    expect(r.currentRating).toBe(4000);
    expect(adapterMock.fetch).toHaveBeenCalledTimes(2);
  });

  it("records 'not_found' status without further refetches inside TTL", async () => {
    adapterMock.fetch.mockResolvedValueOnce({ kind: "not_found" });
    const { getProfile } = await import("@/lib/cache/profile-cache");
    const r = await getProfile("codeforces", "ghost");
    expect(r.fetchStatus).toBe("not_found");
    await getProfile("codeforces", "ghost");
    expect(adapterMock.fetch).toHaveBeenCalledTimes(1);
  });

  it("preserves prior cache when adapter throws (transient)", async () => {
    adapterMock.fetch.mockResolvedValueOnce(sample);
    const { getProfile, _setNowForTest } = await import("@/lib/cache/profile-cache");
    _setNowForTest(new Date("2026-04-29T00:00:00Z"));
    await getProfile("codeforces", "tourist");
    _setNowForTest(new Date("2026-04-29T00:11:00Z"));
    adapterMock.fetch.mockRejectedValueOnce(new Error("upstream 503"));
    const r = await getProfile("codeforces", "tourist");
    expect(r.currentRating).toBe(3700); // stale value retained
  });

  it("force=true bypasses TTL", async () => {
    adapterMock.fetch.mockResolvedValue(sample);
    const { getProfile } = await import("@/lib/cache/profile-cache");
    await getProfile("codeforces", "tourist");
    await getProfile("codeforces", "tourist", { force: true });
    expect(adapterMock.fetch).toHaveBeenCalledTimes(2);
  });

  it("retries error rows after the short error TTL", async () => {
    adapterMock.fetch
      .mockRejectedValueOnce(new Error("upstream 503"))
      .mockResolvedValueOnce(sample);
    const { getProfile, _setNowForTest } = await import("@/lib/cache/profile-cache");
    _setNowForTest(new Date("2026-04-29T00:00:00Z"));
    const r1 = await getProfile("codeforces", "tourist");
    expect(r1.fetchStatus).toBe("error");
    _setNowForTest(new Date("2026-04-29T00:00:31Z")); // > 30 seconds
    const r2 = await getProfile("codeforces", "tourist");
    expect(r2.fetchStatus).toBe("ok");
    expect(adapterMock.fetch).toHaveBeenCalledTimes(2);
  });
});
