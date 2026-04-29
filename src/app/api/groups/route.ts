import { z } from "zod";
import { NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { groups } from "@/lib/db/schema/domain";
import { withAuth } from "@/lib/api/with-auth";
import { json400, json409, json500 } from "@/lib/api/errors";

const PostBody = z.object({
  name: z.string().min(1).max(64),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  sortOrder: z.number().int().optional(),
});

export const GET = withAuth(async (_req, _ctx, { userId }) => {
  const rows = await db.select().from(groups)
    .where(eq(groups.userId, userId))
    .orderBy(asc(groups.sortOrder), asc(groups.createdAt));
  return NextResponse.json({ groups: rows });
});

export const POST = withAuth(async (req, _ctx, { userId }) => {
  const json = await req.json().catch(() => null);
  const parsed = PostBody.safeParse(json);
  if (!parsed.success) return json400({ error: "invalid_body", details: parsed.error.flatten() });

  try {
    const [row] = await db.insert(groups).values({ userId, ...parsed.data }).returning();
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    if (isUniqueViolation(err)) return json409({ error: "name_exists" });
    console.error("[POST /api/groups]", err);
    return json500();
  }
});

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code: unknown }).code === "23505";
}
