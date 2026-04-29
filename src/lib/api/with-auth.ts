import type { NextResponse } from "next/server";
import { json401 } from "@/lib/api/errors";
import { requireSession } from "@/lib/api/session";

export type AuthContext = { userId: string; user: NonNullable<Awaited<ReturnType<typeof requireSession>>>["user"] };

type RouteHandler<TCtx> = (
  req: Request,
  ctx: TCtx,
  auth: AuthContext,
) => Promise<Response | NextResponse>;

export function withAuth<TCtx>(handler: RouteHandler<TCtx>) {
  return async (req: Request, ctx: TCtx): Promise<Response | NextResponse> => {
    const session = await requireSession();
    if (!session) return json401();
    return handler(req, ctx, session);
  };
}
