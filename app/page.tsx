import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#0a0f1a] overflow-hidden animate-page-fade-in">
      {/* Ambient light effects */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-cyan-500/8 via-blue-500/4 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-gradient-radial from-indigo-500/6 to-transparent rounded-full blur-3xl" />

      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />

      <Header />

      <main className="relative flex min-h-screen flex-col items-center justify-center px-6">
        <div className="text-center space-y-8">
          {/* Title with Aurora */}
          <div className="relative inline-block opacity-0 animate-scale-in">
            {/* Aurora background effect - centered behind title */}
            <div className="absolute -inset-x-48 -inset-y-24 pointer-events-none">
              {/* Aurora blob 1 - Main cyan */}
              <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[300px] h-[200px] bg-cyan-500/60 blur-[80px] rounded-full animate-aurora-1" />
              {/* Aurora blob 2 - Green accent */}
              <div className="absolute top-1/3 right-1/4 w-[250px] h-[180px] bg-emerald-500/50 blur-[70px] rounded-full animate-aurora-2" />
              {/* Aurora blob 3 - Blue/Purple */}
              <div className="absolute bottom-1/3 left-1/3 w-[280px] h-[160px] bg-blue-500/55 blur-[75px] rounded-full animate-aurora-3" />
              {/* Aurora blob 4 - Indigo wave */}
              <div className="absolute top-1/2 right-1/3 -translate-y-1/2 w-[220px] h-[140px] bg-indigo-500/45 blur-[60px] rounded-full animate-aurora-4" />
            </div>

            <h1 className="relative text-6xl md:text-8xl font-semibold tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-400">
                ACE Relay
              </span>
            </h1>
          </div>

          {/* Elegant divider */}
          <div className="flex items-center justify-center gap-3 opacity-0 animate-float-up animate-delay-100">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-slate-600" />
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/60" />
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-slate-600" />
          </div>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-slate-400 font-light tracking-wide opacity-0 animate-float-up animate-delay-200">
            Augment Context Engine 请求转发服务
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-4 pt-6">
            {[
              { label: "实时转发", color: "emerald", delay: "animate-delay-300" },
              { label: "安全连接", color: "cyan", delay: "animate-delay-400" },
              { label: "请求日志", color: "blue", delay: "animate-delay-500" },
            ].map((item) => (
              <Badge
                key={item.label}
                variant="outline"
                className={cn(
                  "px-4 py-2 rounded-full bg-white/[0.03] border-white/[0.06] backdrop-blur-sm opacity-0 animate-float-up",
                  item.delay
                )}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      item.color === "emerald" && "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]",
                      item.color === "cyan" && "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]",
                      item.color === "blue" && "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]"
                    )}
                  />
                  <span className="text-sm text-slate-300 font-light">{item.label}</span>
                </div>
              </Badge>
            ))}
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
      </main>
    </div>
  );
}
