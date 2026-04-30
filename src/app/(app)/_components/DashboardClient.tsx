"use client";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { HandleCard, HandleCardProps } from "./HandleCard";

type Item = HandleCardProps & { id: string; fetchedAt: string | null; createdAt: string };

const TTL_MS = 10 * 60 * 1000;

export function DashboardClient({ initial }: { initial: Item[] }) {
  const [platform, setPlatform] = useState<"all" | "atcoder" | "codeforces">("all");
  const [sort, setSort] = useState<"rating" | "name" | "added">("rating");

  const filtered = useMemo(() => {
    const base = platform === "all" ? initial : initial.filter((i) => i.platform === platform);
    return [...base].sort((a, b) => {
      if (sort === "rating") return (b.currentRating ?? 0) - (a.currentRating ?? 0);
      if (sort === "name") return (a.alias ?? a.handle).localeCompare(b.alias ?? b.handle);
      return b.createdAt.localeCompare(a.createdAt); // "added" — newest first
    });
  }, [initial, platform, sort]);

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <select aria-label="Filter by platform" value={platform} onChange={(e) => setPlatform(e.target.value as "all" | "atcoder" | "codeforces")} className="border rounded px-2 py-1 text-sm">
          <option value="all">All</option>
          <option value="atcoder">AtCoder</option>
          <option value="codeforces">Codeforces</option>
        </select>
        <select aria-label="Sort by" value={sort} onChange={(e) => setSort(e.target.value as "rating" | "name" | "added")} className="border rounded px-2 py-1 text-sm">
          <option value="rating">Rating ↓</option>
          <option value="name">Name</option>
          <option value="added">Added</option>
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => <RefreshingCard key={item.id} item={item} />)}
        {filtered.length === 0 && <p className="text-neutral-500">No favorites yet. Add one.</p>}
      </div>
    </div>
  );
}

function RefreshingCard({ item }: { item: Item }) {
  const isStale = !item.fetchedAt || Date.now() - new Date(item.fetchedAt).getTime() > TTL_MS;
  const q = useQuery({
    queryKey: ["profile", item.platform, item.handle],
    queryFn: async () => {
      const r = await fetch(`/api/profiles/${item.platform}/${item.handle}`);
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    },
    enabled: isStale,
    initialData: undefined,
  });
  const data = q.data ?? item;
  return <HandleCard {...item} {...data} fetchStatus={(data?.fetchStatus ?? item.fetchStatus) as any} />;
}
