import { describe, it, expect, vi, beforeEach } from "vitest";
import history from "@/lib/adapters/__fixtures__/ac-tourist-history.json";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);
beforeEach(() => fetchMock.mockReset());

describe("atcoderAdapter.fetch", () => {
  it("normalizes AtCoder history JSON", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(history), { status: 200 }));
    const { atcoderAdapter } = await import("@/lib/adapters/atcoder");
    const result = await atcoderAdapter.fetch("tourist");
    expect(result).toMatchObject({
      displayName: "tourist",
      currentRating: expect.any(Number),
      maxRating: expect.any(Number),
      rankLabel: expect.any(String),
      rankColor: expect.stringMatching(/^#[0-9a-fA-F]{6}$/),
    });
  });

  it("returns NotFound on 404", async () => {
    fetchMock.mockResolvedValueOnce(new Response("", { status: 404 }));
    const { atcoderAdapter } = await import("@/lib/adapters/atcoder");
    expect(await atcoderAdapter.fetch("ghost")).toEqual({ kind: "not_found" });
  });

  it("returns rating=0 when handle has no rated contests", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));
    const { atcoderAdapter } = await import("@/lib/adapters/atcoder");
    const result = await atcoderAdapter.fetch("rookie");
    expect(result).toMatchObject({ currentRating: 0, maxRating: 0 });
  });

  it("throws on 5xx", async () => {
    fetchMock.mockResolvedValueOnce(new Response("oops", { status: 503 }));
    const { atcoderAdapter } = await import("@/lib/adapters/atcoder");
    await expect(atcoderAdapter.fetch("x")).rejects.toThrow();
  });
});
