import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { groups } from "@/lib/db/schema/domain";
import { requireSession } from "@/lib/api/session";
import { redirect } from "next/navigation";
import { GroupForm } from "../_components/GroupForm";
import { GroupList } from "../_components/GroupList";

export default async function GroupsPage() {
  const s = await requireSession();
  if (!s) redirect("/login");
  const rows = await db.select().from(groups).where(eq(groups.userId, s.userId)).orderBy(asc(groups.sortOrder), asc(groups.createdAt));
  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold mb-4">Groups</h1>
      <GroupForm />
      <GroupList groups={rows.map((g) => ({ id: g.id, name: g.name, color: g.color }))} />
    </div>
  );
}
