"use client";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { HandleListRow, Item } from "./HandleListRow";

export type Section = {
  id: string | null;
  name: string;
  color: string | null;
  items: Item[];
};

const TTL_MS = 10 * 60 * 1000;
const UNGROUPED_KEY = "_ungrouped";

type Platform = "all" | "atcoder" | "codeforces";
type SortKey = "rating" | "name" | "added";

function tabKey(sec: Section): string {
  return sec.id ?? UNGROUPED_KEY;
}

export function DashboardClient({ sections }: { sections: Section[] }) {
  const [platform, setPlatform] = useState<Platform>("all");
  const [sort, setSort] = useState<SortKey>("rating");
  const [userSelectedKey, setUserSelectedKey] = useState<string | null>(null);

  // Hide the auto-generated "그룹 없음" tab when empty; always keep user-created group tabs visible.
  const visibleTabs = useMemo(
    () => sections.filter((sec) => !(sec.id === null && sec.items.length === 0)),
    [sections],
  );

  const activeKey = useMemo(() => {
    const first = visibleTabs[0];
    if (!first) return null;
    if (userSelectedKey && visibleTabs.some((t) => tabKey(t) === userSelectedKey)) {
      return userSelectedKey;
    }
    return tabKey(first);
  }, [visibleTabs, userSelectedKey]);

  const activeSection = useMemo(
    () => visibleTabs.find((t) => tabKey(t) === activeKey) ?? null,
    [visibleTabs, activeKey],
  );

  const filteredItems = useMemo(() => {
    if (!activeSection) return [];
    return applyFilterSort(activeSection.items, platform, sort);
  }, [activeSection, platform, sort]);

  const totalAcrossTabs = sections.reduce((n, s) => n + s.items.length, 0);

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          aria-label="Filter by platform"
          value={platform}
          onChange={(e) => setPlatform(e.target.value as Platform)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="all">All</option>
          <option value="atcoder">AtCoder</option>
          <option value="codeforces">Codeforces</option>
        </select>
        <select
          aria-label="Sort by"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="rating">Rating ↓</option>
          <option value="name">Name</option>
          <option value="added">Added</option>
        </select>
      </div>

      {totalAcrossTabs === 0 ? (
        <p className="text-neutral-500">No favorites yet. Add one.</p>
      ) : (
        <>
          <div
            role="tablist"
            aria-label="Groups"
            className="flex flex-wrap gap-1 mb-4 border-b border-neutral-200"
          >
            {visibleTabs.map((tab) => {
              const k = tabKey(tab);
              const isActive = k === activeKey;
              return (
                <button
                  key={k}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setUserSelectedKey(k)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border-b-2 -mb-px transition ${
                    isActive
                      ? "border-neutral-800 text-neutral-900 font-semibold"
                      : "border-transparent text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  {tab.color && (
                    <span
                      aria-hidden
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: tab.color }}
                    />
                  )}
                  <span>{tab.name}</span>
                  <span className="text-xs text-neutral-400 tabular-nums">{tab.items.length}</span>
                </button>
              );
            })}
          </div>

          <div role="tabpanel">
            {filteredItems.length === 0 ? (
              <p className="text-neutral-500 text-sm">No favorites match the current filter.</p>
            ) : (
              <div className="flex flex-col">
                {filteredItems.map((item) => (
                  <RefreshingRow key={`${activeKey}::${item.id}`} item={item} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function applyFilterSort(items: Item[], platform: Platform, sort: SortKey): Item[] {
  const filtered = platform === "all" ? items : items.filter((i) => i.platform === platform);
  return [...filtered].sort((a, b) => {
    if (sort === "rating") return (b.currentRating ?? 0) - (a.currentRating ?? 0);
    if (sort === "name") return (a.alias ?? a.handle).localeCompare(b.alias ?? b.handle);
    return b.createdAt.localeCompare(a.createdAt);
  });
}

function RefreshingRow({ item }: { item: Item }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); }, []);
  const isStale = now !== null && (!item.fetchedAt || now - new Date(item.fetchedAt).getTime() > TTL_MS);
  const q = useQuery({
    queryKey: ["profile", item.platform, item.handle],
    queryFn: async () => {
      const r = await fetch(`/api/profiles/${item.platform}/${item.handle}`);
      if (!r.ok) throw new Error(String(r.status));
      return r.json() as Promise<Partial<Item>>;
    },
    enabled: isStale,
    staleTime: TTL_MS,
    initialData: undefined,
  });
  const data: Partial<Item> = q.data ?? {};
  const fetchStatus: Item["fetchStatus"] = q.isError ? "error" : ((data.fetchStatus as Item["fetchStatus"]) ?? item.fetchStatus);
  const merged: Item = { ...item, ...data, fetchStatus };
  return <HandleListRow item={merged} />;
}
