import { auth } from "@/lib/auth";
import { isE2E, E2E_USER } from "./e2e-bypass";

export async function requireSession() {
  if (isE2E()) return E2E_USER;
  const session = await auth();
  if (!session?.user?.id) return null;
  return { userId: session.user.id, user: session.user };
}
