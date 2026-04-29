import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white">
        <nav className="max-w-6xl mx-auto flex items-center justify-between p-4">
          <Link href="/dashboard" className="font-semibold">ps-hub</Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/groups">Groups</Link>
            <Link href="/add">Add</Link>
            <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
              <button type="submit" className="text-neutral-600 hover:text-neutral-900">Sign out</button>
            </form>
          </div>
        </nav>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto p-6">{children}</main>
    </div>
  );
}
