import { z } from "zod";
import { NextResponse } from "next/server";
import { json400, json422, json429, json500 } from "@/lib/api/errors";
import { withAuth } from "@/lib/api/with-auth";
import { getProfile } from "@/lib/cache/profile-cache";
import { allowForce } from "@/lib/rate-limit/force-refresh";

const ParamsSchema = z.object({
  platform: z.enum(["atcoder", "codeforces"]),
  handle: z.string().regex(/^[A-Za-z0-9_\-.]{1,32}$/),
});

type Ctx = { params: Promise<{ platform: string; handle: string }> };

export const GET = withAuth<Ctx>(async (req, ctx, { userId }) => {
  const raw = await ctx.params;
  const parsed = ParamsSchema.safeParse(raw);
  if (!parsed.success) {
    return json400({ error: "invalid_params", details: parsed.error.flatten() });
  }

  const { platform, handle } = parsed.data;
  const force = new URL(req.url).searchParams.get("force") === "1";
  if (force && !allowForce(userId)) return json429();

  try {
    const row = await getProfile(platform, handle, { force });
    if (row.fetchStatus === "not_found") {
      return json422({ error: "handle_not_found", details: { platform, handle } });
    }
    return NextResponse.json({
      platform,
      handle,
      displayName: row.displayName,
      currentRating: row.currentRating,
      maxRating: row.maxRating,
      rankLabel: row.rankLabel,
      rankColor: row.rankColor,
      lastContests: row.lastContests,
      fetchedAt: row.fetchedAt,
      fetchStatus: row.fetchStatus,
    });
  } catch {
    return json500();
  }
});
