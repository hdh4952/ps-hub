import { signIn } from "@/lib/auth";

export default function LoginPage() {
  return (
    <form action={async () => { "use server"; await signIn("google", { redirectTo: "/dashboard" }); }}>
      <button className="rounded-md bg-black text-white px-4 py-2 text-sm font-medium" type="submit">
        Sign in with Google
      </button>
    </form>
  );
}
