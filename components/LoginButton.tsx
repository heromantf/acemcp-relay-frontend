"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LoginButtonProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function LoginButton({ user }: LoginButtonProps) {
  if (user) {
    return (
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8 ring-1 ring-white/10">
          <AvatarImage src={user.image || undefined} alt={user.name || "User avatar"} />
          <AvatarFallback className="bg-slate-800 text-slate-300 text-xs">
            {user.name?.charAt(0)?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm text-slate-400 hidden sm:inline font-light">
          {user.name}
        </span>
        <Button variant="link" asChild className="text-cyan-400 hover:text-cyan-300 px-4">
          <Link href="/console">控制台</Link>
        </Button>
      </div>
    );
  }

  return (
    <Button variant="gradient" asChild className="rounded-lg">
      <Link href="/login">登录</Link>
    </Button>
  );
}
