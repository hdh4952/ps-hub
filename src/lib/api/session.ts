import { auth } from "@/lib/auth";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return { userId: session.user.id, user: session.user };
}
