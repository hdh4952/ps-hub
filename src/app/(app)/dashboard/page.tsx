import { and, eq, asc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { favorites, cachedProfiles, groups, favoriteGroups } from "@/lib/db/schema/domain";
import { requireSession } from "@/lib/api/session";
import { redirect } from "next/navigation";
import { DashboardClient, Section } from "../_components/DashboardClient";
import type { Item } from "../_components/HandleListRow";

export default async function DashboardPage() {
  const s = await requireSession();
  if (!s) redirect("/login");
  const userId = s.userId;

  const [favRows, userGroups, fgRows] = await Promise.all([
    db
      .select({
        id: favorites.id,
        platform: favorites.platform,
        handle: favorites.handle,
        handleLc: favorites.handleLc,
        alias: favorites.alias,
        createdAt: favorites.createdAt,
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
      .where(eq(favorites.userId, userId)),
    db
      .select()
      .from(groups)
      .where(eq(groups.userId, userId))
      .orderBy(asc(groups.sortOrder), asc(groups.createdAt)),
    db
      .select({ favoriteId: favoriteGroups.favoriteId, groupId: favoriteGroups.groupId })
      .from(favoriteGroups)
      .innerJoin(favorites, eq(favorites.id, favoriteGroups.favoriteId))
      .where(eq(favorites.userId, userId)),
  ]);

  const items: Item[] = favRows.map((r) => ({
    id: r.id,
    platform: r.platform as Item["platform"],
    handle: r.handle,
    alias: r.alias,
    displayName: r.displayName,
    currentRating: r.currentRating,
    maxRating: r.maxRating,
    rankLabel: r.rankLabel,
    rankColor: r.rankColor,
    lastContests: (r.lastContests as Item["lastContests"]) ?? [],
    // Default to "error" (not "ok") when no cache row yet — HandleListRow then renders the amber "retrying…" state until SWR populates real data, instead of misleading "0 / max 0 · null".
    fetchStatus: (r.fetchStatus as Item["fetchStatus"]) ?? "error",
    fetchedAt: r.fetchedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  }));

  const fgByFav = new Map<string, Set<string>>();
  for (const r of fgRows) {
    let set = fgByFav.get(r.favoriteId);
    if (!set) { set = new Set(); fgByFav.set(r.favoriteId, set); }
    set.add(r.groupId);
  }

  const ungroupedItems: Item[] = [];
  const byGroup = new Map<string, Item[]>();
  for (const item of items) {
    const groupIds = fgByFav.get(item.id);
    if (!groupIds || groupIds.size === 0) {
      ungroupedItems.push(item);
    } else {
      for (const gid of groupIds) {
        let arr = byGroup.get(gid);
        if (!arr) { arr = []; byGroup.set(gid, arr); }
        arr.push(item);
      }
    }
  }

  const sections: Section[] = [
    { id: null, name: "그룹 없음", color: null, items: ungroupedItems },
    ...userGroups.map((g) => ({
      id: g.id,
      name: g.name,
      color: g.color,
      items: byGroup.get(g.id) ?? [],
    })),
  ];

  return <DashboardClient sections={sections} />;
}
