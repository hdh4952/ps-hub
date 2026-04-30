"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
type G = { id: string; name: string; color: string | null };

function DeleteButton({ id }: { id: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const r = useRouter();
  return (
    <>
      <button
        className="text-xs text-red-600"
        disabled={submitting}
        onClick={async () => {
          if (submitting) return;
          setSubmitting(true); setErr(null);
          try {
            const res = await fetch(`/api/groups/${id}`, { method: "DELETE" });
            if (!res.ok) {
              let msg = res.statusText || "request_failed";
              try { msg = (await res.json()).error ?? msg; } catch { /* non-JSON body */ }
              setErr(msg);
              return;
            }
            r.refresh();
          } catch {
            setErr("network_error");
          } finally {
            setSubmitting(false);
          }
        }}>
        Delete
      </button>
      {err && <span className="text-xs text-red-600 ml-1">{err}</span>}
    </>
  );
}

export function GroupList({ groups }: { groups: G[] }) {
  return (
    <ul className="divide-y border rounded bg-white">
      {groups.map((g) => (
        <li key={g.id} className="p-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            {g.color && <span className="inline-block w-3 h-3 rounded-full" style={{ background: g.color }} />}
            {g.name}
          </span>
          <DeleteButton id={g.id} />
        </li>
      ))}
      {groups.length === 0 && <li className="p-3 text-neutral-500">No groups yet.</li>}
    </ul>
  );
}
