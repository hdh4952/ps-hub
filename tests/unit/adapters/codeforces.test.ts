import { describe, it, expect, vi, beforeEach } from "vitest";
import userInfo from "@/lib/adapters/__fixtures__/cf-tourist-userinfo.json";
import rating from "@/lib/adapters/__fixtures__/cf-tourist-rating.json";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

beforeEach(() => fetchMock.mockReset());

describe("codeforcesAdapter.fetch", () => {
  it("returns NormalizedProfile for an existing handle", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify(userInfo), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(rating), { status: 200 }));
    const { codeforcesAdapter } = await import("@/lib/adapters/codeforces");
    const result = await codeforcesAdapter.fetch("tourist");
    expect(result).toMatchObject({
      displayName: expect.any(String),
      currentRating: expect.any(Number),
      maxRating: expect.any(Number),
      rankLabel: expect.any(String),
      rankColor: expect.stringMatching(/^#[0-9a-fA-F]{6}$/),
      lastContests: expect.any(Array),
    });
    expect((result as any).lastContests.length).toBeLessThanOrEqual(3);
  });

  it("returns NotFound when CF responds with FAILED + handles not found", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "FAILED", comment: "handles: User with handle x not found" }), { status: 400 }),
    );
    const { codeforcesAdapter } = await import("@/lib/adapters/codeforces");
    const result = await codeforcesAdapter.fetch("x");
    expect(result).toEqual({ kind: "not_found" });
  });

  it("throws on 5xx", async () => {
    fetchMock.mockResolvedValueOnce(new Response("oops", { status: 503 }));
    const { codeforcesAdapter } = await import("@/lib/adapters/codeforces");
    await expect(codeforcesAdapter.fetch("anything")).rejects.toThrow();
  });

  it("throws on schema drift (missing rating field)", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: "OK", result: [{ handle: "x" /* no rating */ }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: "OK", result: [] }), { status: 200 }));
    const { codeforcesAdapter } = await import("@/lib/adapters/codeforces");
    await expect(codeforcesAdapter.fetch("x")).rejects.toThrow();
  });
});
