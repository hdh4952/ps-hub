"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function GroupForm() {
  const [name, setName] = useState(""); const [color, setColor] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const r = useRouter();
  return (
    <form onSubmit={async (e) => {
      e.preventDefault(); setErr(null);
      if (submitting) return;
      setSubmitting(true);
      try {
        const res = await fetch("/api/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, color: color || undefined }),
        });
        if (!res.ok) {
          let msg = res.statusText || "request_failed";
          try { msg = (await res.json()).error ?? msg; } catch { /* non-JSON body */ }
          setErr(msg);
          return;
        }
        setName(""); setColor(""); r.refresh();
      } catch {
        setErr("network_error");
      } finally {
        setSubmitting(false);
      }
    }} className="flex gap-2 items-center mb-4">
      <input className="border rounded px-2 py-1 text-sm" placeholder="Group name" value={name} onChange={(e) => setName(e.target.value)} required />
      <input className="border rounded px-2 py-1 text-sm w-24" placeholder="#hex" value={color} onChange={(e) => setColor(e.target.value)} pattern="^#[0-9a-fA-F]{6}$" />
      <button className="rounded bg-black text-white text-sm px-3 py-1" disabled={submitting}>Add</button>
      {err && <span className="text-red-600 text-sm">{err}</span>}
    </form>
  );
}
