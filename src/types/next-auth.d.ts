import type { DefaultSession } from "next-auth";

declare module "@auth/core/types" {
  interface Session {
    user: DefaultSession["user"] & { id: string };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    uid?: string;
  }
}
