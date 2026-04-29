import Link from "next/link";

export type HandleCardProps = {
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
};

const platformLabel: Record<HandleCardProps["platform"], string> = {
  atcoder: "AtCoder",
  codeforces: "Codeforces",
};

export function HandleCard(p: HandleCardProps) {
  const tone =
    p.fetchStatus === "not_found" ? "border-red-200 bg-red-50"
    : p.fetchStatus === "error"   ? "border-amber-200 bg-amber-50"
    : "border-neutral-200 bg-white";
  // Don't apply rank color to text shown over the red/amber status backgrounds — would otherwise leak a stale color from a prior successful fetch.
  const nameColor = p.fetchStatus === "ok" ? (p.rankColor ?? undefined) : undefined;
  return (
    <Link
      href={`/handles/${p.platform}/${p.handle}`}
      className={`block rounded-lg border p-4 hover:shadow-sm transition ${tone}`}
    >
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">{platformLabel[p.platform]}</div>
          <div className="text-base font-semibold" style={{ color: nameColor }}>
            {p.alias ?? p.displayName ?? p.handle}
          </div>
          {p.alias && <div className="text-xs text-neutral-500">@{p.handle}</div>}
        </div>
        <div className="text-right">
          {p.fetchStatus === "ok" ? (
            <>
              <div className="text-xl font-bold" style={{ color: nameColor }}>{p.currentRating ?? 0}</div>
              <div className="text-xs text-neutral-500">max {p.maxRating ?? 0} · {p.rankLabel}</div>
            </>
          ) : p.fetchStatus === "not_found" ? (
            <div className="text-xs text-red-700">handle not found</div>
          ) : (
            <div className="text-xs text-amber-700">retrying…</div>
          )}
        </div>
      </div>
      {p.lastContests && p.lastContests.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-neutral-600">
          {p.lastContests.slice(0, 3).map((c) => (
            <li key={c.date} className="flex justify-between">
              <span className="truncate mr-2">{c.name}</span>
              <span className={c.delta >= 0 ? "text-green-700" : "text-red-700"}>
                {c.delta >= 0 ? "+" : ""}{c.delta}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Link>
  );
}
