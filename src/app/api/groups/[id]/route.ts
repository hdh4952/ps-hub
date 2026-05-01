import { z } from "zod";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { groups } from "@/lib/db/schema/domain";
import { withAuth } from "@/lib/api/with-auth";
import { json400, json404, json409, json500 } from "@/lib/api/errors";
import { isUniqueViolation } from "@/lib/db/errors";

const ParamsSchema = z.object({ id: z.string().uuid() });

const PatchBody = z.object({
  name: z.string().min(1).max(64).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  sortOrder: z.number().int().optional(),
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
    const [row] = await db.update(groups)
      .set(parsed.data)
      .where(and(eq(groups.id, id), eq(groups.userId, userId)))
      .returning();
    if (!row) return json404();
    return NextResponse.json(row);
  } catch (err) {
    if (isUniqueViolation(err)) return json409({ error: "name_exists" });
    console.error("[PATCH /api/groups/[id]]", err);
    return json500();
  }
});

export const DELETE = withAuth<Ctx>(async (_req, ctx, { userId }) => {
  const rawParams = await ctx.params;
  const paramsParsed = ParamsSchema.safeParse(rawParams);
  if (!paramsParsed.success) return json400({ error: "invalid_params" });
  const { id } = paramsParsed.data;

  try {
    const result = await db.delete(groups)
      .where(and(eq(groups.id, id), eq(groups.userId, userId)))
      .returning();
    if (result.length === 0) return json404();
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/groups/[id]]", err);
    return json500();
  }
});
