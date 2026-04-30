import { notFound } from "next/navigation";
import { requireSession } from "@/lib/api/session";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/cache/profile-cache";

type Props = { params: Promise<{ platform: string; handle: string }> };

export default async function HandleDetail({ params }: Props) {
  const s = await requireSession();
  if (!s) redirect("/login");
  const { platform, handle } = await params;
  if (platform !== "atcoder" && platform !== "codeforces") notFound();

  const row = await getProfile(platform, handle);
  if (row.fetchStatus === "not_found") {
    return <p className="text-red-600">Handle <code>{handle}</code> not found on {platform}.</p>;
  }

  // Don't apply rank color to text outside the canonical "ok" state — would otherwise leak a stale color from a prior successful fetch onto a degraded view.
  const nameColor = row.fetchStatus === "ok" ? (row.rankColor ?? undefined) : undefined;

  const isErrorWithStaleData = row.fetchStatus === "error" && (row.displayName !== null || row.currentRating !== null);
  const isErrorWithNoData = row.fetchStatus === "error" && row.displayName === null && row.currentRating === null;

  if (isErrorWithNoData) {
    return (
      <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-4">
        Couldn't fetch <code>{handle}</code> from {platform}. Please try again later.
      </p>
    );
  }

  const last = (row.lastContests as Array<any>) ?? [];

  return (
    <div className="space-y-4">
      {isErrorWithStaleData && (
        <div className="text-amber-800 bg-amber-50 border border-amber-200 rounded p-3 text-sm">
          Couldn't refresh from {platform} — showing last cached data{row.fetchedAt ? ` from ${new Date(row.fetchedAt).toLocaleString()}` : ""}.
        </div>
      )}
      <header>
        <div className="text-xs uppercase text-neutral-500">{platform}</div>
        <h1 className="text-2xl font-semibold" style={{ color: nameColor }}>{row.displayName ?? handle}</h1>
        <p className="text-neutral-600">
          Current <strong style={{ color: nameColor }}>{row.currentRating ?? 0}</strong>
          {" · "}Max {row.maxRating ?? 0} · {row.rankLabel}
        </p>
      </header>
      <section>
        <h2 className="text-lg font-medium mb-2">Recent contests</h2>
        <table className="w-full text-sm border bg-white">
          <thead className="bg-neutral-100"><tr><th className="text-left p-2">Contest</th><th className="text-left p-2">Date</th><th className="text-right p-2">Δ</th><th className="text-right p-2">New rating</th></tr></thead>
          <tbody>
            {last.map((c: any) => (
              <tr key={c.date} className="border-t">
                <td className="p-2">{c.name}</td>
                <td className="p-2">{new Date(c.date).toLocaleDateString()}</td>
                <td className={`p-2 text-right ${c.delta >= 0 ? "text-green-700" : "text-red-700"}`}>{c.delta >= 0 ? "+" : ""}{c.delta}</td>
                <td className="p-2 text-right">{c.newRating}</td>
              </tr>
            ))}
            {last.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-neutral-500">No contests yet.</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}
