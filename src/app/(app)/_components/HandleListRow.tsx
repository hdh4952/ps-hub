import Link from "next/link";

export type Item = {
  id: string;
  platform: "atcoder" | "codeforces";
  handle: string;
  alias?: string | null;
  displayName?: string | null;
  currentRating?: number | null;
  maxRating?: number | null;
  rankLabel?: string | null;
  rankColor?: string | null;
  fetchStatus: "ok" | "not_found" | "error";
  lastContests?: Array<{ name: string; date: string; newRating: number; delta: number }>;
  fetchedAt: string | null;
  createdAt: string;
};

const platformLabel: Record<Item["platform"], string> = {
  atcoder: "AtCoder",
  codeforces: "Codeforces",
};

const platformBadge: Record<Item["platform"], string> = {
  atcoder: "bg-neutral-100 text-neutral-700",
  codeforces: "bg-blue-50 text-blue-700",
};

export function HandleListRow({ item }: { item: Item }) {
  const tone =
    item.fetchStatus === "not_found" ? "border-l-red-300 bg-red-50"
    : item.fetchStatus === "error"   ? "border-l-amber-300 bg-amber-50"
    : "border-l-transparent bg-white hover:bg-neutral-50";
  // Don't apply rank color over the red/amber status backgrounds — would otherwise leak a stale color from a prior successful fetch.
  const nameColor = item.fetchStatus === "ok" ? (item.rankColor ?? undefined) : undefined;
  const last = item.lastContests?.[0];
  const delta = last?.delta;

  return (
    <Link
      href={`/handles/${item.platform}/${item.handle}`}
      className={`flex items-center gap-3 px-3 py-2 border-l-4 border-y border-r border-neutral-200 -mt-px first:mt-0 ${tone} text-sm transition`}
    >
      <span className={`text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5 shrink-0 ${platformBadge[item.platform]}`}>
        {platformLabel[item.platform]}
      </span>
      <span className="font-medium truncate" style={{ color: nameColor }}>
        {item.alias ?? item.displayName ?? item.handle}
      </span>
      {item.alias && <span className="text-xs text-neutral-500 truncate">@{item.handle}</span>}
      <span className="ml-auto flex items-center gap-3 shrink-0">
        {item.fetchStatus === "ok" ? (
          <>
            <span className="font-semibold tabular-nums" style={{ color: nameColor }}>{item.currentRating ?? 0}</span>
            <span className="text-xs text-neutral-500 tabular-nums">max {item.maxRating ?? 0}</span>
            {item.rankLabel && <span className="text-xs text-neutral-500 hidden sm:inline">{item.rankLabel}</span>}
            {delta !== undefined && (
              <span className={`text-xs tabular-nums ${delta >= 0 ? "text-green-700" : "text-red-700"}`}>
                {delta >= 0 ? "▲ +" : "▽ "}{delta}
              </span>
            )}
          </>
        ) : item.fetchStatus === "not_found" ? (
          <span className="text-xs text-red-700">handle not found</span>
        ) : (
          <span className="text-xs text-amber-700">retrying…</span>
        )}
      </span>
    </Link>
  );
}
