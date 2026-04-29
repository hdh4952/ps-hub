import { z } from "zod";
import type { PlatformAdapter, NormalizedProfile, NotFound } from "./types";

const UserInfoEntry = z.object({
  handle: z.string(),
  rating: z.number().optional(),
  maxRating: z.number().optional(),
  rank: z.string().optional(),
  maxRank: z.string().optional(),
});
const UserInfoOk = z.object({ status: z.literal("OK"), result: z.array(UserInfoEntry).min(1) });
const Failed = z.object({ status: z.literal("FAILED"), comment: z.string() });

const RatingEntry = z.object({
  contestName: z.string(),
  ratingUpdateTimeSeconds: z.number(),
  oldRating: z.number(),
  newRating: z.number(),
});
const RatingOk = z.object({ status: z.literal("OK"), result: z.array(RatingEntry) });

const rankColor: Record<string, string> = {
  newbie: "#808080",
  pupil: "#008000",
  specialist: "#03A89E",
  expert: "#0000FF",
  "candidate master": "#AA00AA",
  master: "#FF8C00",
  "international master": "#FF8C00",
  grandmaster: "#FF0000",
  "international grandmaster": "#FF0000",
  "legendary grandmaster": "#FF0000",
};

async function getJson(url: string): Promise<unknown> {
  const r = await fetch(url, { cache: "no-store" });
  if (r.status >= 500) throw new Error(`upstream ${r.status}`);
  return r.json();
}

async function doFetch(handle: string): Promise<NormalizedProfile | NotFound> {
  const infoRaw = await getJson(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`);
  const failed = Failed.safeParse(infoRaw);
  if (failed.success && /not found/i.test(failed.data.comment)) return { kind: "not_found" };

  const info = UserInfoOk.parse(infoRaw).result[0];
  if (!info) throw new Error("empty user.info result");

  const ratingRaw = await getJson(`https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`);
  const ratingArr = RatingOk.parse(ratingRaw).result;

  const last = ratingArr.slice(-3).reverse().map((r) => ({
    name: r.contestName,
    date: new Date(r.ratingUpdateTimeSeconds * 1000).toISOString(),
    newRating: r.newRating,
    delta: r.newRating - r.oldRating,
  }));

  const rank = (info.rank ?? "newbie").toLowerCase();
  if (info.rating === undefined || info.maxRating === undefined) throw new Error("missing rating fields");
  return {
    displayName: info.handle,
    currentRating: info.rating,
    maxRating: info.maxRating,
    rankLabel: info.rank ?? "Newbie",
    rankColor: rankColor[rank] ?? "#808080",
    lastContests: last,
  };
}

export const codeforcesAdapter: PlatformAdapter = {
  platform: "codeforces",
  fetch: doFetch,
};
