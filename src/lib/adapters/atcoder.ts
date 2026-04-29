import { z } from "zod";
import type { PlatformAdapter, NormalizedProfile, NotFound } from "./types";

const Entry = z.object({
  IsRated: z.boolean(),
  Place: z.number(),
  OldRating: z.number(),
  NewRating: z.number(),
  Performance: z.number(),
  InnerPerformance: z.number().optional(),
  ContestName: z.string(),
  EndTime: z.string(),
});
const History = z.array(Entry);

// AtCoder algorithm tier table (8 tiers)
function tier(rating: number): { label: string; color: string } {
  if (rating < 400)  return { label: "灰", color: "#808080" };
  if (rating < 800)  return { label: "茶", color: "#804000" };
  if (rating < 1200) return { label: "緑", color: "#008000" };
  if (rating < 1600) return { label: "水", color: "#00C0C0" };
  if (rating < 2000) return { label: "青", color: "#0000FF" };
  if (rating < 2400) return { label: "黄", color: "#C0C000" };
  if (rating < 2800) return { label: "橙", color: "#FF8000" };
  return { label: "赤", color: "#FF0000" };
}

async function doFetch(handle: string): Promise<NormalizedProfile | NotFound> {
  const url = `https://atcoder.jp/users/${encodeURIComponent(handle)}/history/json`;
  const r = await fetch(url, { cache: "no-store" });
  if (r.status === 404) return { kind: "not_found" };
  if (r.status >= 500) throw new Error(`upstream ${r.status}`);
  if (!r.ok) throw new Error(`upstream ${r.status}`);

  const raw = await r.json();
  const entries = History.parse(raw);

  const ratedSorted = entries.filter((e) => e.IsRated).sort((a, b) => a.EndTime.localeCompare(b.EndTime));
  const current = ratedSorted.at(-1)?.NewRating ?? 0;
  const max = ratedSorted.reduce((m, e) => Math.max(m, e.NewRating), 0);
  const t = tier(current);

  const last = ratedSorted.slice(-3).reverse().map((e) => ({
    name: e.ContestName,
    date: new Date(e.EndTime).toISOString(),
    performance: e.Performance,
    newRating: e.NewRating,
    delta: e.NewRating - e.OldRating,
  }));

  return {
    displayName: handle,
    currentRating: current,
    maxRating: max,
    rankLabel: t.label,
    rankColor: t.color,
    lastContests: last,
  };
}

export const atcoderAdapter: PlatformAdapter = {
  platform: "atcoder",
  fetch: doFetch,
};
