import { auth } from "@/lib/auth";

export async function requireSession() {
  if (process.env.E2E_TEST === "1") {
    return { userId: "e2e-user", user: { id: "e2e-user", email: "e2e@x" } };
  }
  const session = await auth();
  if (!session?.user?.id) return null;
  return { userId: session.user.id, user: session.user };
}
