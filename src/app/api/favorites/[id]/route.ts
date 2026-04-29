import { z } from "zod";
import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { favorites, favoriteGroups, groups } from "@/lib/db/schema/domain";
import { withAuth } from "@/lib/api/with-auth";
import { json400, json404, json500 } from "@/lib/api/errors";

const ParamsSchema = z.object({ id: z.string().uuid() });

const PatchBody = z.object({
  alias: z.string().max(64).nullable().optional(),
  note: z.string().max(500).nullable().optional(),
  groupIds: z.array(z.string().uuid()).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withAuth<Ctx>(async (req, ctx, { userId }) => {
  const rawParams = await ctx.params;
  const paramsParsed = ParamsSchema.safeParse(rawParams);
  if (!paramsParsed.success) return json400({ error: "invalid_params" });
  const { id } = paramsParsed.data;

  const json = await req.json().catch(() => null);
  const parsed = PatchBody.safeParse(json);
  if (!parsed.success) return json400({ error: "invalid_body", details: parsed.error.flatten() });

  try {
    const owned = await db.select({ id: favorites.id }).from(favorites)
      .where(and(eq(favorites.id, id), eq(favorites.userId, userId))).limit(1);
    if (owned.length === 0) return json404();

    const { groupIds, ...rest } = parsed.data;

    if (Object.keys(rest).length > 0) {
      await db.update(favorites).set(rest).where(eq(favorites.id, id));
    }

    if (groupIds !== undefined) {
      if (groupIds.length > 0) {
        const owns = await db.select({ id: groups.id }).from(groups)
          .where(and(eq(groups.userId, userId), inArray(groups.id, groupIds)));
        if (owns.length !== groupIds.length) return json400({ error: "invalid_group_ids" });
      }
      await db.delete(favoriteGroups).where(eq(favoriteGroups.favoriteId, id));
      if (groupIds.length > 0) {
        await db.insert(favoriteGroups).values(groupIds.map((g) => ({ favoriteId: id, groupId: g })));
      }
    }

    const [row] = await db.select().from(favorites).where(eq(favorites.id, id));
    return NextResponse.json(row);
  } catch (err) {
    console.error("[PATCH /api/favorites/[id]]", err);
    return json500();
  }
});

export const DELETE = withAuth<Ctx>(async (_req, ctx, { userId }) => {
  const rawParams = await ctx.params;
  const paramsParsed = ParamsSchema.safeParse(rawParams);
  if (!paramsParsed.success) return json400({ error: "invalid_params" });
  const { id } = paramsParsed.data;

  try {
    const result = await db.delete(favorites)
      .where(and(eq(favorites.id, id), eq(favorites.userId, userId))).returning();
    if (result.length === 0) return json404();
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/favorites/[id]]", err);
    return json500();
  }
});
