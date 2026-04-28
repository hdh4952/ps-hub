import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db/client";
import { loadEnv } from "@/env";

const env = loadEnv();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    Google({ clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) { if (user?.id) token.uid = user.id; return token; },
    async session({ session, token }) {
      if (token.uid && session.user) (session.user as any).id = token.uid;
      return session;
    },
  },
});
