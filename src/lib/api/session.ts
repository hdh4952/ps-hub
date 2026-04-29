import { auth } from "@/lib/auth";

export async function requireSession() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!session?.user || !userId) return null;
  return { userId, user: session.user };
}
