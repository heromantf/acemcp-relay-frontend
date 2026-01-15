import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { LoginButton } from "./LoginButton";
import Link from "next/link";

export async function Header() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-[#0a0f1a]/80 backdrop-blur-md border-b border-white/[0.04]">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400">
          ACE Relay
        </span>
      </Link>
      <LoginButton user={session?.user} />
    </header>
  );
}
