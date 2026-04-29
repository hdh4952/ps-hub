import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { favorites, cachedProfiles } from "@/lib/db/schema/domain";
import { requireSession } from "@/lib/api/session";
import { redirect } from "next/navigation";
import { HandleCard } from "../_components/HandleCard";
import { DashboardClient } from "../_components/DashboardClient";

export default async function DashboardPage() {
  const s = await requireSession();
  if (!s) redirect("/login");

  const rows = await db
    .select({
      id: favorites.id,
      platform: favorites.platform,
      handle: favorites.handle,
      handleLc: favorites.handleLc,
      alias: favorites.alias,
      displayName: cachedProfiles.displayName,
      currentRating: cachedProfiles.currentRating,
      maxRating: cachedProfiles.maxRating,
      rankLabel: cachedProfiles.rankLabel,
      rankColor: cachedProfiles.rankColor,
      lastContests: cachedProfiles.lastContests,
      fetchedAt: cachedProfiles.fetchedAt,
      fetchStatus: cachedProfiles.fetchStatus,
    })
    .from(favorites)
    .leftJoin(
      cachedProfiles,
      and(eq(cachedProfiles.platform, favorites.platform), eq(cachedProfiles.handleLc, favorites.handleLc)),
    )
    .where(eq(favorites.userId, s.userId));

  return (
    <DashboardClient initial={rows.map((r) => ({
      id: r.id, platform: r.platform as "atcoder" | "codeforces", handle: r.handle,
      alias: r.alias, displayName: r.displayName, currentRating: r.currentRating,
      maxRating: r.maxRating, rankLabel: r.rankLabel, rankColor: r.rankColor,
      lastContests: (r.lastContests as any[]) ?? [],
      fetchStatus: (r.fetchStatus as any) ?? "ok",
      fetchedAt: r.fetchedAt?.toISOString() ?? null,
    }))} />
  );
}
