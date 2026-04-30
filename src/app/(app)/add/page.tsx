import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { groups } from "@/lib/db/schema/domain";
import { requireSession } from "@/lib/api/session";
import { redirect } from "next/navigation";
import { AddFavoriteForm } from "../_components/AddFavoriteForm";

export default async function AddPage() {
  const s = await requireSession();
  if (!s) redirect("/login");
  const rows = await db.select({ id: groups.id, name: groups.name }).from(groups)
    .where(eq(groups.userId, s.userId)).orderBy(asc(groups.name));
  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Add favorite</h1>
      <AddFavoriteForm groups={rows} />
    </div>
  );
}
