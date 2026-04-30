import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { json401 } from "@/lib/api/errors";
import { isE2E } from "@/lib/api/e2e-bypass";

// In E2E mode the layout/route session is bypassed via requireSession() (E2E_TEST=1).
// Skip the middleware entirely so unauthenticated browser requests can hit /api/* during e2e.
const authMiddleware = auth((req) => {
  if (!req.auth) return json401();
});

export default async function middleware(req: NextRequest) {
  if (isE2E()) return NextResponse.next();
  // Cast to keep the original NextAuth-wrapped middleware signature.
  // The auth() wrapper's typed call shape requires (req, event); we only
  // need the (req) → Response | undefined behavior, so cast at call site.
  return (authMiddleware as unknown as (r: NextRequest) => Response | Promise<Response | undefined>)(req);
}

export const config = {
  // Excludes /api/auth/* (NextAuth handler) only — anchored on segment boundary.
  matcher: ["/api/((?!auth/).*)"],
};
