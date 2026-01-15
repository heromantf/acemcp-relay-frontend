"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronRight, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const handleLogin = () => {
    authClient.signIn.oauth2({
      providerId: "linuxdo",
      callbackURL: "/",
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center overflow-hidden animate-page-fade-in">
      {/* Aurora background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Aurora blob 1 - Main cyan */}
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[250px] bg-cyan-500/40 blur-[100px] rounded-full animate-aurora-1" />
        {/* Aurora blob 2 - Emerald accent */}
        <div className="absolute top-1/4 right-1/3 w-[280px] h-[200px] bg-emerald-500/30 blur-[90px] rounded-full animate-aurora-2" />
        {/* Aurora blob 3 - Blue/Indigo */}
        <div className="absolute bottom-1/3 left-1/3 w-[320px] h-[180px] bg-blue-500/35 blur-[85px] rounded-full animate-aurora-3" />
        {/* Aurora blob 4 - Purple wave */}
        <div className="absolute bottom-1/4 right-1/4 w-[260px] h-[160px] bg-indigo-500/25 blur-[80px] rounded-full animate-aurora-4" />
      </div>

      {/* Ambient glow behind card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-gradient-radial from-cyan-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl animate-glow-pulse" />

      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />

      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:64px_64px] opacity-50" />

      {/* Login card */}
      <div className="relative w-full max-w-sm mx-4 animate-card-entrance">
        {/* Card glow effect */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/10 to-transparent opacity-50" />

        <div className="relative bg-[#0d1424]/90 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-3">
              <span className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400">
                ACE Relay
              </span>
            </Link>
            <p className="text-slate-500 text-sm font-light opacity-0 animate-float-up animate-delay-200">
              登录以访问转发控制台
            </p>
          </div>

          {/* SSO Button */}
          <Button
            onClick={handleLogin}
            variant="glass"
            size="lg"
            className="w-full justify-center py-3.5 rounded-xl opacity-0 animate-float-up animate-delay-300 group"
          >
            {/* LinuxDo icon */}
            <div className="w-5 h-5 rounded-full overflow-hidden border border-white/20 flex flex-col">
              <div className="flex-[1] bg-[#2d2d2d]" />
              <div className="flex-[1.5] bg-[#f5f5f5]" />
              <div className="flex-[1] bg-[#f0a030]" />
            </div>
            <span className="font-light">使用 LinuxDo 登录</span>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-all duration-200 group-hover:translate-x-0.5" />
          </Button>

          {/* Hint text */}
          <p className="text-center text-slate-600 text-xs mt-4 opacity-0 animate-float-up animate-delay-400">
            首次登录将自动创建账户
          </p>
        </div>

        {/* Back link */}
        <div className="relative z-10 text-center mt-8 opacity-0 animate-float-up animate-delay-500">
          <Button
            variant="ghost"
            asChild
            className="rounded-full bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.12] text-slate-500 hover:text-slate-300 font-light group"
          >
            <Link href="/">
              <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
              <span>返回首页</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
