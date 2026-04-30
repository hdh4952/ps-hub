"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Group = { id: string; name: string };
export function AddFavoriteForm({ groups }: { groups: Group[] }) {
  const [platform, setPlatform] = useState<"codeforces" | "atcoder">("codeforces");
  const [handle, setHandle] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setBusy(true);
    try {
      let createdId: string;
      try {
        const r = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform, handle }),
        });
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          setError(body.error ?? `error ${r.status}`);
          return;
        }
        createdId = (await r.json()).id;
      } catch {
        setError("network_error");
        return;
      }

      if (selectedGroups.length > 0) {
        try {
          const patchRes = await fetch(`/api/favorites/${createdId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ groupIds: selectedGroups }),
          });
          if (!patchRes.ok) {
            const body = await patchRes.json().catch(() => ({}));
            setError(`favorite added; group assignment failed: ${body.error ?? `error ${patchRes.status}`}`);
            return;
          }
        } catch {
          setError("favorite added; group assignment failed: network_error");
          return;
        }
      }

      router.push("/dashboard");
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-4 max-w-md">
      <div>
        <label className="text-sm">Platform</label>
        <select value={platform} onChange={(e) => setPlatform(e.target.value as "codeforces" | "atcoder")} className="border rounded px-2 py-1 ml-2">
          <option value="codeforces">Codeforces</option>
          <option value="atcoder">AtCoder</option>
        </select>
      </div>
      <div>
        <label className="text-sm">Handle</label>
        <input value={handle} onChange={(e) => setHandle(e.target.value)} required className="border rounded px-2 py-1 ml-2" />
      </div>
      {groups.length > 0 && (
        <fieldset>
          <legend className="text-sm">Groups (optional)</legend>
          <div className="flex flex-wrap gap-2 mt-2">
            {groups.map((g) => (
              <label key={g.id} className="text-sm border rounded px-2 py-1 cursor-pointer">
                <input
                  type="checkbox"
                  className="mr-1"
                  checked={selectedGroups.includes(g.id)}
                  onChange={(e) => setSelectedGroups((prev) => e.target.checked ? [...prev, g.id] : prev.filter((x) => x !== g.id))}
                />
                {g.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <button disabled={busy} className="rounded bg-black text-white text-sm px-3 py-1.5">
        {busy ? "Adding…" : "Add favorite"}
      </button>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </form>
  );
}
