import { z } from "zod";
import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { favorites } from "@/lib/db/schema/domain";
import { withAuth } from "@/lib/api/with-auth";
import { json400, json409, json422, json500 } from "@/lib/api/errors";
import { getProfile } from "@/lib/cache/profile-cache";

const HandleRe = /^[A-Za-z0-9_\-.]{1,32}$/;
const PostBody = z.object({
  platform: z.enum(["atcoder", "codeforces"]),
  handle: z.string().regex(HandleRe),
});

export const GET = withAuth(async (_req, _ctx, { userId }) => {
  const rows = await db.select().from(favorites)
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt));
  return NextResponse.json({ favorites: rows });
});

export const POST = withAuth(async (req, _ctx, { userId }) => {
  const json = await req.json().catch(() => null);
  const parsed = PostBody.safeParse(json);
  if (!parsed.success) return json400({ error: "invalid_body", details: parsed.error.flatten() });
  const { platform, handle } = parsed.data;

  let profile;
  try {
    profile = await getProfile(platform, handle);
  } catch (err) {
    console.error("[POST /api/favorites] getProfile threw", err);
    return json500();
  }
  if (profile.fetchStatus === "not_found") {
    return json422({ error: "handle_not_found", details: { platform, handle } });
  }

  try {
    const [row] = await db.insert(favorites).values({
      userId, platform, handle, handleLc: handle.toLowerCase(),
    }).returning();
    return NextResponse.json({ id: row?.id, favorite: row, profile }, { status: 201 });
  } catch (err) {
    if (isUniqueViolation(err)) return json409({ error: "already_added" });
    console.error("[POST /api/favorites]", err);
    return json500();
  }
});

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code: unknown }).code === "23505";
}
