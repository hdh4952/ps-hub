import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { cachedProfiles } from "@/lib/db/schema/domain";
import { getAdapter } from "@/lib/adapters";
import type { Platform } from "@/lib/adapters/types";

const TTL_MS = 10 * 60 * 1000;

let _now: () => Date = () => new Date();
export function _setNowForTest(d: Date) { _now = () => d; }

export type CachedRow = typeof cachedProfiles.$inferSelect;

export async function getProfile(
  platform: Platform,
  handle: string,
  opts: { force?: boolean } = {},
): Promise<CachedRow> {
  const handleLc = handle.toLowerCase();
  const existing = await db.select().from(cachedProfiles)
    .where(and(eq(cachedProfiles.platform, platform), eq(cachedProfiles.handleLc, handleLc)))
    .limit(1).then((r) => r[0]);

  const fresh = existing?.fetchedAt && _now().getTime() - existing.fetchedAt.getTime() < TTL_MS;
  if (existing && fresh && !opts.force) return existing;

  // Refresh
  let next: CachedRow;
  try {
    const result = await getAdapter(platform).fetch(handle);
    if ("kind" in result) {
      next = await upsert({
        platform, handleLc, fetchedAt: _now(), fetchStatus: "not_found",
        displayName: null, currentRating: null, maxRating: null,
        rankLabel: null, rankColor: null, lastContests: null, fetchError: null,
      });
    } else {
      next = await upsert({
        platform, handleLc,
        displayName: result.displayName,
        currentRating: result.currentRating,
        maxRating: result.maxRating,
        rankLabel: result.rankLabel,
        rankColor: result.rankColor,
        lastContests: result.lastContests as unknown as object,
        fetchedAt: _now(), fetchStatus: "ok", fetchError: null,
      });
    }
    return next;
  } catch (err) {
    if (existing) return existing; // preserve stale on transient error
    next = await upsert({
      platform, handleLc, fetchedAt: _now(), fetchStatus: "error",
      fetchError: err instanceof Error ? err.message : String(err),
      displayName: null, currentRating: null, maxRating: null,
      rankLabel: null, rankColor: null, lastContests: null,
    });
    return next;
  }
}

async function upsert(row: typeof cachedProfiles.$inferInsert): Promise<CachedRow> {
  const result = await db.insert(cachedProfiles).values(row)
    .onConflictDoUpdate({
      target: [cachedProfiles.platform, cachedProfiles.handleLc],
      set: {
        displayName: row.displayName, currentRating: row.currentRating,
        maxRating: row.maxRating, rankLabel: row.rankLabel,
        rankColor: row.rankColor, lastContests: row.lastContests,
        fetchedAt: row.fetchedAt, fetchStatus: row.fetchStatus, fetchError: row.fetchError,
      },
    })
    .returning();
  if (!result[0]) throw new Error("upsert returned no row");
  return result[0];
}
