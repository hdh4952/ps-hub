"use client";
import { useRouter } from "next/navigation";
type G = { id: string; name: string; color: string | null };
export function GroupList({ groups }: { groups: G[] }) {
  const r = useRouter();
  return (
    <ul className="divide-y border rounded bg-white">
      {groups.map((g) => (
        <li key={g.id} className="p-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            {g.color && <span className="inline-block w-3 h-3 rounded-full" style={{ background: g.color }} />}
            {g.name}
          </span>
          <button
            className="text-xs text-red-600"
            onClick={async () => { await fetch(`/api/groups/${g.id}`, { method: "DELETE" }); r.refresh(); }}>
            Delete
          </button>
        </li>
      ))}
      {groups.length === 0 && <li className="p-3 text-neutral-500">No groups yet.</li>}
    </ul>
  );
}
