import { auth } from "@/lib/auth";
import { json401 } from "@/lib/api/errors";

export default auth((req) => {
  if (!req.auth) return json401();
});

export const config = {
  // Excludes /api/auth/* (NextAuth handler) only — anchored on segment boundary.
  matcher: ["/api/((?!auth/).*)"],
};
